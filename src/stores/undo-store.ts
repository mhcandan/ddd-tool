import { create } from 'zustand';
import type { FlowDocument } from '../types/flow';
import { useFlowStore, setSkipUndo, registerUndoPush, registerUndoClear } from './flow-store';

interface FlowSnapshot {
  doc: FlowDocument;
  description: string;
  timestamp: number;
}

interface FlowStacks {
  undoStack: FlowSnapshot[];
  redoStack: FlowSnapshot[];
}

interface UndoState {
  stacks: Record<string, FlowStacks>;

  pushSnapshot: (flowId: string, description: string) => void;
  undo: (flowId: string) => void;
  redo: (flowId: string) => void;
  clearFlow: (flowId: string) => void;
  getLastDescription: (flowId: string, direction: 'undo' | 'redo') => string | null;
}

const MAX_STACK = 100;
const COALESCE_MS = 500;

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getStacks(state: UndoState, flowId: string): FlowStacks {
  return state.stacks[flowId] || { undoStack: [], redoStack: [] };
}

export const useUndoStore = create<UndoState>((set, get) => ({
  stacks: {},

  pushSnapshot: (flowId, description) => {
    const flow = useFlowStore.getState().currentFlow;
    if (!flow) return;

    const snapshot: FlowSnapshot = {
      doc: deepClone(flow),
      description,
      timestamp: Date.now(),
    };

    set((state) => {
      const prev = getStacks(state, flowId);
      const lastUndo = prev.undoStack[prev.undoStack.length - 1];

      // Coalesce if same description within COALESCE_MS
      if (
        lastUndo &&
        lastUndo.description === description &&
        snapshot.timestamp - lastUndo.timestamp < COALESCE_MS
      ) {
        // Replace last entry (keep the older snapshot, update timestamp)
        const newStack = [...prev.undoStack];
        newStack[newStack.length - 1] = {
          ...newStack[newStack.length - 1],
          timestamp: snapshot.timestamp,
        };
        return {
          stacks: {
            ...state.stacks,
            [flowId]: { undoStack: newStack, redoStack: [] },
          },
        };
      }

      const newStack = [...prev.undoStack, snapshot].slice(-MAX_STACK);
      return {
        stacks: {
          ...state.stacks,
          [flowId]: { undoStack: newStack, redoStack: [] },
        },
      };
    });
  },

  undo: (flowId) => {
    const stacks = getStacks(get(), flowId);
    if (stacks.undoStack.length === 0) return;

    const currentFlow = useFlowStore.getState().currentFlow;
    if (!currentFlow) return;

    const snapshot = stacks.undoStack[stacks.undoStack.length - 1];
    const newUndo = stacks.undoStack.slice(0, -1);

    // Push current state onto redo
    const redoSnapshot: FlowSnapshot = {
      doc: deepClone(currentFlow),
      description: snapshot.description,
      timestamp: Date.now(),
    };

    set((state) => ({
      stacks: {
        ...state.stacks,
        [flowId]: {
          undoStack: newUndo,
          redoStack: [...stacks.redoStack, redoSnapshot],
        },
      },
    }));

    // Restore without triggering undo push
    setSkipUndo(true);
    useFlowStore.getState().restoreFlow(snapshot.doc);
    setSkipUndo(false);
  },

  redo: (flowId) => {
    const stacks = getStacks(get(), flowId);
    if (stacks.redoStack.length === 0) return;

    const currentFlow = useFlowStore.getState().currentFlow;
    if (!currentFlow) return;

    const snapshot = stacks.redoStack[stacks.redoStack.length - 1];
    const newRedo = stacks.redoStack.slice(0, -1);

    // Push current state onto undo
    const undoSnapshot: FlowSnapshot = {
      doc: deepClone(currentFlow),
      description: snapshot.description,
      timestamp: Date.now(),
    };

    set((state) => ({
      stacks: {
        ...state.stacks,
        [flowId]: {
          undoStack: [...stacks.undoStack, undoSnapshot],
          redoStack: newRedo,
        },
      },
    }));

    // Restore without triggering undo push
    setSkipUndo(true);
    useFlowStore.getState().restoreFlow(snapshot.doc);
    setSkipUndo(false);
  },

  clearFlow: (flowId) => {
    set((state) => {
      const { [flowId]: _, ...rest } = state.stacks;
      return { stacks: rest };
    });
  },

  getLastDescription: (flowId, direction) => {
    const stacks = getStacks(get(), flowId);
    const stack = direction === 'undo' ? stacks.undoStack : stacks.redoStack;
    return stack.length > 0 ? stack[stack.length - 1].description : null;
  },
}));

// Register callbacks with flow-store to avoid circular imports
registerUndoPush((flowId, description) => {
  useUndoStore.getState().pushSnapshot(flowId, description);
});
registerUndoClear((flowId) => {
  useUndoStore.getState().clearFlow(flowId);
});
