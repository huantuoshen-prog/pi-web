"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface VisibleButtons {
  sidebar: boolean;
  locale: boolean;
  theme: boolean;
  branch: boolean;
  system: boolean;
  filePanel: boolean;
}

const STORAGE_KEY = "pi-web-topbar-buttons";

const defaults: VisibleButtons = {
  sidebar: true,
  locale: true,
  theme: true,
  branch: true,
  system: true,
  filePanel: true,
};

function loadVisible(): VisibleButtons {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaults };
}

function saveVisible(v: VisibleButtons) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

interface Props {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  isDark: boolean;
  systemPrompt: string | null;
  hasActiveSession: boolean;
  onToggleSidebar: () => void;
  onToggleRightPanel: () => void;
  onToggleTheme: (origin?: { x: number; y: number }) => void;
  onSwitchLocale: (locale: string) => void;
  currentLocale: string;
  onClose: () => void;
  onVisibilityChange: (v: VisibleButtons) => void;
}

export function SettingsConfig({
  sidebarOpen, rightPanelOpen, isDark, systemPrompt, hasActiveSession,
  onToggleSidebar, onToggleRightPanel, onToggleTheme, onSwitchLocale,
  currentLocale, onClose, onVisibilityChange,
}: Props) {
  const sh = useTranslations("shell");
  const [visible, setVisible] = useState<VisibleButtons>(loadVisible);

  useEffect(() => {
    onVisibilityChange(visible);
    saveVisible(visible);
  }, [visible, onVisibilityChange]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const Toggle = ({ labelKey, value, onChange }: { labelKey: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}
    >
      <span style={{ fontSize: 13, color: "var(--text)" }}>{sh(labelKey as any)}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
          background: value ? "var(--accent)" : "var(--border)",
          position: "relative", transition: "background 0.15s", flexShrink: 0,
        }}
        aria-pressed={value}
      >
        <div style={{
          position: "absolute", top: 2, left: value ? 18 : 2, width: 16, height: 16,
          borderRadius: 8, background: "#fff", transition: "left 0.15s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }} />
      </button>
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>
      {children}
    </div>
  );

  // Collect function Item components
  type FnItem = { labelKey: string; control: React.ReactNode };
  const fnItems: FnItem[] = [
    {
      labelKey: "sidebarToggle",
      control: (
        <button
          onClick={onToggleSidebar}
          style={{
            padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
            background: sidebarOpen ? "var(--accent)" : "none",
            color: sidebarOpen ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: 12,
          }}
        >
          {sidebarOpen ? sh("hide") : sh("show")}
        </button>
      ),
    },
    {
      labelKey: "languageSwitch",
      control: (
        <div style={{ display: "flex", gap: 4 }}>
          {(["zh-CN", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => onSwitchLocale(l)}
              style={{
                padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
                background: currentLocale === l ? "var(--accent)" : "none",
                color: currentLocale === l ? "#fff" : "var(--text-muted)",
                cursor: "pointer", fontSize: 12, fontWeight: currentLocale === l ? 600 : 400,
              }}
            >
              {l === "zh-CN" ? "中文" : "English"}
            </button>
          ))}
        </div>
      ),
    },
    {
      labelKey: "themeToggle",
      control: (
        <button
          onClick={() => onToggleTheme()}
          style={{
            padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
            background: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 12,
          }}
        >
          {isDark ? sh("lightMode") : sh("darkMode")}
        </button>
      ),
    },
    {
      labelKey: "branchNav",
      control: (
        <span style={{ fontSize: 12, color: hasActiveSession ? "var(--text)" : "var(--text-dim)" }}>
          {hasActiveSession ? sh("branches") : sh("noActiveSession")}
        </span>
      ),
    },
    {
      labelKey: "systemPrompt",
      control: (
        <span style={{ fontSize: 12, color: "var(--text-dim)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {systemPrompt ?? sh("systemPromptWaiting")}
        </span>
      ),
    },
    {
      labelKey: "filePanelToggle",
      control: (
        <button
          onClick={onToggleRightPanel}
          style={{
            padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
            background: rightPanelOpen ? "var(--accent)" : "none",
            color: rightPanelOpen ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: 12,
          }}
        >
          {rightPanelOpen ? sh("hide") : sh("show")}
        </button>
      ),
    },
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 520, maxHeight: "78vh", background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 12, display: "flex", flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{sh("settings")}</span>
          </div>
          <button
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, padding: 0, background: "none", border: "none", borderRadius: 6, color: "var(--text-muted)", cursor: "pointer", transition: "background 0.12s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "auto", padding: "8px 20px" }}>
          <div style={{ display: "flex", gap: 28 }}>
            {/* Left: visibility toggles */}
            <div style={{ flex: 1 }}>
              <Section title={sh("topbarButtons")}>
                <Toggle labelKey="sidebarToggle" value={visible.sidebar} onChange={(v) => setVisible((p) => ({ ...p, sidebar: v }))} />
                <Toggle labelKey="languageSwitch" value={visible.locale} onChange={(v) => setVisible((p) => ({ ...p, locale: v }))} />
                <Toggle labelKey="themeToggle" value={visible.theme} onChange={(v) => setVisible((p) => ({ ...p, theme: v }))} />
                <Toggle labelKey="branchNav" value={visible.branch} onChange={(v) => setVisible((p) => ({ ...p, branch: v }))} />
                <Toggle labelKey="systemPrompt" value={visible.system} onChange={(v) => setVisible((p) => ({ ...p, system: v }))} />
                <Toggle labelKey="filePanelToggle" value={visible.filePanel} onChange={(v) => setVisible((p) => ({ ...p, filePanel: v }))} />
              </Section>
            </div>

            {/* Right: function access — use map from fnItems */}
            <div style={{ flex: 1 }}>
              <Section title={sh("show") + "/" + sh("hide")}>
                {fnItems.map((item) => (
                  <div key={item.labelKey} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{sh(item.labelKey as any)}</span>
                    <div>{item.control}</div>
                  </div>
                ))}
              </Section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
