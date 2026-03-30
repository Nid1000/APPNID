"use client";
import React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="theme-surface-strong theme-hover inline-flex items-center justify-center rounded-xl border p-2 transition-colors"
    >
      {isDark ? <Sun size={18} className="text-[var(--color-primary)]" /> : <Moon size={18} className="text-[var(--color-secondary)]" />}
    </button>
  );
}
