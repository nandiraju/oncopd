import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggle: () => {
        const next = get().theme === "light" ? "dark" : "light";
        applyTheme(next);
        set({ theme: next });
      },
      setTheme: (t) => {
        applyTheme(t);
        set({ theme: t });
      },
    }),
    {
      name: "oncopd-theme",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
