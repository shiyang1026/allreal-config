interface Props {
  label: string
  onClick: () => void
  loading: boolean
  disabled: boolean
  color: string
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-600 text-white hover:bg-blue-500 border-blue-600',
  emerald: 'bg-slate-900 text-emerald-300 hover:bg-slate-800 border-slate-700',
  amber: 'bg-slate-900 text-amber-300 hover:bg-slate-800 border-slate-700',
  red: 'bg-slate-900 text-red-300 hover:bg-slate-800 border-slate-700',
}

export default function ActionButton({ label, onClick, loading, disabled, color }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-md text-sm border text-left transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed ${colorMap[color] || colorMap.blue}`}
    >
      {loading ? '处理中...' : label}
    </button>
  )
}
