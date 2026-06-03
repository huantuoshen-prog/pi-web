# pi-web — AI 维护分叉

> 基于 [agegr/pi-web](https://github.com/agegr/pi-web) v0.6.12 的社区增强版，由 [Claude Code](https://claude.ai/code) 驱动维护。

[pi 编程智能体](https://github.com/badlogic/pi-mono) 的网页界面。在浏览器中浏览会话、与智能体对话、实时流式交互、分叉与分支管理。

## 与上游的差异

此分叉在上游基础上额外合入了 9 个社区 PR（详见[分叉特性](#分叉特性)），包括：

- **中英双语** — 全界面 310+ key 国际化，Cookie 持久化语言偏好
- **智能标题** — 会话完成后 LLM 自动生成摘要标题
- **工具面板** — 每个工具独立开关，替换粗粒度预设
- **LaTeX 渲染** — Markdown 中渲染数学公式
- **文档预览** — docx/pdf 在线预览
- **命令复制** — 工具调用块一键复制
- **Electron 桌面** — Windows 打包、系统托盘、自动更新
- **两项修复** — 长会话栈溢出 + 运行时版本号

## 快速开始

```bash
git clone https://github.com/huantuoshen-prog/pi-web.git
cd pi-web
npm install
npm run dev     # http://localhost:30141
```

**可选参数：**

```bash
npm run dev -- -p 8080
PORT=8080 npm run dev
```

## 功能介绍

- **会话浏览器** — 按工作目录分组展示所有 pi 会话
- **实时对话** — 通过 SSE 流式输出与智能体实时交互
- **会话分叉** — 从任意用户消息创建独立的新会话分支
- **会话内分支** — 回退到任意节点继续对话
- **分支导航器** — 可视化切换同一会话内的各个分支
- **模型切换** — 对话中途随时切换模型，支持多 Provider
- **工具面板** — 每个工具独立开关，设置持久化
- **压缩会话** — 长会话摘要压缩，节省上下文窗口
- **引导 / 追加** — 打断运行中的 Agent 或排队追加消息
- **文件浏览** — 侧边栏文件树，多标签查看
- **中英双语** — 顶栏地球图标一键切换
- **深色模式** — 支持浅色/深色主题切换
- **智能标题** — Agent 完成后自动总结生成会话标题
- **LaTeX 公式** — Markdown 中渲染数学公式
- **文档预览** — docx/PDF 在线预览
- **Electron 桌面** — Windows 安装包、系统托盘

## 注意事项

- **数据目录** — 默认读取 `~/.pi/agent/sessions`，可通过 `PI_CODING_AGENT_DIR` 指定
- **模型配置** — 侧边栏「Models」面板编辑 `models.json`
- **工具配置** — 侧边栏「Tools」面板，设置在下一次新建会话时生效
- **语言切换** — 顶栏地球图标，Cookie 持久化

## 开发

```bash
npm install
npm run dev     # 端口 30141
npm run build   # 生产构建
```

## 项目结构

```
app/                  # Next.js App Router
  [locale]/           # i18n 路由 (zh-CN / en)
  api/
    sessions/         # 会话读写、标题生成
    agent/            # 命令发送、SSE 事件流
    files/            # 文件内容读取
    models/           # 可用模型列表
    models-config/    # 读写 models.json
    tools/            # 工具枚举与配置
    version/          # 运行时版本号
components/           # UI 组件 (14 个)
hooks/                # 自定义 Hook (useAgentSession, useAudio, etc.)
lib/                  # 类型定义、会话读取、RPC 管理
messages/             # i18n 翻译文件 (zh-CN.json / en.json)
i18n/                 # next-intl 路由配置
electron/             # Electron 桌面应用
```

会话文件路径：`~/.pi/agent/sessions/<编码工作目录>/<时间戳>_<uuid>.jsonl`

## 维护方式

此分叉由 AI（Claude Code）驱动维护，人工审核确认每个决策：

- **代码筛选** — AI 评估上游 PR 质量与价值
- **合并执行** — AI 执行 cherry-pick / merge，解决冲突
- **验证** — AI 运行 `tsc --noEmit` 和 `npm run build`
- **人工审核** — 每个 AI 决策需人工确认后合入

## 分叉特性

基于 `agegr/pi-web` v0.6.12，通过 `git cherry-pick` 合入。提交作者信息完整保留，`git log` 可查。

| 上游 PR | 作者 | 功能 |
|---------|------|------|
| [#42](https://github.com/agegr/pi-web/pull/42) | LQFHUB | 修复长会话 JSON 栈溢出 |
| [#40](https://github.com/agegr/pi-web/pull/40) | fallleave001 | 运行时读取版本号 |
| [#14](https://github.com/agegr/pi-web/pull/14) | xianzhe233 | LaTeX 数学公式渲染 |
| [#45](https://github.com/agegr/pi-web/pull/45) | looluo | 会话完成后自动生成摘要标题 |
| [#39](https://github.com/agegr/pi-web/pull/39) | fallleave001 | 工具独立开关面板 |
| [#26](https://github.com/agegr/pi-web/pull/26) | kami1983 | 命令复制按钮 |
| [#34](https://github.com/agegr/pi-web/pull/34) | liuzyong | docx/pdf 文件预览 |
| [#13](https://github.com/agegr/pi-web/pull/13) | Chasen-Liao | Electron 桌面应用 |
| [#19](https://github.com/agegr/pi-web/pull/19) | huantuoshen-prog | 中英双语国际化 |
