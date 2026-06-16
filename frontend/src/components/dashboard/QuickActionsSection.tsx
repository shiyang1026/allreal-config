import ActionButton from '../ui/ActionButton'

interface Props {
  selectedToken: number | null
  loading: string
  canConfigureClaude: boolean
  ccSwitchInstalled: boolean
  onConfigureClaude: () => void
  onConfigureCodex: () => void
  onDetectCCSwitch: () => void
  onUninstallCCSwitch: () => void
}

export default function QuickActionsSection({
  selectedToken,
  loading,
  canConfigureClaude,
  ccSwitchInstalled,
  onConfigureClaude,
  onConfigureCodex,
  onDetectCCSwitch,
  onUninstallCCSwitch,
}: Props) {
  return (
    <section>
      <h2 className="text-sm font-medium text-slate-300 mb-2">快捷操作</h2>
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
        <ActionButton
          label="检测 cc-switch"
          onClick={onDetectCCSwitch}
          loading={false}
          disabled={!!loading}
          color="amber"
        />
        <ActionButton
          label="卸载 cc-switch"
          onClick={onUninstallCCSwitch}
          loading={loading === '卸载 cc-switch'}
          disabled={!!loading || !ccSwitchInstalled}
          color="red"
        />
      </div>
    </section>
  )
}
