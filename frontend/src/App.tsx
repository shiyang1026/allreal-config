import { useState, useEffect } from 'react'
import './style.css'
import { GetLaunchContext, IsLoggedIn } from '../wailsjs/go/main/App'
import { Quit } from '../wailsjs/runtime/runtime'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import ConfigEditor from './components/config-editor/ConfigEditor'
import Toast from './components/ui/Toast'
import type { Message } from './types/dashboard'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [launchMode, setLaunchMode] = useState('')
  const [initialFileID, setInitialFileID] = useState('claude')

  useEffect(() => {
    Promise.all([GetLaunchContext(), IsLoggedIn()]).then(([launch, result]) => {
      setLaunchMode(launch?.mode || '')
      setInitialFileID(launch?.initial_file_id || 'claude')
      setLoggedIn(result)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <div className="h-screen bg-[#0b1120]" />
  }

  if (launchMode === 'config-editor') {
    return <ConfigEditorWindow initialFileID={initialFileID} />
  }

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />
  }

  return <Dashboard onLogout={() => setLoggedIn(false)} />
}

function ConfigEditorWindow({ initialFileID }: { initialFileID: string }) {
  const [message, setMessage] = useState<Message | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  return (
    <div className="h-screen bg-[#0b1120]">
      <Toast message={message} />
      <ConfigEditor
        initialFileID={initialFileID}
        onClose={Quit}
        onSaved={(text) => showMessage('success', text)}
        onError={(text) => showMessage('error', text)}
      />
    </div>
  )
}

export default App
