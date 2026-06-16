import { EditIcon, RefreshIcon } from './icons'

interface Props {
  label: string
  configured: boolean
  statusText?: string
  statusColor?: string
  detail?: string
  detailColor?: string
  refreshing?: boolean
  onOpen?: () => void
  onRefresh?: () => void
}

export default function StatusRow({
  label,
  configured,
  statusText,
  statusColor,
  detail,
  detailColor,
  refreshing = false,
  onOpen,
  onRefresh,
}: Props) {
  const displayStatus = statusText ?? (configured ? '已配置' : '未配置')
  const displayColor = statusColor ?? (configured ? 'text-green-300' : 'text-slate-500')
  const dotColor = configured ? 'bg-green-400' : 'bg-slate-700'

  return (
    <div className="group flex items-center gap-3 py-3">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-slate-300">{label}</span>
        {detail && (
          <p className={`mt-0.5 truncate text-xs opacity-50 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${detailColor || 'text-slate-500'}`}>
            {detail}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className={`text-xs ${displayColor}`}>{displayStatus}</span>
        {(onRefresh || onOpen) && (
          <div className="flex items-center gap-1">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                title={refreshing ? '正在重新检测' : '重新检测'}
                aria-label={refreshing ? '正在重新检测' : '重新检测'}
                className="rounded-md p-1 text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={`block ${refreshing ? 'animate-spin' : ''}`}>
                  <RefreshIcon />
                </span>
              </button>
            )}
            {onOpen && (
              <button onClick={onOpen} title="编辑配置文件"
                      className="rounded-md p-1 text-slate-600 hover:bg-slate-800 hover:text-slate-300 transition-colors">
                <EditIcon />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
