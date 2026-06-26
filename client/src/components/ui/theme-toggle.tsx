import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/store/theme.store";
import { cn } from "@/lib/utils";
interface Props {
  className?: string;
  variant?: "icon" | "pill";
}
export function ThemeToggle({ className, variant = "icon" }: Props) {
  const { theme, toggleTheme } = useThemeStore();
  if (variant === "pill") {
    return (
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className={cn(
          "relative flex h-7 w-14 items-center rounded-full border border-sidebar-border bg-sidebar-accent/50 p-1 transition-colors hover:bg-sidebar-accent",
          className,
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full bg-white/10 shadow-sm transition-transform duration-300",
            theme === "dark" ? "translate-x-7" : "translate-x-0",
          )}
        >
          {theme === "dark" ? (
            <Moon className="h-3 w-3 text-blue-300" />
          ) : (
            <Sun className="h-3 w-3 text-amber-300" />
          )}
        </span>
      </button>
    );
  }
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
