# AllReal Config — 产品文档

## 为什么做这个

运营中转站过程中发现一个核心痛点：

**用户配置门槛高** — 用户拿到令牌后，还要手动编辑 `~/.claude/settings.json`、`~/.codex/config.toml` 等配置文件，对非技术用户不友好。

所以做了这个桌面 App：登录即可一键配置，彻底告别手动编辑。

## 功能

### v1.0

| 功能 | 说明 |
|------|------|
| 登录 | 输入中转站地址 + 用户名密码，自动检测服务可达性 |
| 令牌选择 | 拉取用户令牌列表，选择要用于配置的令牌 |
| 配置 Claude Code | 合并写入 `~/.claude/settings.json` 的 `env` 块（`ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`），不碰其他字段 |
| 配置 CodeX | 合并写入 `~/.codex/config.toml`（`openai_base_url`），设置 `OPENAI_API_KEY` 环境变量 |
| 配置备份 | 每次写入前自动备份原文件（`.bak.{timestamp}`） |

### v1.1 规划

- VS Code 扩展配置修复（`claudeCode.environmentVariables`）
- 配置健康检查（连通性验证）
- 应用自动更新

## 技术栈

- **框架**: Wails v2（Go 后端 + WebView 前端）
- **前端**: React 18 + TypeScript + Tailwind CSS v4
- **平台**: macOS（Apple Silicon）+ Windows
- **包管理**: Bun

## 调用的中转站 API

全部使用现有接口，无需新增：

| 用途 | 接口 |
|------|------|
| 检测服务 | `GET /api/status` |
| 登录 | `POST /api/user/login` |
| 生成 access token | `GET /api/user/token` |
| 令牌列表 | `GET /api/token/` |
| 获取明文密钥 | `POST /api/token/:id/key` |

## 关键设计决策

**配置写入必须做字段级合并，不能全量覆写** — 读取 → 合并目标字段 → 写回，保留用户所有其他配置不动。

---

## 实现进度

| 模块 | 状态 |
|------|------|
| Wails 项目骨架 | ✅ 完成 |
| Tailwind CSS 配置 | ✅ 完成 |
| Go 后端（登录、令牌、配置读写） | ✅ 完成 |
| 前端页面（登录页 + 主页） | ✅ 完成 |
| 编译运行 | ✅ `wails dev` 通过 |
| 本机实际测试 | ⏳ 待测 |
