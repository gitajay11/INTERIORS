"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known on the client; render a stable icon until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "flex size-11 items-center justify-center rounded-sm transition-colors",
        className,
      )}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? (
        <Sun className="size-[1.125rem]" aria-hidden />
      ) : (
        <Moon className="size-[1.125rem]" aria-hidden />
      )}
    </button>
  );
}
