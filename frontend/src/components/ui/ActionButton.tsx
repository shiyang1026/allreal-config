interface Props {
  label: string
  onClick: () => void
  loading: boolean
  disabled: boolean
  color: string
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20',
  emerald: 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20',
  amber: 'bg-amber-600/10 border-amber-500/30 text-amber-400 hover:bg-amber-600/20',
  red: 'bg-red-600/10 border-red-500/30 text-red-400 hover:bg-red-600/20',
}

export default function ActionButton({ label, onClick, loading, disabled, color }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-3 rounded-lg text-sm border transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed ${colorMap[color] || colorMap.blue}`}
    >
      {loading ? '处理中...' : label}
    </button>
  )
}
