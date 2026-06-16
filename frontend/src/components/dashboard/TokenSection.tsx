import { RefreshIcon } from './icons'
import type { Token } from '../../types/dashboard'

interface Props {
  tokens: Token[]
  selectedToken: number | null
  refreshing: boolean
  onSelectToken: (tokenID: number) => void
  onRefresh: () => void
}

export default function TokenSection({ tokens, selectedToken, refreshing, onSelectToken, onRefresh }: Props) {
  return (
    <section className="section-block">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">选择令牌</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{tokens.length} 个可用</span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title={refreshing ? '正在刷新令牌' : '刷新令牌'}
            aria-label={refreshing ? '正在刷新令牌' : '刷新令牌'}
            className="rounded-md p-1 text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className={`block ${refreshing ? 'animate-spin' : ''}`}>
              <RefreshIcon />
            </span>
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto border-y border-slate-800">
        {tokens.length === 0 && (
          <p className="py-4 text-sm text-slate-500">暂无可用令牌</p>
        )}
        {tokens.map((token) => (
          <button
            key={token.id}
            onClick={() => onSelectToken(token.id)}
            className={`group w-full text-left px-1 py-3 text-sm transition-colors ${
              selectedToken === token.id
                ? 'text-white'
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`h-2 w-2 shrink-0 rounded-full ${
                selectedToken === token.id ? 'bg-blue-400' : 'bg-slate-700 group-hover:bg-slate-500'
              }`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-medium">{token.name}</span>
                  {!token.unlimited_quota && (
                    <span className="shrink-0 text-xs text-slate-500">
                      {formatQuota(token.remain_quota)}
                    </span>
                  )}
                </div>
                {token.expired_time !== -1 && (
                  <div className="mt-0.5 text-xs text-slate-500">
                    {formatExpiry(token.expired_time)}
                    {!token.unlimited_quota && ` · 已用 ${formatQuota(token.used_quota)}`}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function formatQuota(quota: number) {
  if (quota >= 1000000) return `${(quota / 1000000).toFixed(1)}M`
  if (quota >= 1000) return `${(quota / 1000).toFixed(0)}K`
  return quota.toString()
}

function formatExpiry(ts: number) {
  const d = new Date(ts * 1000)
  return d.toLocaleDateString('zh-CN')
}
