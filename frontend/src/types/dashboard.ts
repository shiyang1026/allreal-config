export interface Token {
  id: number
  name: string
  key: string
  status: number
  remain_quota: number
  unlimited_quota: boolean
  expired_time: number
  used_quota: number
}

export interface ShellMatch {
  variable: string
  line: number
}

export interface ShellConflict {
  file_id: string
  label: string
  path: string
  matches: ShellMatch[]
}

export interface ConfigStatus {
  claude_code: { configured: boolean; base_url: string; has_key: boolean }
  codex: { configured: boolean; base_url: string; has_key: boolean }
  shell_conflicts: ShellConflict[]
}

export interface Editor {
  id: string
  name: string
}

export interface ConfigFileInfo {
  id: string
  label: string
  path: string
  language: 'json' | 'toml' | string
  exists: boolean
}

export interface ConfigFileContent {
  id: string
  label: string
  path: string
  language: 'json' | 'toml' | string
  content: string
}

export interface ModelOption {
  id: string
  display_name: string
}

export interface ClaudeModelSelection {
  haiku: string
  sonnet: string
  opus: string
  subagent: string
}

export interface CodexSelection {
  model: string
  reasoningEffort: string
}

export interface SelectOption {
  value: string
  label: string
}

export type Message = { type: 'success' | 'error'; text: string }
