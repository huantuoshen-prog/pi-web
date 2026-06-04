"use client";

import React, { useState, useEffect } from "react";
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

type Category = "general" | "panels" | "about";

interface Props {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  isDark: boolean;
  systemPrompt: string | null;
  hasActiveSession: boolean;
  appVersion: string;
  piVersion: string;
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
  appVersion, piVersion,
  onToggleSidebar, onToggleRightPanel, onToggleTheme, onSwitchLocale,
  currentLocale, onClose, onVisibilityChange,
}: Props) {
  const sh = useTranslations("shell");
  const [visible, setVisible] = useState<VisibleButtons>(loadVisible);
  const [category, setCategory] = useState<Category>("general");

  useEffect(() => {
    onVisibilityChange(visible);
    saveVisible(visible);
  }, [visible, onVisibilityChange]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0" }}>
      <span style={{ fontSize: 13, color: "var(--text)" }}>{label}</span>
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

  const SecTitle = ({ children, style }: { children: string; style?: React.CSSProperties }) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", ...style }}>{children}</div>
  );

  const CATEGORIES: { key: Category; label: string; icon: React.ReactNode }[] = [
    {
      key: "general",
      label: "通用",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    },
    {
      key: "panels",
      label: "面板",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
    },
    {
      key: "about",
      label: "关于",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    },
  ];

  const isZh = currentLocale === "zh-CN";

  const renderContent = () => {
    switch (category) {
      case "general":
        return (
          <>
            <SecTitle>{isZh ? "外观" : "Appearance"}</SecTitle>
            <div style={{ padding: "0 0 12px" }}>
              <Toggle label={sh("themeToggle")} value={isDark} onChange={() => onToggleTheme()} />
            </div>

            <SecTitle>{isZh ? "语言" : "Language"}</SecTitle>
            <div style={{ display: "flex", gap: 6, padding: "7px 0 12px" }}>
              {(["zh-CN", "en"] as const).map((l) => (
                <button key={l} onClick={() => onSwitchLocale(l)}
                  style={{
                    padding: "6px 16px", borderRadius: 7, border: "1px solid var(--border)",
                    background: currentLocale === l ? "var(--accent)" : "none",
                    color: currentLocale === l ? "#fff" : "var(--text-muted)",
                    cursor: "pointer", fontSize: 13, fontWeight: currentLocale === l ? 600 : 400,
                  }}
                >
                  {l === "zh-CN" ? "中文" : "English"}
                </button>
              ))}
            </div>

            <SecTitle>{sh("topbarButtons")}</SecTitle>
            <Toggle label={sh("sidebarToggle")} value={visible.sidebar} onChange={(v) => setVisible((p) => ({ ...p, sidebar: v }))} />
            <Toggle label={sh("languageSwitch")} value={visible.locale} onChange={(v) => setVisible((p) => ({ ...p, locale: v }))} />
            <Toggle label={sh("themeToggle")} value={visible.theme} onChange={(v) => setVisible((p) => ({ ...p, theme: v }))} />
            <Toggle label={sh("branchNav")} value={visible.branch} onChange={(v) => setVisible((p) => ({ ...p, branch: v }))} />
            <Toggle label={sh("systemPrompt")} value={visible.system} onChange={(v) => setVisible((p) => ({ ...p, system: v }))} />
            <Toggle label={sh("filePanelToggle")} value={visible.filePanel} onChange={(v) => setVisible((p) => ({ ...p, filePanel: v }))} />
          </>
        );

      case "panels":
        return (
          <>
            <SecTitle>{sh("sidebarToggle")}</SecTitle>
            <div style={{ padding: "7px 0 12px" }}>
              <button
                onClick={onToggleSidebar}
                style={{
                  padding: "6px 16px", borderRadius: 7, border: "1px solid var(--border)",
                  background: sidebarOpen ? "var(--accent)" : "none",
                  color: sidebarOpen ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: 13,
                }}
              >
                {sidebarOpen ? sh("hideSidebar") : sh("showSidebar")}
              </button>
            </div>

            <SecTitle>{sh("filePanelToggle")}</SecTitle>
            <div style={{ padding: "7px 0 12px" }}>
              <button
                onClick={onToggleRightPanel}
                style={{
                  padding: "6px 16px", borderRadius: 7, border: "1px solid var(--border)",
                  background: rightPanelOpen ? "var(--accent)" : "none",
                  color: rightPanelOpen ? "#fff" : "var(--text-muted)", cursor: "pointer", fontSize: 13,
                }}
              >
                {rightPanelOpen ? sh("hide") : sh("show")}
              </button>
            </div>

            <SecTitle>{sh("systemPrompt")}</SecTitle>
            <div style={{ padding: "7px 0", fontSize: 12, color: "var(--text-dim)" }}>
              {systemPrompt ?? sh("systemPromptWaiting")}
            </div>

            <SecTitle style={{ marginTop: 12 }}>{sh("branchNav")}</SecTitle>
            <div style={{ padding: "7px 0", fontSize: 12, color: hasActiveSession ? "var(--text)" : "var(--text-dim)" }}>
              {hasActiveSession ? sh("branches") : sh("noActiveSession")}
            </div>
          </>
        );

      case "about":
        return (
          <>
            <SecTitle>{isZh ? "版本" : "Version"}</SecTitle>
            <div style={{ padding: "7px 0", fontSize: 13, color: "var(--text)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "var(--text-dim)" }}>pi-web</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{appVersion}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "var(--text-dim)" }}>pi-coding-agent</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{piVersion}</span>
              </div>
            </div>

            <SecTitle style={{ marginTop: 12 }}>{isZh ? "维护" : "Maintenance"}</SecTitle>
            <div style={{ padding: "7px 0", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              {isZh
                ? "此分叉由 Claude Code (AI) 驱动维护，人工审核确认。提交记录中保留所有原作者签名。"
                : "This fork is AI-maintained by Claude Code with human review. All original author signatures are preserved in commit history."}
            </div>
          </>
        );
    }
  };

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
          width: 640, maxHeight: "82vh", background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 12, display: "flex", flexDirection: "row",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)", overflow: "hidden",
        }}
      >
        {/* Left sidebar — categories */}
        <div style={{
          width: 180, flexShrink: 0, background: "var(--bg-panel)", borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column", padding: "12px 0",
        }}>
          <div style={{ padding: "0 14px 10px", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
            {sh("settings")}
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 14px", margin: "0 6px", borderRadius: 7,
                border: "none", background: category === cat.key ? "var(--bg-selected)" : "none",
                color: category === cat.key ? "var(--text)" : "var(--text-muted)",
                cursor: "pointer", fontSize: 13, fontWeight: category === cat.key ? 500 : 400,
                textAlign: "left", width: "calc(100% - 12px)",
                transition: "background 0.1s, color 0.1s",
              }}
              onMouseEnter={(e) => { if (category !== cat.key) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { if (category !== cat.key) e.currentTarget.style.background = "none"; }}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right — content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
              {CATEGORIES.find((c) => c.key === category)?.label}
            </span>
            <button
              onClick={onClose}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, padding: 0, background: "none", border: "none", borderRadius: 6, color: "var(--text-muted)", cursor: "pointer", transition: "background 0.12s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {/* Content area */}
          <div style={{ flex: 1, overflow: "auto", padding: "12px 18px" }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
