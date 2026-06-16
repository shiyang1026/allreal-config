import { useState } from 'react'
import { Login, CheckServer } from '../../wailsjs/go/main/App'

interface Props {
  onLogin: () => void
}

const serverOptions = [
  { label: '中国节点', value: 'https://cn.allrealai.com' },
  { label: '国际节点', value: 'https://ai.allrealai.com' },
]

export default function LoginPage({ onLogin }: Props) {
  const [serverURL, setServerURL] = useState('https://cn.allrealai.com')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [serverName, setServerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingServer, setCheckingServer] = useState(false)
  const [serverChecked, setServerChecked] = useState(false)

  const checkServer = async () => {
    setError('')
    setCheckingServer(true)
    try {
      const status = await CheckServer(serverURL)
      if (status) {
        setServerName(status.system_name || '已连接')
        setServerChecked(true)
      }
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setCheckingServer(false)
    }
  }

  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setError('')
    setLoading(true)
    try {
      await Login(serverURL, username, password)
      onLogin()
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6"
         style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
      <div className="w-full max-w-sm" style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
        <h1 className="text-2xl font-bold text-white text-center mb-2">AllReal Config</h1>
        <p className="text-slate-400 text-sm text-center mb-8">AI 编程工具一键配置助手</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">中转站地址</label>
            <div className="flex gap-2">
              <select
                value={serverURL}
                onChange={(e) => {
                  setServerURL(e.target.value)
                  setServerChecked(false)
                  setServerName('')
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                           focus:outline-none focus:border-blue-500 transition-colors"
              >
                {serverOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} · {option.value}
                  </option>
                ))}
              </select>
              <button
                onClick={checkServer}
                disabled={loading || checkingServer || !serverURL}
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {checkingServer ? '检测中...' : '检测'}
              </button>
            </div>
            {serverName && (
              <p className="text-green-400 text-xs mt-1">✓ {serverName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                       hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
