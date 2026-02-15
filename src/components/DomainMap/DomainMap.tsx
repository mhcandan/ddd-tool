import { useMemo, useCallback, useState, useEffect } from 'react';
import { Plus, RotateCcw, Copy, Check } from 'lucide-react';
import { useSheetStore } from '../../stores/sheet-store';
import { useProjectStore } from '../../stores/project-store';
import { useImplementationStore } from '../../stores/implementation-store';
import { useMemoryStore } from '../../stores/memory-store';
import { buildDomainMapData } from '../../utils/domain-parser';
import { FlowBlock } from './FlowBlock';
import { PortalNode } from './PortalNode';
import { DomainEventArrow } from './DomainEventArrow';
import { AddFlowDialog } from './AddFlowDialog';
import type { Position } from '../../types/sheet';

export function DomainMap() {
  const domainId = useSheetStore((s) => s.current.domainId);
  const domainConfigs = useProjectStore((s) => s.domainConfigs);
  const updateFlowPosition = useProjectStore((s) => s.updateFlowPosition);
  const updatePortalPosition = useProjectStore((s) => s.updatePortalPosition);
  const navigateToFlow = useSheetStore((s) => s.navigateToFlow);
  const navigateToDomain = useSheetStore((s) => s.navigateToDomain);

  const addFlow = useProjectStore((s) => s.addFlow);
  const deleteFlow = useProjectStore((s) => s.deleteFlow);
  const renameFlow = useProjectStore((s) => s.renameFlow);
  const reloadProject = useProjectStore((s) => s.reloadProject);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const implementationStatus = useMemoryStore((s) => s.implementationStatus);
  const driftItems = useImplementationStore((s) => s.driftItems);

  const staleFlowKeys = useMemo(() => {
    const keys = new Set<string>();
    // Check drift items from implementation store
    for (const drift of driftItems) {
      keys.add(drift.flowKey);
    }
    // Also check memory store's implementation status
    if (implementationStatus) {
      for (const [key, status] of Object.entries(implementationStatus.flows)) {
        if (status.status === 'stale') {
          keys.add(key);
        }
      }
    }
    return keys;
  }, [driftItems, implementationStatus]);

  const domainConfig = domainId ? domainConfigs[domainId] : null;

  const handleCreateFlow = useCallback(
    async (name: string, description: string, flowType: 'traditional' | 'agent', templateId?: string) => {
      if (!domainId) return;
      try {
        const flowId = await addFlow(domainId, name, description || undefined, flowType, templateId);
        setShowAddDialog(false);
        navigateToFlow(domainId, flowId);
      } catch {
        // TODO: error toast
      }
    },
    [domainId, addFlow, navigateToFlow]
  );

  const handleDeleteFlow = useCallback(
    (flowId: string) => {
      setPendingDelete(flowId);
    },
    []
  );

  const confirmDelete = useCallback(async () => {
    if (!domainId || !pendingDelete) return;
    try {
      await deleteFlow(domainId, pendingDelete);
    } catch {
      // Silent
    }
    setPendingDelete(null);
    setSelectedFlowId(null);
  }, [domainId, pendingDelete, deleteFlow]);

  // Backspace/Delete to prompt delete confirmation for selected flow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedFlowId) return;
      if (showAddDialog || pendingDelete) return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setPendingDelete(selectedFlowId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFlowId, showAddDialog, pendingDelete]);

  const mapData = useMemo(() => {
    if (!domainId || !domainConfig) return null;
    return buildDomainMapData(domainId, domainConfig, domainConfigs);
  }, [domainId, domainConfig, domainConfigs]);

  const handleFlowPositionChange = useCallback(
    (flowId: string, position: Position) => {
      if (domainId) updateFlowPosition(domainId, flowId, position);
    },
    [domainId, updateFlowPosition]
  );

  const handlePortalPositionChange = useCallback(
    (portalId: string, position: Position) => {
      if (domainId) updatePortalPosition(domainId, portalId, position);
    },
    [domainId, updatePortalPosition]
  );

  const handleFlowDoubleClick = useCallback(
    (flowId: string) => {
      if (domainId) navigateToFlow(domainId, flowId);
    },
    [domainId, navigateToFlow]
  );

  const handlePortalDoubleClick = useCallback(
    (portalId: string) => {
      navigateToDomain(portalId);
    },
    [navigateToDomain]
  );

  const handleRenameFlow = useCallback(
    async (flowId: string, newName: string) => {
      if (!domainId) return;
      try {
        await renameFlow(domainId, flowId, newName);
      } catch {
        // Silent
      }
    },
    [domainId, renameFlow]
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
    if (!domainId) return;
    navigator.clipboard.writeText(`/ddd-implement ${domainId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [domainId]);

  if (!mapData || (mapData.flows.length === 0 && mapData.portals.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <div className="text-center text-text-muted">
          <p className="text-lg font-medium mb-2">No Flows</p>
          <p className="text-sm mb-4">
            This domain has no flows yet.
          </p>
          <button
            className="btn-primary"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-4 h-4" />
            Add Flow
          </button>
        </div>
        {showAddDialog && (
          <AddFlowDialog
            onClose={() => setShowAddDialog(false)}
            onCreate={handleCreateFlow}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-bg-primary" onClick={() => setSelectedFlowId(null)}>
      {/* SVG arrow overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <marker
            id="domain-arrowhead"
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
          <DomainEventArrow
            key={arrow.id}
            arrow={arrow}
            flows={mapData.flows}
            portals={mapData.portals}
          />
        ))}
      </svg>

      {/* Flow blocks */}
      {mapData.flows.map((flow) => (
        <FlowBlock
          key={flow.id}
          flow={flow}
          selected={selectedFlowId === flow.id}
          isStale={domainId ? staleFlowKeys.has(`${domainId}/${flow.id}`) : false}
          onSelect={setSelectedFlowId}
          onPositionChange={handleFlowPositionChange}
          onDoubleClick={handleFlowDoubleClick}
          onDelete={handleDeleteFlow}
          onRename={handleRenameFlow}
        />
      ))}

      {/* Portal nodes */}
      {mapData.portals.map((portal) => (
        <PortalNode
          key={portal.id}
          portal={portal}
          onPositionChange={handlePortalPositionChange}
          onDoubleClick={handlePortalDoubleClick}
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
          title={`Copy /ddd-implement ${domainId} to clipboard`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Implement'}
        </button>
      </div>

      {/* Add Flow button */}
      <button
        className="absolute bottom-4 right-4 z-10 btn-primary rounded-full w-12 h-12 p-0 shadow-lg"
        onClick={() => setShowAddDialog(true)}
        title="Add Flow"
      >
        <Plus className="w-5 h-5" />
      </button>

      {showAddDialog && (
        <AddFlowDialog
          onClose={() => setShowAddDialog(false)}
          onCreate={handleCreateFlow}
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-[360px] space-y-4">
            <h3 className="text-sm font-semibold text-text-primary">Delete Flow</h3>
            <p className="text-sm text-text-secondary">
              Are you sure you want to delete <strong>{pendingDelete}</strong>? This will remove the flow and its YAML file.
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
