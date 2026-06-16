import type { Token } from '../../types/dashboard'

interface Props {
  tokens: Token[]
  selectedToken: number | null
  onSelectToken: (tokenID: number) => void
}

export default function TokenSection({ tokens, selectedToken, onSelectToken }: Props) {
  return (
    <section>
      <h2 className="text-sm font-medium text-slate-300 mb-2">选择令牌</h2>
      <div className="adaptive-token-grid max-h-72 overflow-y-auto">
        {tokens.length === 0 && (
          <p className="text-slate-500 text-sm py-2">暂无可用令牌</p>
        )}
        {tokens.map((token) => (
          <button
            key={token.id}
            onClick={() => onSelectToken(token.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedToken === token.id
                ? 'bg-blue-600/20 border border-blue-500/50 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium truncate mr-2">{token.name}</span>
              <span className="text-xs text-slate-500 shrink-0">
                {token.unlimited_quota ? '无限额度' : formatQuota(token.remain_quota)}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {formatExpiry(token.expired_time)}
              {!token.unlimited_quota && ` · 已用 ${formatQuota(token.used_quota)}`}
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
  if (ts === -1) return '永不过期'
  const d = new Date(ts * 1000)
  return d.toLocaleDateString('zh-CN')
}
