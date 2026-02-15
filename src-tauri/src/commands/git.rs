use git2::{Repository, StatusOptions, Status};
use serde::Serialize;
use std::process::Command;

#[derive(Serialize, Clone)]
pub struct GitFileEntry {
    pub path: String,
    pub status: String, // "new" | "modified" | "deleted"
}

#[derive(Serialize)]
pub struct GitStatusResult {
    pub branch: String,
    pub staged: Vec<GitFileEntry>,
    pub unstaged: Vec<GitFileEntry>,
    pub untracked: Vec<String>,
}

#[derive(Serialize)]
pub struct GitLogEntry {
    pub oid: String,
    pub message: String,
    pub timestamp: i64,
}

#[tauri::command]
pub fn git_status(path: String) -> Result<GitStatusResult, String> {
    let repo =
        Repository::open(&path).map_err(|e| format!("Failed to open repo at {}: {}", path, e))?;

    // Get branch name
    let branch = if repo.is_empty().unwrap_or(true) {
        "main".to_string()
    } else {
        repo.head()
            .ok()
            .and_then(|h| h.shorthand().map(|s| s.to_string()))
            .unwrap_or_else(|| "HEAD".to_string())
    };

    let mut opts = StatusOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(true);

    let statuses = repo
        .statuses(Some(&mut opts))
        .map_err(|e| format!("Failed to get statuses: {}", e))?;

    let mut staged = Vec::new();
    let mut unstaged = Vec::new();
    let mut untracked = Vec::new();

    for entry in statuses.iter() {
        let file_path = entry.path().unwrap_or("").to_string();
        let s = entry.status();

        // Untracked
        if s.contains(Status::WT_NEW) && !s.intersects(Status::INDEX_NEW | Status::INDEX_MODIFIED | Status::INDEX_DELETED | Status::INDEX_RENAMED) {
            untracked.push(file_path.clone());
            continue;
        }

        // Staged (INDEX_* flags)
        if s.intersects(Status::INDEX_NEW | Status::INDEX_MODIFIED | Status::INDEX_DELETED | Status::INDEX_RENAMED) {
            let status_str = if s.contains(Status::INDEX_NEW) {
                "new"
            } else if s.contains(Status::INDEX_DELETED) {
                "deleted"
            } else {
                "modified"
            };
            staged.push(GitFileEntry {
                path: file_path.clone(),
                status: status_str.to_string(),
            });
        }

        // Unstaged (WT_* flags, excluding WT_NEW which is untracked)
        if s.intersects(Status::WT_MODIFIED | Status::WT_DELETED | Status::WT_RENAMED) {
            let status_str = if s.contains(Status::WT_DELETED) {
                "deleted"
            } else {
                "modified"
            };
            unstaged.push(GitFileEntry {
                path: file_path,
                status: status_str.to_string(),
            });
        }
    }

    Ok(GitStatusResult {
        branch,
        staged,
        unstaged,
        untracked,
    })
}

#[tauri::command]
pub fn git_log(path: String, limit: usize) -> Result<Vec<GitLogEntry>, String> {
    let repo =
        Repository::open(&path).map_err(|e| format!("Failed to open repo at {}: {}", path, e))?;

    if repo.is_empty().unwrap_or(true) {
        return Ok(Vec::new());
    }

    let head = repo
        .head()
        .map_err(|e| format!("Failed to get HEAD: {}", e))?;
    let head_oid = head
        .target()
        .ok_or_else(|| "HEAD has no target".to_string())?;

    let mut revwalk = repo
        .revwalk()
        .map_err(|e| format!("Failed to create revwalk: {}", e))?;
    revwalk
        .push(head_oid)
        .map_err(|e| format!("Failed to push HEAD: {}", e))?;

    let mut entries = Vec::new();
    for oid_result in revwalk {
        if entries.len() >= limit {
            break;
        }
        let oid = oid_result.map_err(|e| format!("Revwalk error: {}", e))?;
        let commit = repo
            .find_commit(oid)
            .map_err(|e| format!("Failed to find commit: {}", e))?;

        entries.push(GitLogEntry {
            oid: oid.to_string(),
            message: commit.message().unwrap_or("").to_string(),
            timestamp: commit.time().seconds(),
        });
    }

    Ok(entries)
}

#[tauri::command]
pub fn git_stage_file(path: String, file_path: String) -> Result<(), String> {
    let repo =
        Repository::open(&path).map_err(|e| format!("Failed to open repo at {}: {}", path, e))?;
    let mut index = repo
        .index()
        .map_err(|e| format!("Failed to get index: {}", e))?;

    // Check if the file exists on disk to determine if it's a delete
    let full_path = std::path::Path::new(&path).join(&file_path);
    if full_path.exists() {
        index
            .add_path(std::path::Path::new(&file_path))
            .map_err(|e| format!("Failed to stage file: {}", e))?;
    } else {
        index
            .remove_path(std::path::Path::new(&file_path))
            .map_err(|e| format!("Failed to stage deleted file: {}", e))?;
    }

    index
        .write()
        .map_err(|e| format!("Failed to write index: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn git_unstage_file(path: String, file_path: String) -> Result<(), String> {
    let repo =
        Repository::open(&path).map_err(|e| format!("Failed to open repo at {}: {}", path, e))?;

    if repo.is_empty().unwrap_or(true) {
        // No HEAD yet — remove from index entirely
        let mut index = repo
            .index()
            .map_err(|e| format!("Failed to get index: {}", e))?;
        index
            .remove_path(std::path::Path::new(&file_path))
            .map_err(|e| format!("Failed to remove from index: {}", e))?;
        index
            .write()
            .map_err(|e| format!("Failed to write index: {}", e))?;
    } else {
        // Reset the file in the index to match HEAD
        let head = repo
            .head()
            .map_err(|e| format!("Failed to get HEAD: {}", e))?;
        let head_obj = head
            .peel(git2::ObjectType::Commit)
            .map_err(|e| format!("Failed to peel HEAD: {}", e))?;
        repo.reset_default(Some(&head_obj), [&file_path])
            .map_err(|e| format!("Failed to unstage file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn git_clone(url: String, path: String) -> Result<(), String> {
    // Use system git binary — it inherits the user's full auth config
    // (macOS Keychain, SSH agent, credential helpers, SSH config, etc.)
    let output = Command::new("git")
        .args(["clone", &url, &path])
        .output()
        .map_err(|e| format!("Failed to run git: {}. Is git installed?", e))?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Clone failed: {}", stderr.trim()))
    }
}
