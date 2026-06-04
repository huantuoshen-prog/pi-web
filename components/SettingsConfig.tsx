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

type Category = "appearance" | "general" | "panels" | "about";

interface Props {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  isDark: boolean;
  themeMode: "manual" | "system" | "schedule" | "sun";
  schedule: { darkStart: string; darkEnd: string };
  coords: { lat: number; lng: number } | null;
  setThemeMode: (mode: "manual" | "system" | "schedule" | "sun") => void;
  setSchedule: (darkStart: string, darkEnd: string) => void;
  setCoords: (lat: number, lng: number) => void;
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
  sidebarOpen, rightPanelOpen, isDark, themeMode, schedule, coords, setThemeMode, setSchedule, setCoords,
  systemPrompt, hasActiveSession,
  appVersion, piVersion,
  onToggleSidebar, onToggleRightPanel, onToggleTheme, onSwitchLocale,
  currentLocale, onClose, onVisibilityChange,
}: Props) {
  const sh = useTranslations("shell");
  const [visible, setVisible] = useState<VisibleButtons>(loadVisible);
  const [category, setCategory] = useState<Category>("appearance");

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

  const isZh = currentLocale === "zh-CN";

  const CATEGORIES: { key: Category; label: string; icon: React.ReactNode }[] = [
    {
      key: "appearance",
      label: isZh ? "外观" : "Appearance",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    },
    {
      key: "general",
      label: isZh ? "通用" : "General",
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

  const renderContent = () => {
    switch (category) {
      case "appearance":
        return (
          <>
            <SecTitle>{sh("themeToggle")}</SecTitle>
            <div style={{ padding: "4px 0 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {([
                { key: "manual" as const, label: isZh ? "手动" : "Manual" },
                { key: "system" as const, label: isZh ? "跟随系统" : "System" },
                { key: "sun" as const, label: isZh ? "日落日出" : "Sun" },
                { key: "schedule" as const, label: isZh ? "定时切换" : "Schedule" },
              ]).map((m) => (
                <button key={m.key} onClick={() => setThemeMode(m.key)}
                  style={{
                    padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border)",
                    background: themeMode === m.key ? "var(--accent)" : "none",
                    color: themeMode === m.key ? "#fff" : "var(--text-muted)",
                    cursor: "pointer", fontSize: 12, fontWeight: themeMode === m.key ? 600 : 400,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {themeMode === "manual" && (
              <div style={{ padding: "4px 0 8px" }}>
                <Toggle label={isDark ? (isZh ? "深色模式" : "Dark mode") : (isZh ? "浅色模式" : "Light mode")} value={isDark} onChange={() => onToggleTheme()} />
              </div>
            )}
            {themeMode === "sun" && (
              <div style={{ padding: "4px 0 8px", fontSize: 12, color: "var(--text-dim)" }}>
                {coords ? (
                  <span>
                    {isZh ? "已定位" : "Located"}: {coords.lat.toFixed(1)}°, {coords.lng.toFixed(1)}°
                    {" · "}{isZh ? "自动根据当地日落日出切换深色模式" : "Auto-switching based on local sunrise/sunset"}
                  </span>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>{isZh ? "需要位置权限以计算日落日出时间" : "Location needed to calculate sunrise/sunset"}</span>
                    <button
                      onClick={() => {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => setCoords(pos.coords.latitude, pos.coords.longitude),
                          () => alert(isZh ? "无法获取位置，请检查浏览器权限设置" : "Unable to get location. Check browser permissions."),
                        );
                      }}
                      style={{
                        padding: "4px 10px", borderRadius: 6, border: "1px solid var(--accent)",
                        background: "none", color: "var(--accent)", cursor: "pointer", fontSize: 11,
                      }}
                    >
                      {isZh ? "授权位置" : "Allow location"}
                    </button>
                  </div>
                )}
              </div>
            )}
            {themeMode === "schedule" && (
              <div style={{ padding: "4px 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 2 }}>{isZh ? "深色开始" : "Dark from"}</div>
                  <input
                    type="time"
                    value={schedule.darkStart}
                    onChange={(e) => setSchedule(e.target.value, schedule.darkEnd)}
                    style={{
                      padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)",
                      background: "var(--bg)", color: "var(--text)", fontSize: 13,
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </div>
                <span style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 14 }}>{isZh ? "至" : "to"}</span>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 2 }}>{isZh ? "深色结束" : "Dark until"}</div>
                  <input
                    type="time"
                    value={schedule.darkEnd}
                    onChange={(e) => setSchedule(schedule.darkStart, e.target.value)}
                    style={{
                      padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)",
                      background: "var(--bg)", color: "var(--text)", fontSize: 13,
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </div>
              </div>
            )}

            <SecTitle style={{ marginTop: 8 }}>{isZh ? "语言" : "Language"}</SecTitle>
            <div style={{ display: "flex", gap: 6, padding: "7px 0" }}>
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
          </>
        );

      case "general":
        return (
          <>
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
            <SecTitle>{isZh ? "版本信息" : "Version Info"}</SecTitle>
            <div style={{ padding: "4px 0", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "var(--text-dim)" }}>pi-web</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>v{appVersion}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "var(--text-dim)" }}>pi-coding-agent</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>v{piVersion}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "var(--text-dim)" }}>Next.js</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>16.2.1</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: "var(--text-dim)" }}>React</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>19.2</span>
              </div>
            </div>

            <SecTitle style={{ marginTop: 14 }}>{isZh ? "上游来源" : "Upstream"}</SecTitle>
            <div style={{ padding: "4px 0", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              {isZh
                ? "基于 agegr/pi-web v0.6.12 的硬分叉，合入了 9 个社区 PR："
                : "Hard fork of agegr/pi-web v0.6.12, integrating 9 community PRs:"}
              <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  { pr: "42", author: "LQFHUB", desc: isZh ? "修复长会话 JSON 栈溢出" : "Fix JSON stack overflow for long sessions" },
                  { pr: "40", author: "fallleave001", desc: isZh ? "运行时读取版本号" : "Read versions at runtime" },
                  { pr: "14", author: "xianzhe233", desc: "LaTeX " + (isZh ? "数学公式渲染" : "math rendering") },
                  { pr: "45", author: "looluo", desc: isZh ? "自动生成会话摘要标题" : "Auto-generate session titles" },
                  { pr: "39", author: "fallleave001", desc: isZh ? "工具独立开关面板" : "Per-tool toggle panel" },
                  { pr: "26", author: "kami1983", desc: isZh ? "命令复制按钮" : "Command copy button" },
                  { pr: "34", author: "liuzyong", desc: isZh ? "docx/pdf 文件预览" : "docx/pdf preview" },
                  { pr: "13", author: "Chasen-Liao", desc: isZh ? "Electron 桌面应用" : "Electron desktop app" },
                  { pr: "19", author: "huantuoshen-prog", desc: isZh ? "中英双语国际化" : "i18n (zh-CN + en)" },
                ].map((p) => (
                  <div key={p.pr} style={{ fontSize: 11, display: "flex", gap: 8 }}>
                    <a
                      href={`https://github.com/agegr/pi-web/pull/${p.pr}`}
                      target="_blank" rel="noreferrer"
                      style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", minWidth: 26, textDecoration: "none" }}
                    >
                      #{p.pr}
                    </a>
                    <span style={{ color: "var(--text)", minWidth: 120 }}>{p.author}</span>
                    <span style={{ color: "var(--text-dim)" }}>{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <SecTitle style={{ marginTop: 14 }}>{isZh ? "维护方式" : "Maintenance"}</SecTitle>
            <div style={{ padding: "4px 0", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              {isZh
                ? "此分叉由 Claude Code (AI) 驱动维护 — 代码筛选、合并、冲突解决、验证均由 AI 执行，人工审核确认。Git 提交历史中保留所有原作者的签名和时间戳。"
                : "AI-maintained by Claude Code — code review, merge, conflict resolution, and verification are AI-executed with human oversight. Original author signatures preserved in git history."}
            </div>

            <SecTitle style={{ marginTop: 14 }}>{isZh ? "链接" : "Links"}</SecTitle>
            <div style={{ padding: "4px 0", fontSize: 12, lineHeight: 1.8 }}>
              <a href="https://github.com/huantuoshen-prog/pi-web" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>
                {isZh ? "分叉仓库" : "Fork repo"} — github.com/huantuoshen-prog/pi-web
              </a>
              <br />
              <a href="https://github.com/agegr/pi-web" target="_blank" rel="noreferrer" style={{ color: "var(--text-dim)", textDecoration: "none" }}>
                {isZh ? "上游仓库" : "Upstream"} — github.com/agegr/pi-web
              </a>
              <br />
              <a href="https://github.com/badlogic/pi-mono" target="_blank" rel="noreferrer" style={{ color: "var(--text-dim)", textDecoration: "none" }}>
                pi agent — github.com/badlogic/pi-mono
              </a>
            </div>

            <div style={{ marginTop: 16, fontSize: 11, color: "var(--text-dim)", opacity: 0.6 }}>
              MIT License · &copy; 2026
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
          width: "80vw", height: "80vh", background: "var(--bg)", border: "1px solid var(--border)",
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
