interface Props {
  serverURL: string
  onLogout: () => void
}

export default function DashboardHeader({ serverURL, onLogout }: Props) {
  return (
    <div className="app-shell flex items-center justify-between gap-4 px-5 pt-10 pb-5"
         style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-slate-100">AllReal Config</h1>
        {!serverURL && <p className="truncate text-xs text-slate-500">未连接中转站</p>}
      </div>
      <button onClick={onLogout}
              className="shrink-0 rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-colors">
        退出登录
      </button>
    </div>
  )
}
