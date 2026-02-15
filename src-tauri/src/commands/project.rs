use git2::{Repository, Signature};

#[tauri::command]
pub fn git_init(path: String) -> Result<(), String> {
    Repository::init(&path).map_err(|e| format!("Failed to init git repo at {}: {}", path, e))?;
    Ok(())
}

#[tauri::command]
pub fn git_add_all(path: String) -> Result<(), String> {
    let repo =
        Repository::open(&path).map_err(|e| format!("Failed to open repo at {}: {}", path, e))?;
    let mut index = repo
        .index()
        .map_err(|e| format!("Failed to get index: {}", e))?;
    index
        .add_all(["*"].iter(), git2::IndexAddOption::DEFAULT, None)
        .map_err(|e| format!("Failed to add files: {}", e))?;
    index
        .write()
        .map_err(|e| format!("Failed to write index: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn git_commit(path: String, message: String) -> Result<String, String> {
    let repo =
        Repository::open(&path).map_err(|e| format!("Failed to open repo at {}: {}", path, e))?;
    let mut index = repo
        .index()
        .map_err(|e| format!("Failed to get index: {}", e))?;
    let tree_oid = index
        .write_tree()
        .map_err(|e| format!("Failed to write tree: {}", e))?;
    let tree = repo
        .find_tree(tree_oid)
        .map_err(|e| format!("Failed to find tree: {}", e))?;
    let sig =
        Signature::now("DDD Tool", "ddd-tool@local").map_err(|e| format!("Signature: {}", e))?;

    let parent_commit = repo.head().ok().and_then(|head| head.peel_to_commit().ok());
    let parents: Vec<&git2::Commit> = parent_commit.iter().collect();

    let oid = repo
        .commit(Some("HEAD"), &sig, &sig, &message, &tree, &parents)
        .map_err(|e| format!("Failed to commit: {}", e))?;

    Ok(oid.to_string())
}
