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

export interface ConfigStatus {
  claude_code: { configured: boolean; base_url: string; has_key: boolean }
  codex: { configured: boolean; base_url: string; has_key: boolean }
  cc_switch: { installed: boolean; paths: string[]; polluted: boolean; polluted_info: string[] }
}

export interface Editor {
  id: string
  name: string
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

export interface SelectOption {
  value: string
  label: string
}

export type Message = { type: 'success' | 'error'; text: string }
