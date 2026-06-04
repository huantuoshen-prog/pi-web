"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
type ThemeMode = "manual" | "system" | "schedule";

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getSnapshot(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function resolveSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveScheduledTheme(darkStart: string, darkEnd: string): Theme {
  const now = new Date();
  const hhmm = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = darkStart.split(":").map(Number);
  const [eh, em] = darkEnd.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  if (start < end) return hhmm >= start && hhmm < end ? "dark" : "light";
  return hhmm >= start || hhmm < end ? "dark" : "light";
}

function loadMode(): ThemeMode {
  try { return (localStorage.getItem("pi-theme-mode") as ThemeMode) || "manual"; }
  catch { return "manual"; }
}

function loadSchedule(): { darkStart: string; darkEnd: string } {
  try {
    const raw = localStorage.getItem("pi-theme-schedule");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { darkStart: "18:00", darkEnd: "06:00" };
}

function applyTheme(next: Theme) {
  if (next === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  try { localStorage.setItem("pi-theme", next); } catch { /* */ }
  listeners.forEach((cb) => cb());
}

type ToggleOrigin = { x: number; y: number };

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(loadMode);
  const [schedule, setScheduleState] = useState(loadSchedule);

  // Auto-apply theme based on mode
  useEffect(() => {
    if (themeMode === "manual") return;

    const apply = () => {
      const next = themeMode === "system"
        ? resolveSystemTheme()
        : resolveScheduledTheme(schedule.darkStart, schedule.darkEnd);
      applyTheme(next);
    };

    apply();

    if (themeMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => applyTheme(resolveSystemTheme());
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    if (themeMode === "schedule") {
      const interval = setInterval(() => {
        const s = loadSchedule();
        const t = resolveScheduledTheme(s.darkStart, s.darkEnd);
        if (getSnapshot() !== t) applyTheme(t);
      }, 60_000);
      return () => clearInterval(interval);
    }
  }, [themeMode, schedule]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    try { localStorage.setItem("pi-theme-mode", mode); } catch { /* */ }
    setThemeModeState(mode);
  }, []);

  const setSchedule = useCallback((darkStart: string, darkEnd: string) => {
    const s = { darkStart, darkEnd };
    try { localStorage.setItem("pi-theme-schedule", JSON.stringify(s)); } catch { /* */ }
    setScheduleState(s);
    if (themeMode === "schedule") {
      applyTheme(resolveScheduledTheme(darkStart, darkEnd));
    }
  }, [themeMode]);

  const toggleTheme = useCallback((origin?: ToggleOrigin) => {
    const current = getSnapshot();
    const next: Theme = current === "dark" ? "light" : "dark";

    if (themeMode !== "manual") {
      setThemeMode("manual");
    }

    const apply = () => {
      applyTheme(next);
    };

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const supportsVT = typeof document.startViewTransition === "function";

    if (!supportsVT || reduceMotion) {
      apply();
      return;
    }

    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(apply);
    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 450,
            easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => { /* transition cancelled */ });
  }, [themeMode]);

  return { theme, toggleTheme, themeMode, schedule, setThemeMode, setSchedule, isDark: theme === "dark" };
}
