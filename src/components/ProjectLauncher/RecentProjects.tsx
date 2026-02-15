import { FolderOpen, Trash2, Clock } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

export function RecentProjects() {
  const recentProjects = useAppStore((s) => s.recentProjects);
  const removeRecentProject = useAppStore((s) => s.removeRecentProject);
  const openProject = useAppStore((s) => s.openProject);

  if (recentProjects.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No recent projects</p>
        <p className="text-xs mt-1">Create a new project to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recentProjects.map((project) => (
        <div
          key={project.path}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-bg-hover cursor-pointer group"
          onClick={() => openProject(project.path)}
        >
          <FolderOpen className="w-5 h-5 text-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {project.name}
            </p>
            <p className="text-xs text-text-muted truncate">{project.path}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(project.lastOpenedAt)}
            </span>
            <button
              className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                removeRecentProject(project.path);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
