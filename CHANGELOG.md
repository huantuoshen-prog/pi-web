# 更新日志

## 2026-06-03 — AI 维护分叉初始版本

基于 [agegr/pi-web](https://github.com/agegr/pi-web) v0.6.12 硬分叉。

### 合入的社区 PR（9 个）

| PR | 作者 | 功能 |
|----|------|------|
| [#42](https://github.com/agegr/pi-web/pull/42) | LQFHUB | 修复长会话 JSON 栈溢出 |
| [#40](https://github.com/agegr/pi-web/pull/40) | fallleave001 | 运行时读取版本号 |
| [#14](https://github.com/agegr/pi-web/pull/14) | xianzhe233 | LaTeX 数学公式渲染 |
| [#45](https://github.com/agegr/pi-web/pull/45) | looluo | 会话完成后自动生成摘要标题 |
| [#39](https://github.com/agegr/pi-web/pull/39) | fallleave001 | 工具独立开关面板 |
| [#26](https://github.com/agegr/pi-web/pull/26) | kami1983 | 命令复制按钮 |
| [#34](https://github.com/agegr/pi-web/pull/34) | liuzyong | docx/pdf 文件预览 |
| [#13](https://github.com/agegr/pi-web/pull/13) | Chasen-Liao | Electron 桌面应用 |
| [#19](https://github.com/agegr/pi-web/pull/19) | huantuoshen-prog | 中英双语国际化 |

### 新增功能（本分叉独立开发）

**可拖拽面板** — VS Code 风格自由调整侧边栏和文件面板宽度，手柄拖拽实时生效，松手同步到状态。

**设置面板** — 齿轮图标 → 全屏遮罩 → 左侧分类导航 + 右侧内容区。
- 外观：深色模式（手动/跟随系统/日落日出/定时切换）、语言切换
- 通用：顶栏 6 个按钮的显隐开关，持久化到 localStorage
- 面板：侧边栏/文件面板控制、系统 Prompt 内容、分支导航状态
- 关于：版本信息、完整 PR 列表（可点击链接）、仓库链接、维护声明

**自动深色模式** — 四种模式：
- 手动：点击切换，圆形扩散动画
- 跟随系统：响应 OS 深色模式设置
- 日落日出：授权位置后，根据天文算法自动切换（NOAA 改进算法）
- 定时切换：自定义深色起止时间

**docx 暗黑模式适配** — HTML 预览包裹 `light-dark()` CSS，表格、文字、链接、背景响应深色模式。

**全面 i18n** — 14 个组件零硬编码，310+ 翻译 key，中英双语完整覆盖。

### 修复

- 思考等级按钮和压缩按钮翻译缺失 → 已翻译
- docx 预览 iframe 截断拖拽事件 → 拖拽时全屏遮罩
- 侧边栏尺寸太小 → 像素宽度管理，默认 300px，最大 800px
- Turbopack 启动崩溃（tailwindcss 解析失败）→ 切 webpack dev + 清理父目录干扰

### 技术变更

- `next dev` 改为 webpack 模式（避免 Turbopack 兼容问题）
- 移除 `react-resizable-panels` 依赖，改用手写拖拽
- 启动命令改为 standalone server.js
- 新增 `hooks/useTheme.ts` — 自动主题引擎
- 新增 `components/SettingsConfig.tsx` — 设置面板
- 更新 README，标注 AI 维护 + 完整 PR 来源
