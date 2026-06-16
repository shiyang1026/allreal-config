import CustomSelect from '../ui/CustomSelect'
import type { ClaudeModelSelection, ModelOption } from '../../types/dashboard'

interface Props {
  visible: boolean
  loading: boolean
  collapsed: boolean
  models: ModelOption[]
  selection: ClaudeModelSelection
  onToggleCollapsed: () => void
  onChange: (field: keyof ClaudeModelSelection, value: string) => void
}

export default function ClaudeModelSection({
  visible,
  loading,
  collapsed,
  models,
  selection,
  onToggleCollapsed,
  onChange,
}: Props) {
  if (!visible) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          <span>Claude Code 模型</span>
          <span className={`text-slate-500 transition-transform ${collapsed ? '-rotate-90' : ''}`}>⌄</span>
        </button>
        {loading && !collapsed && <span className="text-xs text-slate-500">加载中...</span>}
      </div>
      {!collapsed && (
        <div className="adaptive-form-grid">
          <ModelSelect
            label="Haiku"
            value={selection.haiku}
            models={models}
            disabled={loading}
            onChange={(value) => onChange('haiku', value)}
          />
          <ModelSelect
            label="Sonnet"
            value={selection.sonnet}
            models={models}
            disabled={loading}
            onChange={(value) => onChange('sonnet', value)}
          />
          <ModelSelect
            label="Opus"
            value={selection.opus}
            models={models}
            disabled={loading}
            onChange={(value) => onChange('opus', value)}
          />
          <ModelSelect
            label="Subagent"
            value={selection.subagent}
            models={models}
            disabled={loading}
            onChange={(value) => onChange('subagent', value)}
          />
        </div>
      )}
    </section>
  )
}

function ModelSelect({ label, value, models, disabled, onChange }: {
  label: string
  value: string
  models: ModelOption[]
  disabled: boolean
  onChange: (value: string) => void
}) {
  const options = models.map((model) => ({
    value: model.id,
    label: model.display_name && model.display_name !== model.id ? `${model.display_name} (${model.id})` : model.id,
  }))

  return (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-1">{label}</span>
      <CustomSelect
        value={value}
        options={options}
        placeholder={models.length === 0 ? '选择令牌后加载' : '请选择模型'}
        disabled={disabled || models.length === 0}
        onChange={onChange}
      />
    </label>
  )
}
