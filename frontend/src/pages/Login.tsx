import { useState } from 'react'
import { Login } from '../../wailsjs/go/main/App'

interface Props {
  onLogin: () => void
}

const defaultServerURL = 'https://ai.allrealai.com'

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }
    setError('')
    setLoading(true)
    try {
      await Login(defaultServerURL, username, password)
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
    <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center px-6"
         style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
      <div className="w-full max-w-sm" style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
        <div className="mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-lg font-semibold text-slate-100">AllReal Config</h1>
          <p className="mt-1 text-sm text-slate-500">AI 编程工具一键配置助手</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm text-slate-300">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm text-slate-300">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium
                       hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          {error && (
            <p className="rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
