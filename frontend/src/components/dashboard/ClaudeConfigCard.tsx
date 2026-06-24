import CustomSelect from '../ui/CustomSelect'
import ActionButton from '../ui/ActionButton'
import type { ClaudeModelSelection, ModelOption } from '../../types/dashboard'

interface Props {
  hasToken: boolean
  loadingModels: boolean
  models: ModelOption[]
  selection: ClaudeModelSelection
  canConfigure: boolean
  configuring: boolean
  onChange: (field: keyof ClaudeModelSelection, value: string) => void
  onConfigure: () => void
}

export default function ClaudeConfigCard({
  hasToken,
  loadingModels,
  models,
  selection,
  canConfigure,
  configuring,
  onChange,
  onConfigure,
}: Props) {
  const options = models.map((m) => ({
    value: m.id,
    label: m.display_name && m.display_name !== m.id ? `${m.display_name} (${m.id})` : m.id,
  }))

  return (
    <section className="section-block">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-title">Claude Code</h2>
        {loadingModels && <span className="text-xs text-slate-500">加载模型中...</span>}
      </div>

      {!hasToken ? (
        <p className="py-4 text-sm text-slate-500">请先选择令牌</p>
      ) : (
        <>
          <div className="adaptive-form-grid">
            <ModelSelect label="Haiku" value={selection.haiku} options={options} disabled={loadingModels} onChange={(v) => onChange('haiku', v)} />
            <ModelSelect label="Sonnet" value={selection.sonnet} options={options} disabled={loadingModels} onChange={(v) => onChange('sonnet', v)} />
            <ModelSelect label="Opus" value={selection.opus} options={options} disabled={loadingModels} onChange={(v) => onChange('opus', v)} />
            <ModelSelect label="Subagent" value={selection.subagent} options={options} disabled={loadingModels} onChange={(v) => onChange('subagent', v)} />
          </div>
          <div className="mt-4">
            <ActionButton
              label="配置 Claude Code"
              onClick={onConfigure}
              loading={configuring}
              disabled={!canConfigure}
              color="blue"
            />
          </div>
        </>
      )}
    </section>
  )
}

function ModelSelect({ label, value, options, disabled, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[]
  disabled: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <CustomSelect
        value={value}
        options={options}
        placeholder={options.length === 0 ? '选择令牌后加载' : '请选择模型'}
        disabled={disabled || options.length === 0}
        onChange={onChange}
      />
    </label>
  )
}
