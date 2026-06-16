import { EditIcon, RefreshIcon } from './icons'

interface Props {
  label: string
  configured: boolean
  statusText?: string
  statusColor?: string
  detail?: string
  detailColor?: string
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
  onOpen,
  onRefresh,
}: Props) {
  const displayStatus = statusText ?? (configured ? '✓ 已配置' : '未配置')
  const displayColor = statusColor ?? (configured ? 'text-green-400' : 'text-slate-500')

  return (
    <div className="px-3 py-2.5 flex items-center gap-3">
      <span className="text-sm text-slate-300 shrink-0">{label}</span>
      <div className="flex-1 text-right">
        <span className={`text-xs ${displayColor}`}>{displayStatus}</span>
        {detail && <p className={`text-xs mt-0.5 truncate ${detailColor || 'text-slate-500'}`}>{detail}</p>}
      </div>
      {(onRefresh || onOpen) && (
        <div className="flex items-center gap-1 shrink-0">
          {onRefresh && (
            <button onClick={onRefresh} title="重新检测"
                    className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-700 transition-colors">
              <RefreshIcon />
            </button>
          )}
          {onOpen && (
            <button onClick={onOpen} title="打开配置文件"
                    className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-700 transition-colors">
              <EditIcon />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
