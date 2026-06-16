import { useEffect, useMemo, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { StreamLanguage } from '@codemirror/language'
import { toml } from '@codemirror/legacy-modes/mode/toml'
import { oneDark } from '@codemirror/theme-one-dark'
import { ListConfigFiles, ReadConfigFile, SaveConfigFile } from '../../../wailsjs/go/main/App'
import type { ConfigFileContent, ConfigFileInfo } from '../../types/dashboard'
import { resolveInitialConfigFileID } from './state'

interface Props {
  initialFileID: string
  onClose?: () => void
  onSaved: (message: string) => void
  onError: (message: string) => void
}

const tomlLanguage = StreamLanguage.define(toml)
// ponytail: pixel height via ResizeObserver — percentage chains break in Wails WebKit webview
function useContainerHeight() {
  const ref = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setH(e.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, h] as const
}

export default function ConfigEditor({ initialFileID, onClose, onSaved, onError }: Props) {
  const [files, setFiles] = useState<ConfigFileInfo[]>([])
  const [activeID, setActiveID] = useState(initialFileID)
  const [currentFile, setCurrentFile] = useState<ConfigFileContent | null>(null)
  const [content, setContent] = useState('')
  const [dirty, setDirty] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [loadingContent, setLoadingContent] = useState(true)
  const [hasLoadedContent, setHasLoadedContent] = useState(false)
  const [showInitialLoadingState, setShowInitialLoadingState] = useState(false)
  const hasLoadedContentRef = useRef(false)
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState('')
  const [editorContainerRef, editorHeight] = useContainerHeight()

  useEffect(() => {
    let cancelled = false

    async function loadFiles() {
      setLoadingFiles(true)
      try {
        const nextFiles = await ListConfigFiles()
        if (cancelled) return
        setFiles(nextFiles || [])
        const nextID = resolveInitialConfigFileID(nextFiles || [], initialFileID)
        setActiveID(nextID)
      } catch (e: any) {
        if (!cancelled) {
          setLocalError(e?.message || '加载配置文件列表失败')
        }
      } finally {
        if (!cancelled) setLoadingFiles(false)
      }
    }

    loadFiles()
    return () => {
      cancelled = true
    }
  }, [initialFileID])

  useEffect(() => {
    let cancelled = false

    async function loadContent() {
      if (!activeID) return
      setLoadingContent(true)
      setLocalError('')
      try {
        const file = await ReadConfigFile(activeID)
        if (cancelled) return
        setCurrentFile(file)
        setContent(file.content || '')
        setDirty(false)
        hasLoadedContentRef.current = true
        setHasLoadedContent(true)
      } catch (e: any) {
        if (!cancelled) {
          setLocalError(e?.message || '读取配置文件失败')
          if (!hasLoadedContentRef.current) setCurrentFile(null)
        }
      } finally {
        if (!cancelled) setLoadingContent(false)
      }
    }

    loadContent()
    return () => {
      cancelled = true
    }
  }, [activeID])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        save()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const extensions = useMemo(() => {
    if (currentFile?.language === 'toml') return [tomlLanguage]
    return [json()]
  }, [currentFile?.language])

  const activeFile = files.find((file) => file.id === activeID)
  const languageLabel = currentFile?.language?.toUpperCase() || activeFile?.language?.toUpperCase() || '配置'
  const isInitialContentLoading = loadingContent && !hasLoadedContent
  const isRefreshingContent = loadingContent && hasLoadedContent

  useEffect(() => {
    if (!isInitialContentLoading) {
      setShowInitialLoadingState(false)
      return
    }

    const timer = window.setTimeout(() => setShowInitialLoadingState(true), 180)
    return () => window.clearTimeout(timer)
  }, [isInitialContentLoading])

  const reload = async () => {
    if (!activeID) return
    setLoadingContent(true)
    setLocalError('')
    try {
      const file = await ReadConfigFile(activeID)
      setCurrentFile(file)
      setContent(file.content || '')
      setDirty(false)
      hasLoadedContentRef.current = true
      setHasLoadedContent(true)
    } catch (e: any) {
      setLocalError(e?.message || '重新加载失败')
    } finally {
      setLoadingContent(false)
    }
  }

  const formatJSON = () => {
    if (currentFile?.language !== 'json') return
    try {
      const formatted = JSON.stringify(JSON.parse(content || '{}'), null, 2)
      setContent(formatted)
      setDirty(true)
      setLocalError('')
    } catch {
      setLocalError('当前内容不是有效 JSON，无法格式化')
    }
  }

  async function save() {
    if (!currentFile || saving) return
    setSaving(true)
    setLocalError('')
    try {
      const result = await SaveConfigFile({ id: currentFile.id, content })
      if (result.success) {
        setDirty(false)
        onSaved(result.message)
        const nextFiles = await ListConfigFiles()
        setFiles(nextFiles || [])
      } else {
        setLocalError(result.message)
        onError(result.message)
      }
    } catch (e: any) {
      const message = e?.message || '保存配置文件失败'
      setLocalError(message)
      onError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="config-editor-shell h-screen bg-[#0b1120] text-slate-100 flex flex-col" style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
      <header className="shrink-0 border-b border-slate-800 bg-[#0f172a]">
        <div className="px-5 pb-5 pt-10 flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-100">配置文件编辑器</h1>
              <span className="border border-slate-700 bg-slate-950/30 px-2 py-0.5 text-xs font-medium text-slate-300">
                {languageLabel}
              </span>
              {dirty && (
                <span className="border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-200">
                  未保存
                </span>
              )}
            </div>
            <p className="max-w-[72ch] truncate text-sm text-slate-500">
              {currentFile?.path || activeFile?.path || '正在加载配置文件'}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="shrink-0 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-200 transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </header>

      {localError && (
        <div className="border-b border-red-900/70 bg-red-950/40 px-5 py-2 text-xs font-medium text-red-200">
          {localError}
        </div>
      )}

      <main className="flex-1 min-h-0 grid grid-cols-[260px_minmax(0,1fr)] bg-[#0b1120]">
        <aside className="min-h-0 border-r border-slate-800 bg-[#0f172a] py-5" style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
          <div className="mb-3 px-5 text-sm font-semibold text-slate-300">配置文件</div>
          <div>
            {loadingFiles && files.length === 0 ? (
              <div className="space-y-3 px-5 py-1" aria-label="正在加载配置文件列表">
                <div className="config-editor-skeleton h-12" />
                <div className="config-editor-skeleton h-12" />
                <div className="config-editor-skeleton h-12" />
              </div>
            ) : files.map((file) => {
              const active = file.id === activeID
              return (
                <button
                  key={file.id}
                  onClick={() => setActiveID(file.id)}
                  className={`config-editor-file-row w-full border-y px-5 py-4 text-left transition-colors ${
                    active
                      ? 'border-slate-700 bg-slate-800/70 text-white'
                      : 'border-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-900/70'
                  }`}
                >
                  <span className="block truncate text-base font-semibold">{file.label}</span>
                  <span className={`mt-1 block truncate text-sm ${active ? 'text-slate-400' : 'text-slate-500'}`}>
                    {file.exists ? file.language.toUpperCase() : '未创建'}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="min-h-0 flex flex-col overflow-hidden bg-[#050816]" style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
          <div ref={editorContainerRef} className="relative flex-1 min-h-0 bg-[#050816]">
            <div className="config-editor-codemirror absolute inset-0">
              {editorHeight > 0 && (
              <CodeMirror
                value={content}
                height={`${editorHeight}px`}
                theme={oneDark}
                extensions={extensions}
                basicSetup={{
                  foldGutter: true,
                  lineNumbers: true,
                  highlightActiveLine: true,
                  autocompletion: true,
                }}
                onChange={(value) => {
                  setContent(value)
                  setDirty(true)
                }}
              />
              )}
            </div>
            {showInitialLoadingState && (
              <div className="config-editor-loading-state absolute inset-0" aria-label="正在加载配置内容">
                <div className="config-editor-skeleton-row w-[34%]" />
                <div className="config-editor-skeleton-row w-[58%]" />
                <div className="config-editor-skeleton-row w-[46%]" />
                <div className="mt-5 space-y-2">
                  <div className="config-editor-skeleton-row w-[72%]" />
                  <div className="config-editor-skeleton-row w-[64%]" />
                  <div className="config-editor-skeleton-row w-[80%]" />
                  <div className="config-editor-skeleton-row w-[38%]" />
                </div>
              </div>
            )}
            {isRefreshingContent && (
              <div className="config-editor-loading-overlay">
                <span>正在加载</span>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-slate-800 bg-[#0f172a] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-sm font-medium text-slate-500">
            保存前会校验 {languageLabel} 格式
          </div>
          <div className="flex flex-wrap items-center gap-2" style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
            <button
              onClick={reload}
              disabled={loadingContent || saving}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              重新加载
            </button>
            {currentFile?.language === 'json' && (
              <button
                onClick={formatJSON}
                disabled={loadingContent || saving}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                格式化 JSON
              </button>
            )}
            <button
              onClick={save}
              disabled={loadingContent || saving || !dirty}
              className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中' : '保存配置'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
