export interface GitFileEntry {
  path: string;
  status: 'new' | 'modified' | 'deleted';
}

export interface GitStatusResult {
  branch: string;
  staged: GitFileEntry[];
  unstaged: GitFileEntry[];
  untracked: string[];
}

export interface GitLogEntry {
  oid: string;
  message: string;
  timestamp: number;
}
