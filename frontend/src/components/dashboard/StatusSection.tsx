import CustomSelect from '../ui/CustomSelect'
import StatusRow from './StatusRow'
import type { ConfigStatus, Editor } from '../../types/dashboard'

interface Props {
  configStatus: ConfigStatus | null
  editors: Editor[]
  selectedEditor: string
  onSelectEditor: (editorID: string) => void
  onOpenClaude: () => void
  onOpenCodex: () => void
  onRefresh: () => void
}

export default function StatusSection({
  configStatus,
  editors,
  selectedEditor,
  onSelectEditor,
  onOpenClaude,
  onOpenCodex,
  onRefresh,
}: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-slate-300">当前状态</h2>
        {editors.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">打开方式</span>
            <CustomSelect
              value={selectedEditor}
              options={editors.map((e) => ({ value: e.id, label: e.name }))}
              onChange={onSelectEditor}
              size="sm"
            />
          </div>
        )}
      </div>
      <div className="bg-slate-800 rounded-lg border border-slate-700 divide-y divide-slate-700">
        <StatusRow
          label="Claude Code"
          configured={configStatus?.claude_code?.configured || false}
          detail={configStatus?.claude_code?.base_url}
          onOpen={onOpenClaude}
          onRefresh={onRefresh}
        />
        <StatusRow
          label="CodeX"
          configured={configStatus?.codex?.configured || false}
          detail={configStatus?.codex?.base_url}
          onOpen={onOpenCodex}
          onRefresh={onRefresh}
        />
        <StatusRow
          label="cc-switch"
          configured={!configStatus?.cc_switch?.installed}
          statusText={configStatus?.cc_switch?.installed ? '已安装' : '未检测到'}
          statusColor={configStatus?.cc_switch?.installed ? 'text-red-400' : 'text-slate-500'}
          detail={configStatus?.cc_switch?.polluted ? '配置已被污染' : undefined}
          detailColor="text-amber-400"
          onRefresh={onRefresh}
        />
      </div>
    </section>
  )
}
