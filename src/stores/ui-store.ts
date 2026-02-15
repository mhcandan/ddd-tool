import { create } from 'zustand';

interface UiState {
  minimapVisible: boolean;
  toggleMinimap: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  minimapVisible: true,
  toggleMinimap: () => set((s) => ({ minimapVisible: !s.minimapVisible })),
}));
