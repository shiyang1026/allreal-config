import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(import.meta.dir, '../src/style.css'), 'utf8')

describe('config editor styles', () => {
  test('keeps CodeMirror scrollable inside the fixed app shell', () => {
    expect(css).toContain('.config-editor-codemirror .cm-scroller')
    expect(css).toMatch(/\.config-editor-codemirror\s+\.cm-scroller\s*\{[^}]*overflow:\s*auto/s)
  })
})
