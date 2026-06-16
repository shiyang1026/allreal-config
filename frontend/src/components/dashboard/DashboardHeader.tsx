interface Props {
  serverURL: string
  onLogout: () => void
}

export default function DashboardHeader({ serverURL, onLogout }: Props) {
  return (
    <div className="app-shell flex items-center justify-between px-5 pt-10 pb-3"
         style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
      <div>
        <h1 className="text-lg font-semibold text-white">AllReal Config</h1>
        <p className="text-xs text-slate-500">{serverURL}</p>
      </div>
      <button onClick={onLogout}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
        退出登录
      </button>
    </div>
  )
}
