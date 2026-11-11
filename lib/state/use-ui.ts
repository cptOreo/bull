import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  commandPaletteOpen: boolean;
  toasts: Array<{ id: string; message: string; type: "info" | "success" | "error" | "warning" }>;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setCommandPaletteOpen: (open: boolean) => void;
  addToast: (message: string, type: "info" | "success" | "error" | "warning") => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: false,
      theme: "system",
      commandPaletteOpen: false,
      toasts: [],
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      addToast: (message, type) => set((state) => ({
        toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }],
      })),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id),
      })),
    }),
    { name: "bull-v2-ui", version: 1 }
  )
);

export function useUI() {
  return useUIStore();
}