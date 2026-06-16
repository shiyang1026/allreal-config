# AllReal Config

AllReal Config 是一个基于 Wails + React + TypeScript 的桌面配置工具，用来帮助用户把 AllReal 中转站令牌写入本机开发工具配置。

当前支持：

- 配置 Claude Code
- 配置 Codex
- 选择中转站令牌并拉取该令牌可用模型
- 打开本机配置文件

## 开发环境

安装前端依赖：

```bash
make install
```

启动桌面端开发模式：

```bash
make dev
```

`make dev` 会使用开发配置隔离，避免覆盖本机真实 Claude Code 和 Codex 配置。Wails 会启动 Vite 开发服务器，前端支持热更新。如果需要在浏览器里调试并调用 Go 方法，可以访问 Wails 提供的开发地址。

## 开发配置隔离

开发阶段建议使用 dev profile，避免覆盖你本机正在使用的 Claude Code 和 Codex 配置：

```bash
make dev
```

启用后写入路径为：

- Claude Code: `~/.claude/settings-dev.json`
- Codex 配置: `~/.codex/config-dev.toml`
- Codex 认证: `~/.codex/auth-dev.json`

不设置 `ALLREAL_CONFIG_PROFILE` 时，程序使用生产路径：

- Claude Code: `~/.claude/settings.json`
- Codex 配置: `~/.codex/config.toml`
- Codex 认证: `~/.codex/auth.json`

如果确实要在开发模式下写真实配置路径，可以使用：

```bash
make dev-prod
```

## 验证

运行 Go 测试：

```bash
make test
```

构建前端：

```bash
make frontend-build
```

## 构建

构建可分发应用：

```bash
make build
```
