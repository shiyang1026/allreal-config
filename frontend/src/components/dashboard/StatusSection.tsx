import StatusRow from './StatusRow'
import { EditIcon } from './icons'
import type { ConfigStatus, ShellConflict } from '../../types/dashboard'

interface Props {
  configStatus: ConfigStatus | null
  refreshing: boolean
  onOpenClaude: () => void
  onOpenCodex: () => void
  onOpenShell: (fileID: string) => void
  onRefresh: () => void
}

export default function StatusSection({
  configStatus,
  refreshing,
  onOpenClaude,
  onOpenCodex,
  onOpenShell,
  onRefresh,
}: Props) {
  const conflicts = configStatus?.shell_conflicts || []

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

      {conflicts.length > 0 && (
        <div className="mt-3 space-y-2">
          {conflicts.map((conflict) => (
            <ShellConflictRow
              key={conflict.file_id}
              conflict={conflict}
              onOpen={() => onOpenShell(conflict.file_id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ShellConflictRow({ conflict, onOpen }: { conflict: ShellConflict; onOpen: () => void }) {
  const uniqueVars = Array.from(new Set(conflict.matches.map((m) => m.variable)))
  return (
    <div className="flex items-start gap-3 border border-amber-500/40 bg-amber-500/5 px-3 py-2 rounded-md">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-200">
          {conflict.label} 中检测到可能覆盖配置的环境变量
        </p>
        <p className="mt-0.5 truncate text-xs text-amber-300/70" title={conflict.path}>
          {conflict.path}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {uniqueVars.map((variable) => (
            <span
              key={variable}
              className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-mono text-amber-100"
            >
              {variable}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onOpen}
        title="在编辑器中查看"
        aria-label="在编辑器中查看"
        className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-100 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
      >
        <EditIcon />
        <span>查看</span>
      </button>
    </div>
  )
}
