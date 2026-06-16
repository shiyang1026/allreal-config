import StatusRow from './StatusRow'
import type { ConfigStatus } from '../../types/dashboard'

interface Props {
  configStatus: ConfigStatus | null
  refreshing: boolean
  onOpenClaude: () => void
  onOpenCodex: () => void
  onRefresh: () => void
}

export default function StatusSection({
  configStatus,
  refreshing,
  onOpenClaude,
  onOpenCodex,
  onRefresh,
}: Props) {
  return (
    <section className="section-block">
      <div className="mb-2">
        <h2 className="section-title">当前状态</h2>
      </div>
      <div className="divide-y divide-slate-800 border-y border-slate-800">
        <StatusRow
          label="Claude Code"
          configured={configStatus?.claude_code?.configured || false}
          detail={configStatus?.claude_code?.base_url}
          refreshing={refreshing}
          onOpen={onOpenClaude}
          onRefresh={onRefresh}
        />
        <StatusRow
          label="CodeX"
          configured={configStatus?.codex?.configured || false}
          detail={configStatus?.codex?.base_url}
          refreshing={refreshing}
          onOpen={onOpenCodex}
          onRefresh={onRefresh}
        />
      </div>
    </section>
  )
}
