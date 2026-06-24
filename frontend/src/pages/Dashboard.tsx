import DashboardHeader from '../components/dashboard/DashboardHeader'
import BaseURLSection from '../components/dashboard/BaseURLSection'
import TokenSection from '../components/dashboard/TokenSection'
import ClaudeConfigCard from '../components/dashboard/ClaudeConfigCard'
import CodexConfigCard from '../components/dashboard/CodexConfigCard'
import StatusSection from '../components/dashboard/StatusSection'
import Toast from '../components/ui/Toast'
import { useDashboard } from '../hooks/useDashboard'

interface Props {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: Props) {
  const dashboard = useDashboard(onLogout)

  return (
    <div className="h-screen min-h-0 bg-[#0b1120] flex flex-col"
         style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
      <DashboardHeader serverURL={dashboard.serverURL} onLogout={dashboard.logout} />
      <Toast message={dashboard.message} />

      <div className="app-shell min-h-0 flex-1 overflow-y-auto px-5 pb-5"
           style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
        <div className="space-y-5">
          <BaseURLSection
            serverURL={dashboard.serverURL}
            updating={dashboard.updatingServerURL}
            onChange={dashboard.changeServerURL}
          />

          <StatusSection
            configStatus={dashboard.configStatus}
            refreshing={dashboard.refreshingStatus}
            onOpenClaude={dashboard.openClaudeConfig}
            onOpenCodex={dashboard.openCodexConfig}
            onRefresh={dashboard.refreshStatus}
          />

          <TokenSection
            tokens={dashboard.tokens}
            selectedToken={dashboard.selectedToken}
            refreshing={dashboard.refreshingTokens}
            onSelectToken={dashboard.selectToken}
            onRefresh={dashboard.refreshTokens}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <ClaudeConfigCard
              hasToken={!!dashboard.selectedToken}
              loadingModels={dashboard.loadingClaudeModels}
              models={dashboard.claudeModels}
              selection={dashboard.claudeSelection}
              canConfigure={dashboard.canConfigureClaude}
              configuring={dashboard.loading === '配置 Claude Code'}
              onChange={dashboard.updateClaudeSelection}
              onConfigure={dashboard.configureClaude}
            />
            <CodexConfigCard
              hasToken={!!dashboard.selectedToken}
              loadingModels={dashboard.loadingCodexModels}
              models={dashboard.codexModels}
              selection={dashboard.codexSelection}
              canConfigure={dashboard.canConfigureCodex}
              configuring={dashboard.loading === '配置 CodeX'}
              onChange={dashboard.updateCodexSelection}
              onConfigure={dashboard.configureCodex}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
