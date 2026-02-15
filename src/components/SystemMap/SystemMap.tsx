import { useMemo, useCallback, useState, useEffect } from 'react';
import { Plus, RotateCcw, Copy, Check } from 'lucide-react';
import { useProjectStore } from '../../stores/project-store';
import { useSheetStore } from '../../stores/sheet-store';
import { buildSystemMapData } from '../../utils/domain-parser';
import { DomainBlock } from './DomainBlock';
import { EventArrow } from './EventArrow';
import { AddDomainDialog } from './AddDomainDialog';
import type { Position } from '../../types/sheet';

export function SystemMap() {
  const domainConfigs = useProjectStore((s) => s.domainConfigs);
  const systemLayout = useProjectStore((s) => s.systemLayout);
  const updateDomainPosition = useProjectStore((s) => s.updateDomainPosition);
  const addDomain = useProjectStore((s) => s.addDomain);
  const deleteDomain = useProjectStore((s) => s.deleteDomain);
  const renameDomain = useProjectStore((s) => s.renameDomain);
  const navigateToDomain = useSheetStore((s) => s.navigateToDomain);

  const reloadProject = useProjectStore((s) => s.reloadProject);

  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const mapData = useMemo(
    () => buildSystemMapData(domainConfigs, systemLayout),
    [domainConfigs, systemLayout]
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      await deleteDomain(pendingDelete);
    } catch {
      // Silent
    }
    setPendingDelete(null);
    setSelectedDomainId(null);
  }, [pendingDelete, deleteDomain]);

  const handleCreateDomain = useCallback(
    async (name: string, description: string) => {
      try {
        await addDomain(name, description || undefined);
        setShowAddDialog(false);
      } catch {
        // TODO: error toast
      }
    },
    [addDomain]
  );

  const handleRename = useCallback(
    async (domainId: string, newName: string) => {
      try {
        await renameDomain(domainId, newName);
      } catch {
        // Silent
      }
    },
    [renameDomain]
  );

  const handleReload = useCallback(async () => {
    setReloading(true);
    try {
      await reloadProject();
    } finally {
      setTimeout(() => setReloading(false), 600);
    }
  }, [reloadProject]);

  const handleCopyImplement = useCallback(() => {
    navigator.clipboard.writeText('/ddd-implement --all');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // Backspace/Delete to prompt delete confirmation for selected domain
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDomainId) return;
      if (pendingDelete || showAddDialog) return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setPendingDelete(selectedDomainId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDomainId, pendingDelete, showAddDialog]);

  const handlePositionChange = useCallback(
    (domainId: string, position: Position) => {
      updateDomainPosition(domainId, position);
    },
    [updateDomainPosition]
  );

  const handleDoubleClick = useCallback(
    (domainId: string) => {
      navigateToDomain(domainId);
    },
    [navigateToDomain]
  );

  if (mapData.domains.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <div className="text-center text-text-muted">
          <p className="text-lg font-medium mb-2">No Domains</p>
          <p className="text-sm mb-4">
            This project has no domains yet.
          </p>
          <button
            className="btn-primary"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4" />
            Add Domain
          </button>
        </div>
        {showAddDialog && (
          <AddDomainDialog
            onClose={() => setShowAddDialog(false)}
            onCreate={handleCreateDomain}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden bg-bg-primary" onClick={() => setSelectedDomainId(null)}>
      {/* SVG arrow overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="var(--color-text-muted)"
            />
          </marker>
        </defs>
        {mapData.eventArrows.map((arrow) => (
          <EventArrow
            key={arrow.id}
            arrow={arrow}
            domains={mapData.domains}
          />
        ))}
      </svg>

      {/* Domain blocks */}
      {mapData.domains.map((domain) => (
        <DomainBlock
          key={domain.id}
          domain={domain}
          selected={selectedDomainId === domain.id}
          onSelect={setSelectedDomainId}
          onPositionChange={handlePositionChange}
          onDoubleClick={handleDoubleClick}
          onRename={handleRename}
        />
      ))}

      {/* Reload + Copy Implement buttons */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2">
        <button
          className="btn-secondary rounded-lg px-3 py-2 shadow-lg flex items-center gap-1.5 text-xs"
          onClick={handleReload}
          title="Reload project from disk (Cmd+R)"
          disabled={reloading}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} />
          {reloading ? 'Reloading…' : 'Reload'}
        </button>
        <button
          className="btn-secondary rounded-lg px-3 py-2 shadow-lg flex items-center gap-1.5 text-xs"
          onClick={handleCopyImplement}
          title="Copy /ddd-implement --all to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Implement'}
        </button>
      </div>

      {/* Add Domain button */}
      <button
        className="absolute bottom-4 right-4 z-10 btn-primary rounded-full w-12 h-12 p-0 shadow-lg"
        onClick={() => setShowAddDialog(true)}
        title="Add Domain"
      >
        <Plus className="w-5 h-5" />
      </button>

      {showAddDialog && (
        <AddDomainDialog
          onClose={() => setShowAddDialog(false)}
          onCreate={handleCreateDomain}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-[360px] space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Delete Domain</h3>
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <strong>{pendingDelete}</strong>? This will remove the domain and all its flows.
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
