import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  // Determine the next theme and icon dynamically
  const isDarkMode = theme === "dark";
  const nextTheme = isDarkMode ? "light" : "dark";
  const Icon = isDarkMode ? Sun : Moon;

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={`Switch to ${nextTheme} mode`}
      onClick={() => setTheme(nextTheme)}
      className="flex items-center justify-center transition-transform hover:scale-110"
    >
      <Icon
        className={`h-[1.5rem] w-[1.5rem] ${
          isDarkMode ? "text-yellow-500" : "text-blue-500"
        }`}
        aria-hidden="true"
      />
      <span className="sr-only">{`Switch to ${nextTheme} mode`}</span>
    </Button>
  );
}
