import { useState } from 'react';
import { X, Loader2, FolderOpen } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

interface Props {
  onClose: () => void;
  onCloned: (path: string) => void;
}

export function CloneDialog({ onClose, onCloned }: Props) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [destination, setDestination] = useState('');
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBrowse() {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected) setDestination(selected as string);
    } catch {
      // User cancelled
    }
  }

  async function handleClone(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !destination.trim()) return;

    setCloning(true);
    setError(null);

    try {
      // Inject token into HTTPS URL if provided
      let cloneUrl = url.trim();
      if (token.trim()) {
        try {
          const parsed = new URL(cloneUrl);
          if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
            parsed.username = token.trim();
            parsed.password = '';
            cloneUrl = parsed.toString();
          }
        } catch {
          // Not a valid URL, pass as-is
        }
      }
      await invoke('git_clone', { url: cloneUrl, path: destination.trim() });
      onCloned(destination.trim());
    } catch (err) {
      setError(String(err));
    } finally {
      setCloning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
      <form
        onSubmit={handleClone}
        className="card w-full max-w-md mx-4 flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Clone from Git</h2>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="label" htmlFor="clone-url">Repository URL</label>
            <input
              id="clone-url"
              className="input"
              placeholder="https://github.com/user/repo.git"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="label" htmlFor="clone-token">Token <span className="text-text-muted font-normal">(optional)</span></label>
            <input
              id="clone-token"
              type="password"
              className="input"
              placeholder="ghp_xxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-[10px] text-text-muted mt-1">
              Personal access token for private HTTPS repos
            </p>
          </div>

          <div>
            <label className="label" htmlFor="clone-dest">Destination</label>
            <div className="flex gap-2">
              <input
                id="clone-dest"
                className="input flex-1"
                placeholder="/path/to/destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <button type="button" className="btn-secondary" onClick={handleBrowse}>
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded p-2">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!url.trim() || !destination.trim() || cloning}
          >
            {cloning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cloning...
              </>
            ) : (
              'Clone'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
