import { create } from 'zustand';
import type { SheetLocation, BreadcrumbSegment } from '../types/sheet';
import { useProjectStore } from './project-store';

function locationEquals(a: SheetLocation, b: SheetLocation): boolean {
  return a.level === b.level && a.domainId === b.domainId && a.flowId === b.flowId;
}

interface SheetState {
  current: SheetLocation;
  history: SheetLocation[];
  openTabs: SheetLocation[];

  navigateTo: (location: SheetLocation) => void;
  navigateUp: () => void;
  navigateToSystem: () => void;
  navigateToDomain: (domainId: string) => void;
  navigateToFlow: (domainId: string, flowId: string) => void;
  addTab: (location: SheetLocation) => void;
  removeTab: (index: number) => void;
  switchTab: (index: number) => void;
  getBreadcrumbs: () => BreadcrumbSegment[];
  reset: () => void;
}

export const useSheetStore = create<SheetState>((set, get) => ({
  current: { level: 'system' },
  history: [],
  openTabs: [{ level: 'system' }],

  navigateTo: (location) => {
    const current = get().current;
    const { openTabs } = get();
    const tabExists = openTabs.some((t) => locationEquals(t, location));
    set({
      current: location,
      history: [...get().history, current],
      openTabs: tabExists ? openTabs : [...openTabs, location],
    });
  },

  navigateUp: () => {
    const { current } = get();
    if (current.level === 'flow' && current.domainId) {
      get().navigateTo({ level: 'domain', domainId: current.domainId });
    } else if (current.level === 'domain') {
      get().navigateTo({ level: 'system' });
    }
  },

  navigateToSystem: () => {
    get().navigateTo({ level: 'system' });
  },

  navigateToDomain: (domainId) => {
    get().navigateTo({ level: 'domain', domainId });
  },

  navigateToFlow: (domainId, flowId) => {
    get().navigateTo({ level: 'flow', domainId, flowId });
  },

  addTab: (location) => {
    const { openTabs } = get();
    if (!openTabs.some((t) => locationEquals(t, location))) {
      set({ openTabs: [...openTabs, location] });
    }
  },

  removeTab: (index) => {
    const { openTabs, current } = get();
    if (openTabs.length <= 1) return;
    const removed = openTabs[index];
    const newTabs = openTabs.filter((_, i) => i !== index);
    if (locationEquals(removed, current)) {
      const newIndex = Math.min(index, newTabs.length - 1);
      set({ openTabs: newTabs, current: newTabs[newIndex] });
    } else {
      set({ openTabs: newTabs });
    }
  },

  switchTab: (index) => {
    const { openTabs } = get();
    if (index >= 0 && index < openTabs.length) {
      set({ current: openTabs[index] });
    }
  },

  getBreadcrumbs: () => {
    const { current } = get();
    const domainConfigs = useProjectStore.getState().domainConfigs;
    const segments: BreadcrumbSegment[] = [
      { label: 'System', location: { level: 'system' } },
    ];

    if (current.level === 'domain' || current.level === 'flow') {
      const domainId = current.domainId!;
      const domainName = domainConfigs[domainId]?.name ?? domainId;
      segments.push({
        label: domainName,
        location: { level: 'domain', domainId },
      });
    }

    if (current.level === 'flow') {
      const domainId = current.domainId!;
      const flowId = current.flowId!;
      const domain = domainConfigs[domainId];
      const flowName =
        domain?.flows.find((f) => f.id === flowId)?.name ?? flowId;
      segments.push({
        label: flowName,
        location: { level: 'flow', domainId, flowId },
      });
    }

    return segments;
  },

  reset: () => {
    set({ current: { level: 'system' }, history: [], openTabs: [{ level: 'system' }] });
  },
}));
