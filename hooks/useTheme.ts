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

// ── sunrise/sunset calculation ──
function getSunTimes(lat: number, lng: number, date: Date): { sunrise: number; sunset: number } {
  const toRad = Math.PI / 180;
  const zenith = 90.833 * toRad;
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000) + 1;
  // solar declination
  const dec = 23.45 * toRad * Math.sin(toRad * (360 / 365) * (284 + dayOfYear));
  // equation of time (minutes)
  const B = toRad * (360 / 365) * (dayOfYear - 81);
  const eqTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  // solar noon (UTC hours)
  const solarNoon = 12 - lng / 15 - eqTime / 60;
  // hour angle
  const cosHA = (Math.cos(zenith) - Math.sin(lat * toRad) * Math.sin(dec)) / (Math.cos(lat * toRad) * Math.cos(dec));
  if (cosHA > 1) return { sunrise: 0, sunset: 24 * 60 };   // polar night
  if (cosHA < -1) return { sunrise: 0, sunset: 0 };          // polar day
  const ha = Math.acos(cosHA) * (180 / Math.PI) / 15;       // hours
  // UTC → local time
  const offset = -date.getTimezoneOffset() / 60;
  const sunrise = ((solarNoon - ha + offset) % 24 + 24) % 24;
  const sunset = ((solarNoon + ha + offset) % 24 + 24) % 24;
  return { sunrise: sunrise * 60, sunset: sunset * 60 };
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

  const sunTimes = coords ? getSunTimes(coords.lat, coords.lng, new Date()) : null;

  return { theme, toggleTheme, themeMode, schedule, coords, sunTimes, setThemeMode, setSchedule, setCoords, isDark: theme === "dark" };
}
