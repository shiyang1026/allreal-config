import { useEffect, useState } from 'react'
import {
  ConfigureClaudeCode,
  ConfigureCodex,
  GetAvailableEditors,
  GetClaudeCodeModels,
  GetConfigStatus,
  GetServerURL,
  GetTokens,
  Logout,
  OpenConfigFile,
  RevealTokenKey,
  UninstallCCSwitch,
} from '../../wailsjs/go/main/App'
import type { ClaudeModelSelection, ConfigStatus, Editor, Message, ModelOption, Token } from '../types/dashboard'

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
  const [editors, setEditors] = useState<Editor[]>([])
  const [selectedEditor, setSelectedEditor] = useState('default')

  useEffect(() => {
    loadData()
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const loadData = async () => {
    try {
      const [tokenResp, status, url, editorList] = await Promise.all([
        GetTokens(),
        GetConfigStatus(),
        GetServerURL(),
        GetAvailableEditors(),
      ])
      if (tokenResp?.items) {
        setTokens(tokenResp.items.filter((t: Token) => t.status === 1))
      }
      setConfigStatus(status)
      setServerURL(url)
      if (editorList) setEditors(editorList)
    } catch (e: any) {
      showMessage('error', e?.message || '加载失败')
    }
  }

  const loadClaudeModelsForToken = async (tokenID: number) => {
    setSelectedToken(tokenID)
    setSelectedTokenKey('')
    setClaudeModels([])
    setClaudeModelsCollapsed(false)
    setClaudeSelection({ haiku: '', sonnet: '', opus: '', subagent: '' })
    setLoadingModels(true)
    try {
      const key = await RevealTokenKey(tokenID)
      const models = await GetClaudeCodeModels(key)
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
      showMessage('error', e?.message || '加载模型失败')
    } finally {
      setLoadingModels(false)
    }
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

  const uninstallCCSwitch = async () => {
    setLoading('卸载 cc-switch')
    try {
      const result = await UninstallCCSwitch()
      if (result.success) {
        showMessage('success', result.message)
        setConfigStatus(await GetConfigStatus())
      } else {
        showMessage('error', result.message)
      }
    } catch (e: any) {
      showMessage('error', e?.message || '卸载失败')
    } finally {
      setLoading('')
    }
  }

  const refreshStatus = async () => {
    try {
      setConfigStatus(await GetConfigStatus())
    } catch {}
  }

  const logout = () => {
    Logout()
    onLogout()
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
    editors,
    selectedEditor,
    canConfigureClaude,
    selectToken: loadClaudeModelsForToken,
    updateClaudeSelection,
    toggleClaudeModelsCollapsed: () => setClaudeModelsCollapsed((collapsed) => !collapsed),
    configureClaude: () => configure('claude'),
    configureCodex: () => configure('codex'),
    refreshData: loadData,
    refreshStatus,
    uninstallCCSwitch,
    logout,
    setSelectedEditor,
    openClaudeConfig: () => OpenConfigFile('claude', selectedEditor),
    openCodexConfig: () => OpenConfigFile('codex', selectedEditor),
  }
}

function pickModel(models: ModelOption[], keyword: string, fallback = '') {
  return models.find((m) => m.id.toLowerCase().includes(keyword))?.id || fallback || models[0]?.id || ''
}
