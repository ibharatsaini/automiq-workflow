import { create } from "zustand";
import { persist } from "zustand/middleware";
type Theme = "light" | "dark";
interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}
function apply(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark");
}
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggleTheme: () => {
        const n: Theme = get().theme === "light" ? "dark" : "light";
        apply(n);
        set({ theme: n });
      },
      setTheme: (t) => {
        apply(t);
        set({ theme: t });
      },
    }),
    { name: "automiq-theme" },
  ),
);
export function initTheme() {
  try {
    const s = localStorage.getItem("automiq-theme");
    if (s) apply(JSON.parse(s).state.theme);
  } catch {}
}
