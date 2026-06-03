# pi-web

> **AI 维护声明**：此分叉由 [Claude Code](https://claude.ai/code) 驱动维护——代码筛选、合并、冲突解决、验证均由 AI 执行，人工审核确认。详见 [维护说明](#维护方式)。

[pi 编程智能体](https://github.com/badlogic/pi-mono) 的网页界面。在浏览器中浏览会话、与智能体对话、分叉对话、切换消息分支。

## 快速开始

**无需安装，直接运行：**

```bash
npx @agegr/pi-web@latest
```

**或全局安装后使用：**

```bash
npm install -g @agegr/pi-web
pi-web
```

启动后打开 [http://localhost:30141](http://localhost:30141)。

**可选参数：**

```bash
pi-web --port 8080               # 自定义端口
pi-web --hostname 127.0.0.1      # 仅本机访问
pi-web -p 8080 -H 127.0.0.1     # 组合使用

PORT=8080 pi-web                 # 也支持环境变量
```

## 功能介绍

- **会话浏览器** — 按工作目录分组展示所有 pi 会话
- **实时对话** — 通过 SSE 流式输出与智能体实时交互
- **会话分叉** — 从任意用户消息创建独立的新会话分支
- **会话内分支** — 回退到任意节点继续对话，在同一文件内创建分支
- **分支导航器** — 可视化切换同一会话内的各个分支
- **模型切换** — 对话中途随时切换模型
- **工具面板** — 控制智能体可使用的工具
- **压缩会话** — 对长会话进行摘要，节省上下文窗口
- **引导 / 追加** — 打断正在运行的智能体，或在其完成后追加消息

## 注意事项

- **数据目录** — 默认读取 `~/.pi/agent/sessions` 下的会话文件。可通过环境变量 `PI_CODING_AGENT_DIR` 指定其他目录。
- **模型配置** — 从智能体数据目录下的 `models.json` 读取可用模型，可在侧边栏的「Models」面板中编辑。
- **文件浏览** — 侧边栏内置文件浏览器，可在标签页中查看当前工作目录下的文件。

## 开发

```bash
npm install
npm run dev   # 端口 30141
```

## 项目结构

```
app/
  api/
    sessions/      # 读写会话文件
    agent/         # 发送命令、SSE 事件流
    files/         # 文件内容读取
    models/        # 可用模型列表与默认模型
    models-config/ # 读写 models.json
components/        # UI 组件
lib/
  session-reader.ts  # 解析 .jsonl 会话文件
  rpc-manager.ts     # 管理 AgentSession 生命周期
  normalize.ts       # 规范化 toolCall 字段名
  types.ts
```

会话文件存储路径：`~/.pi/agent/sessions/<编码后的工作目录>/<时间戳>_<uuid>.jsonl`

## 维护方式

此分叉由 AI（Claude Code）驱动维护：

- **代码筛选** — AI 评估上游 PR，决定合入或跳过
- **合并执行** — AI 执行 cherry-pick / merge，解决冲突
- **验证** — AI 运行 TypeScript 类型检查和构建
- **人工审核** — 每个 AI 决策由人工确认后执行

## 分叉特性

基于上游 `agegr/pi-web` v0.6.12，通过 `git cherry-pick` 合入以下社区 PR（提交作者信息完整保留）：

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
| [#19](https://github.com/agegr/pi-web/pull/19) | huantuoshen-prog | 中英双语国际化 (next-intl) |

可通过 `git log` 查看完整的作者和时间戳记录。
