import ActionButton from '../ui/ActionButton'

interface Props {
  selectedToken: number | null
  loading: string
  canConfigureClaude: boolean
  onConfigureClaude: () => void
  onConfigureCodex: () => void
}

export default function QuickActionsSection({
  selectedToken,
  loading,
  canConfigureClaude,
  onConfigureClaude,
  onConfigureCodex,
}: Props) {
  return (
    <section className="section-block">
      <div className="mb-3">
        <h2 className="section-title">配置操作</h2>
      </div>
      <div className="adaptive-action-grid">
        <ActionButton
          label="配置 Claude Code"
          onClick={onConfigureClaude}
          loading={loading === '配置 Claude Code'}
          disabled={!canConfigureClaude}
          color="blue"
        />
        <ActionButton
          label="配置 CodeX"
          onClick={onConfigureCodex}
          loading={loading === '配置 CodeX'}
          disabled={!selectedToken || !!loading}
          color="emerald"
        />
      </div>
    </section>
  )
}
