import { describe, expect, test } from 'bun:test'
import { resolveInitialConfigFileID } from '../src/components/config-editor/state'
import type { ConfigFileInfo } from '../src/types/dashboard'

const files: ConfigFileInfo[] = [
  { id: 'claude', label: 'Claude', path: 'claude.json', language: 'json', exists: true },
  { id: 'codex', label: 'Codex', path: 'config.toml', language: 'toml', exists: true },
]

describe('resolveInitialConfigFileID', () => {
  test('keeps the requested file when it exists in the loaded file list', () => {
    expect(resolveInitialConfigFileID(files, 'codex')).toBe('codex')
  })

  test('falls back to the first loaded file when the requested file is unavailable', () => {
    expect(resolveInitialConfigFileID(files, 'missing')).toBe('claude')
  })

  test('keeps the requested file while the file list is empty', () => {
    expect(resolveInitialConfigFileID([], 'codex')).toBe('codex')
  })
})
