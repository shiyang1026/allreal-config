import { useState, useEffect } from 'react'
import './style.css'
import { Login, IsLoggedIn, GetServerURL, Logout, GetTokens, RevealTokenKey, ConfigureClaudeCode, ConfigureCodex, GetConfigStatus, CheckServer, UninstallCCSwitch } from '../wailsjs/go/main/App'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    IsLoggedIn().then((result) => {
      setLoggedIn(result)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    )
  }

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  return <Dashboard onLogout={() => setLoggedIn(false)} />
}

export default App
