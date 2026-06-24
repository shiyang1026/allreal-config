import CustomSelect from '../ui/CustomSelect'
import ActionButton from '../ui/ActionButton'
import type { CodexSelection, ModelOption } from '../../types/dashboard'

const REASONING_EFFORT_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

interface Props {
  hasToken: boolean
  loadingModels: boolean
  models: ModelOption[]
  selection: CodexSelection
  canConfigure: boolean
  configuring: boolean
  onChange: (field: keyof CodexSelection, value: string) => void
  onConfigure: () => void
}

export default function CodexConfigCard({
  hasToken,
  loadingModels,
  models,
  selection,
  canConfigure,
  configuring,
  onChange,
  onConfigure,
}: Props) {
  const modelOptions = models.map((m) => ({
    value: m.id,
    label: m.display_name && m.display_name !== m.id ? `${m.display_name} (${m.id})` : m.id,
  }))

  return (
    <section className="section-block">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-title">CodeX</h2>
        {loadingModels && <span className="text-xs text-slate-500">加载模型中...</span>}
      </div>

      {!hasToken ? (
        <p className="py-4 text-sm text-slate-500">请先选择令牌</p>
      ) : (
        <>
          <div className="adaptive-form-grid">
            <label className="block min-w-0">
              <span className="mb-1 block text-xs text-slate-500">模型</span>
              <CustomSelect
                value={selection.model}
                options={modelOptions}
                placeholder={modelOptions.length === 0 ? '选择令牌后加载' : '请选择模型'}
                disabled={loadingModels || modelOptions.length === 0}
                onChange={(v) => onChange('model', v)}
              />
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-xs text-slate-500">推理力度</span>
              <CustomSelect
                value={selection.reasoningEffort}
                options={REASONING_EFFORT_OPTIONS}
                disabled={loadingModels}
                onChange={(v) => onChange('reasoningEffort', v)}
              />
            </label>
          </div>
          <div className="mt-4">
            <ActionButton
              label="配置 CodeX"
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
