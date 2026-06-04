"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

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
  // overnight (e.g. 18:00-06:00): dark from start to midnight OR midnight to end
  return hhmm >= start || hhmm < end ? "dark" : "light";
}

function getStoredMode(): ThemeMode {
  try { return (localStorage.getItem("pi-theme-mode") as ThemeMode) || "manual"; }
  catch { return "manual"; }
}

function getStoredSchedule(): { darkStart: string; darkEnd: string } {
  try {
    const raw = localStorage.getItem("pi-theme-schedule");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { darkStart: "18:00", darkEnd: "06:00" };
}

type ToggleOrigin = { x: number; y: number };

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Auto-apply theme based on mode
  useEffect(() => {
    const mode = getStoredMode();
    if (mode === "manual") return;

    let next: Theme;
    if (mode === "system") {
      next = resolveSystemTheme();
    } else {
      const s = getStoredSchedule();
      next = resolveScheduledTheme(s.darkStart, s.darkEnd);
    }

    const apply = () => {
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      try { localStorage.setItem("pi-theme", next); } catch { /* */ }
      listeners.forEach((cb) => cb());
    };

    apply();

    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => {
        const t = resolveSystemTheme();
        if (t === "dark") document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        try { localStorage.setItem("pi-theme", t); } catch { /* */ }
        listeners.forEach((cb) => cb());
      };
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    if (mode === "schedule") {
      // Check every minute for schedule change
      const interval = setInterval(() => {
        const s = getStoredSchedule();
        const t = resolveScheduledTheme(s.darkStart, s.darkEnd);
        if (getSnapshot() !== t) {
          if (t === "dark") document.documentElement.classList.add("dark");
          else document.documentElement.classList.remove("dark");
          try { localStorage.setItem("pi-theme", t); } catch { /* */ }
          listeners.forEach((cb) => cb());
        }
      }, 60_000);
      return () => clearInterval(interval);
    }
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    try { localStorage.setItem("pi-theme-mode", mode); } catch { /* */ }
    if (mode === "manual") return;
    const next = mode === "system"
      ? resolveSystemTheme()
      : resolveScheduledTheme(getStoredSchedule().darkStart, getStoredSchedule().darkEnd);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try { localStorage.setItem("pi-theme", next); } catch { /* */ }
    listeners.forEach((cb) => cb());
  }, []);

  const setSchedule = useCallback((darkStart: string, darkEnd: string) => {
    try { localStorage.setItem("pi-theme-schedule", JSON.stringify({ darkStart, darkEnd })); } catch { /* */ }
    const next = resolveScheduledTheme(darkStart, darkEnd);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try { localStorage.setItem("pi-theme", next); } catch { /* */ }
    listeners.forEach((cb) => cb());
  }, []);

  const toggleTheme = useCallback((origin?: ToggleOrigin) => {
    // Only used in manual mode toggle
    const current = getSnapshot();
    const next: Theme = current === "dark" ? "light" : "dark";

    // If auto mode is active, switch to manual first
    const mode = getStoredMode();
    if (mode !== "manual") {
      try { localStorage.setItem("pi-theme-mode", "manual"); } catch { /* */ }
    }

    const apply = () => {
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      try { localStorage.setItem("pi-theme", next); } catch { /* */ }
      listeners.forEach((cb) => cb());
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
  }, []);

  const themeMode = getStoredMode();
  const schedule = getStoredSchedule();

  return { theme, toggleTheme, themeMode, schedule, setThemeMode, setSchedule, isDark: theme === "dark" };
}
