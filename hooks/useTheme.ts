"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
type ThemeMode = "manual" | "system" | "schedule" | "sun";

const listeners = new Set<() => void>();

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getSnapshot(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme { return "light"; }

function resolveSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveScheduledTheme(darkStart: string, darkEnd: string): Theme {
  const hhmm = new Date().getHours() * 60 + new Date().getMinutes();
  const [sh, sm] = darkStart.split(":").map(Number);
  const [eh, em] = darkEnd.split(":").map(Number);
  const start = sh * 60 + sm, end = eh * 60 + em;
  if (start < end) return hhmm >= start && hhmm < end ? "dark" : "light";
  return hhmm >= start || hhmm < end ? "dark" : "light";
}

// ── sunrise/sunset calculation (NOAA) ──
function getSunTimes(lat: number, lng: number, date: Date): { sunrise: number; sunset: number } {
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const zenith = 90.833 * toRad;
  const lngHour = lng / 15;
  const tRise = dayOfYear + ((6 - lngHour) / 24);
  const tSet = dayOfYear + ((18 - lngHour) / 24);
  function calc(t: number) {
    const M = (0.9856 * t - 3.289) * toRad;
    const L = (M + (1.916 * Math.sin(M) + 0.020 * Math.sin(2 * M) + 282.634) * toRad) % (2 * Math.PI);
    const RA = Math.atan2(0.91746 * Math.sin(L), Math.cos(L));
    const dec = Math.asin(0.39782 * Math.sin(L));
    const cosH = (Math.cos(zenith) - Math.sin(lat * toRad) * Math.sin(dec)) / (Math.cos(lat * toRad) * Math.cos(dec));
    if (cosH > 1) return -1; // never sets
    if (cosH < -1) return -2; // never rises
    return (Math.acos(cosH) * toDeg) / 15;
  }
  const haRise = calc(tRise), haSet = calc(tSet);
  const utRise = (6 - lngHour) - haRise, utSet = (18 - lngHour) + haSet;
  const tz = -date.getTimezoneOffset() / 60;
  const minutesRise = ((utRise + tz) % 24 + 24) % 24;
  const minutesSet = ((utSet + tz) % 24 + 24) % 24;
  const sunrise = minutesRise * 60;
  const sunset = minutesSet * 60;
  return { sunrise, sunset };
}

function resolveSunTheme(lat: number, lng: number): Theme {
  try {
    const { sunrise, sunset } = getSunTimes(lat, lng, new Date());
    const now = new Date().getHours() * 60 + new Date().getMinutes();
    return now < sunrise || now >= sunset ? "dark" : "light";
  } catch {
    return "dark";
  }
}

function loadMode(): ThemeMode {
  try { return (localStorage.getItem("pi-theme-mode") as ThemeMode) || "manual"; }
  catch { return "manual"; }
}

function loadSchedule() {
  try { const r = localStorage.getItem("pi-theme-schedule"); if (r) return JSON.parse(r); } catch { /* */ }
  return { darkStart: "18:00", darkEnd: "06:00" };
}

function loadCoords() {
  try { const r = localStorage.getItem("pi-theme-coords"); if (r) return JSON.parse(r); } catch { /* */ }
  return null as { lat: number; lng: number } | null;
}

function applyTheme(next: Theme) {
  if (next === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
  try { localStorage.setItem("pi-theme", next); } catch { /* */ }
  listeners.forEach((cb) => cb());
}

type ToggleOrigin = { x: number; y: number };

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(loadMode);
  const [schedule, setScheduleState] = useState(loadSchedule);
  const [coords, setCoordsState] = useState<{ lat: number; lng: number } | null>(loadCoords);

  useEffect(() => {
    if (themeMode === "manual") return;
    if (themeMode === "sun" && !coords) return; // wait for location

    const resolve = (): Theme => {
      if (themeMode === "system") return resolveSystemTheme();
      if (themeMode === "schedule") return resolveScheduledTheme(schedule.darkStart, schedule.darkEnd);
      if (themeMode === "sun" && coords) return resolveSunTheme(coords.lat, coords.lng);
      return "dark";
    };

    applyTheme(resolve());

    if (themeMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => applyTheme(resolveSystemTheme());
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    const interval = setInterval(() => {
      const t = resolve();
      if (getSnapshot() !== t) applyTheme(t);
    }, 60_000);
    return () => clearInterval(interval);
  }, [themeMode, schedule, coords]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    try { localStorage.setItem("pi-theme-mode", mode); } catch { /* */ }
    setThemeModeState(mode);
  }, []);

  const setSchedule = useCallback((darkStart: string, darkEnd: string) => {
    const s = { darkStart, darkEnd };
    try { localStorage.setItem("pi-theme-schedule", JSON.stringify(s)); } catch { /* */ }
    setScheduleState(s);
    if (themeMode === "schedule") applyTheme(resolveScheduledTheme(darkStart, darkEnd));
  }, [themeMode]);

  const setCoords = useCallback((lat: number, lng: number) => {
    const c = { lat, lng };
    try { localStorage.setItem("pi-theme-coords", JSON.stringify(c)); } catch { /* */ }
    setCoordsState(c);
    if (themeMode === "sun") applyTheme(resolveSunTheme(lat, lng));
  }, [themeMode]);

  const toggleTheme = useCallback((origin?: ToggleOrigin) => {
    const next: Theme = getSnapshot() === "dark" ? "light" : "dark";
    if (themeMode !== "manual") setThemeMode("manual");

    const apply = () => { applyTheme(next); };
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const supportsVT = typeof document.startViewTransition === "function";
    if (!supportsVT || reduceMotion) { apply(); return; }

    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    document.startViewTransition(apply).ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
          { duration: 450, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
  }, [themeMode]);

  return { theme, toggleTheme, themeMode, schedule, coords, setThemeMode, setSchedule, setCoords, isDark: theme === "dark" };
}
