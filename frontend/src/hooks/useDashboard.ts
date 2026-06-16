import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import {
  ConfigureClaudeCode,
  ConfigureCodex,
  GetClaudeCodeModels,
  GetConfigStatus,
  GetServerURL,
  GetTokens,
  Logout,
  OpenConfigEditorWindow,
  RevealTokenKey,
  UpdateServerURL,
} from '../../wailsjs/go/main/App'
import type { ClaudeModelSelection, ConfigStatus, Message, ModelOption, Token } from '../types/dashboard'

const TOKEN_REFRESH_COOLDOWN_MS = 5000
const STATUS_REFRESH_COOLDOWN_MS = 3000
const MODEL_LOAD_DEBOUNCE_MS = 300

export function useDashboard(onLogout: () => void) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [selectedToken, setSelectedToken] = useState<number | null>(null)
  const [selectedTokenKey, setSelectedTokenKey] = useState('')
  const [claudeModels, setClaudeModels] = useState<ModelOption[]>([])
  const [claudeModelsCollapsed, setClaudeModelsCollapsed] = useState(false)
  const [claudeSelection, setClaudeSelection] = useState<ClaudeModelSelection>({
    haiku: '',
    sonnet: '',
    opus: '',
    subagent: '',
  })
  const [loadingModels, setLoadingModels] = useState(false)
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState('')
  const [serverURL, setServerURL] = useState('')
  const [updatingServerURL, setUpdatingServerURL] = useState(false)
  const [refreshingTokens, setRefreshingTokens] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState(false)
  const tokenRefreshInFlightRef = useRef(false)
  const lastTokenRefreshAtRef = useRef(0)
  const statusRefreshInFlightRef = useRef(false)
  const lastStatusRefreshAtRef = useRef(0)
  const modelLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const modelLoadRequestRef = useRef(0)

  useEffect(() => {
    loadData()
    return () => {
      if (modelLoadTimerRef.current) clearTimeout(modelLoadTimerRef.current)
    }
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const loadData = async () => {
    try {
      const [tokenResp, status, url] = await Promise.all([
        GetTokens(),
        GetConfigStatus(),
        GetServerURL(),
      ])
      if (tokenResp?.items) {
        setTokens(tokenResp.items.filter((t: Token) => t.status === 1))
      }
      setConfigStatus(status)
      setServerURL(url)
    } catch (e: any) {
      showMessage('error', e?.message || '加载失败')
    }
  }

  const refreshTokens = async () => {
    if (!startRateLimitedAction(
      tokenRefreshInFlightRef,
      lastTokenRefreshAtRef,
      TOKEN_REFRESH_COOLDOWN_MS,
      showMessage,
    )) return

    setRefreshingTokens(true)
    try {
      const tokenResp = await GetTokens()
      const activeTokens = tokenResp?.items?.filter((t: Token) => t.status === 1) || []
      setTokens(activeTokens)
      setSelectedToken((current) => {
        if (!current || activeTokens.some((token: Token) => token.id === current)) return current
        setSelectedTokenKey('')
        setClaudeModels([])
        setClaudeModelsCollapsed(false)
        setClaudeSelection({ haiku: '', sonnet: '', opus: '', subagent: '' })
        return null
      })
      showMessage('success', '令牌列表已刷新')
    } catch (e: any) {
      showMessage('error', e?.message || '刷新令牌失败')
    } finally {
      tokenRefreshInFlightRef.current = false
      setRefreshingTokens(false)
    }
  }

  const loadClaudeModelsForToken = (tokenID: number) => {
    if (modelLoadTimerRef.current) clearTimeout(modelLoadTimerRef.current)

    const requestID = modelLoadRequestRef.current + 1
    modelLoadRequestRef.current = requestID
    setSelectedToken(tokenID)
    setSelectedTokenKey('')
    setClaudeModels([])
    setClaudeModelsCollapsed(false)
    setClaudeSelection({ haiku: '', sonnet: '', opus: '', subagent: '' })
    setLoadingModels(true)

    modelLoadTimerRef.current = setTimeout(async () => {
      try {
        const key = await RevealTokenKey(tokenID)
        const models = await GetClaudeCodeModels(key)
        if (modelLoadRequestRef.current !== requestID) return
        setSelectedTokenKey(key)
        setClaudeModels(models || [])
        const fallback = models?.[0]?.id || ''
        const sonnet = pickModel(models || [], 'sonnet', fallback)
        setClaudeSelection({
          haiku: pickModel(models || [], 'haiku', fallback),
          sonnet,
          opus: pickModel(models || [], 'opus', fallback),
          subagent: sonnet,
        })
      } catch (e: any) {
        if (modelLoadRequestRef.current === requestID) {
          showMessage('error', e?.message || '加载模型失败')
        }
      } finally {
        if (modelLoadRequestRef.current === requestID) {
          setLoadingModels(false)
        }
      }
    }, MODEL_LOAD_DEBOUNCE_MS)
  }

  const updateClaudeSelection = (field: keyof ClaudeModelSelection, value: string) => {
    setClaudeSelection((prev) => ({ ...prev, [field]: value }))
  }

  const configure = async (target: 'claude' | 'codex') => {
    if (!selectedToken) {
      showMessage('error', '请先选择一个令牌')
      return
    }
    const action = target === 'claude' ? '配置 Claude Code' : '配置 CodeX'
    setLoading(action)
    try {
      const key = selectedTokenKey || await RevealTokenKey(selectedToken)
      const result = target === 'claude'
        ? await ConfigureClaudeCode({
            auth_token: key,
            haiku_model: claudeSelection.haiku,
            sonnet_model: claudeSelection.sonnet,
            opus_model: claudeSelection.opus,
            subagent_model: claudeSelection.subagent,
          })
        : await ConfigureCodex(key)
      if (result.success) {
        showMessage('success', result.message)
        setConfigStatus(await GetConfigStatus())
      } else {
        showMessage('error', result.message)
      }
    } catch (e: any) {
      showMessage('error', e?.message || '操作失败')
    } finally {
      setLoading('')
    }
  }

  const refreshStatus = async () => {
    if (!startRateLimitedAction(
      statusRefreshInFlightRef,
      lastStatusRefreshAtRef,
      STATUS_REFRESH_COOLDOWN_MS,
      showMessage,
    )) return

    setRefreshingStatus(true)
    try {
      setConfigStatus(await GetConfigStatus())
      showMessage('success', '配置状态已刷新')
    } catch (e: any) {
      showMessage('error', e?.message || '刷新状态失败')
    } finally {
      statusRefreshInFlightRef.current = false
      setRefreshingStatus(false)
    }
  }

  const changeServerURL = async (nextURL: string) => {
    if (!nextURL || nextURL === serverURL) return
    setUpdatingServerURL(true)
    try {
      await UpdateServerURL(nextURL)
      setServerURL(nextURL)
      setSelectedToken(null)
      setSelectedTokenKey('')
      setClaudeModels([])
      setClaudeSelection({ haiku: '', sonnet: '', opus: '', subagent: '' })
      await loadData()
      showMessage('success', '中转站地址已更新')
    } catch (e: any) {
      showMessage('error', e?.message || '更新中转站地址失败')
    } finally {
      setUpdatingServerURL(false)
    }
  }

  const logout = () => {
    Logout()
    onLogout()
  }

  const openConfigEditor = async (fileID: string) => {
    try {
      const result = await OpenConfigEditorWindow(fileID)
      if (!result?.success && result?.message) {
        showMessage('error', result.message)
      }
    } catch (e: any) {
      showMessage('error', e?.message || '打开编辑器窗口失败')
    }
  }

  const canConfigureClaude = !!selectedToken && !loading && !loadingModels
    && !!claudeSelection.haiku
    && !!claudeSelection.sonnet
    && !!claudeSelection.opus
    && !!claudeSelection.subagent

  return {
    tokens,
    selectedToken,
    claudeModels,
    claudeModelsCollapsed,
    claudeSelection,
    loadingModels,
    configStatus,
    message,
    loading,
    serverURL,
    updatingServerURL,
    refreshingTokens,
    refreshingStatus,
    canConfigureClaude,
    selectToken: loadClaudeModelsForToken,
    refreshTokens,
    updateClaudeSelection,
    changeServerURL,
    toggleClaudeModelsCollapsed: () => setClaudeModelsCollapsed((collapsed) => !collapsed),
    configureClaude: () => configure('claude'),
    configureCodex: () => configure('codex'),
    refreshData: loadData,
    refreshStatus,
    logout,
    showError: (text: string) => showMessage('error', text),
    openClaudeConfig: () => openConfigEditor('claude'),
    openCodexConfig: () => openConfigEditor('codex-config'),
  }
}

function pickModel(models: ModelOption[], keyword: string, fallback = '') {
  return models.find((m) => m.id.toLowerCase().includes(keyword))?.id || fallback || models[0]?.id || ''
}

function startRateLimitedAction(
  inFlightRef: MutableRefObject<boolean>,
  lastRunAtRef: MutableRefObject<number>,
  cooldownMs: number,
  showMessage: (type: 'success' | 'error', text: string) => void,
) {
  if (inFlightRef.current) return false

  const now = Date.now()
  const elapsed = now - lastRunAtRef.current
  if (elapsed < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000)
    showMessage('error', `操作太频繁，请 ${waitSeconds} 秒后再试`)
    return false
  }

  inFlightRef.current = true
  lastRunAtRef.current = now
  return true
}
