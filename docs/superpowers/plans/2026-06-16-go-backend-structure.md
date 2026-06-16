# Go Backend Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the Wails backend into maintainable internal packages without changing user-visible behavior.

**Architecture:** Keep `package main` as the Wails facade and move durable responsibilities into `internal` packages. `internal/hubclient` owns AllReal Hub HTTP calls, `internal/configfile` owns local config file reads/writes, `internal/statuscheck` owns local status, and `internal/editor` owns editor discovery/opening.

**Tech Stack:** Go, Wails, standard library HTTP/JSON/TOML, existing React frontend bindings.

---

### Task 1: Define Shared Internal Types

**Files:**
- Create: `internal/apptypes/types.go`
- Modify: `app.go`

- [ ] Move Wails-facing DTOs into `internal/apptypes`.
- [ ] Keep JSON tags identical so Wails bindings remain compatible.
- [ ] Alias these types in `app.go` only if existing tests or bindings need the old package names.

### Task 2: Extract Hub Client

**Files:**
- Create: `internal/hubclient/client.go`
- Modify: `app.go`

- [ ] Move server status, login token generation, token list, token key reveal, and Claude model listing into `hubclient.Client`.
- [ ] Keep request headers and response parsing behavior identical.
- [ ] Leave `App` responsible for storing session state and calling the client.

### Task 3: Extract Local Config Files

**Files:**
- Create: `internal/configfile/paths.go`
- Create: `internal/configfile/claude.go`
- Create: `internal/configfile/codex.go`
- Modify: `app.go`
- Modify: `app_test.go`

- [ ] Move Claude Code reset writing into `configfile.WriteClaudeCode`.
- [ ] Move Codex `config.toml` and `auth.json` writing into `configfile.WriteCodex`.
- [ ] Move backup and OS config path helpers into `configfile`.
- [ ] Point behavior tests at `configfile` where possible and keep facade tests for `App`.

### Task 4: Extract Status and Editor Services

**Files:**
- Create: `internal/statuscheck/status.go`
- Create: `internal/editor/editor.go`
- Modify: `app.go`

- [ ] Move config status detection into `statuscheck.Get`.
- [ ] Move editor discovery/opening into `editor`.
- [ ] Keep platform-specific behavior exactly as currently implemented.

### Task 5: Verify and Tidy

**Files:**
- Modify: generated Wails bindings only if public method signatures change.

- [ ] Run `gofmt` on all Go files.
- [ ] Run `GOCACHE=/Users/sia/Workspace/Sia/allreal-config/.tmp-go-cache go test -count=1 ./...`.
- [ ] Run `bun run build` in `frontend`.
- [ ] Ensure `app.go` is a thin facade, not a second copy of business logic.
