import DashboardHeader from '../components/dashboard/DashboardHeader'
import BaseURLSection from '../components/dashboard/BaseURLSection'
import TokenSection from '../components/dashboard/TokenSection'
import ClaudeModelSection from '../components/dashboard/ClaudeModelSection'
import QuickActionsSection from '../components/dashboard/QuickActionsSection'
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
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <BaseURLSection
              serverURL={dashboard.serverURL}
              updating={dashboard.updatingServerURL}
              onChange={dashboard.changeServerURL}
            />

            <TokenSection
              tokens={dashboard.tokens}
              selectedToken={dashboard.selectedToken}
              refreshing={dashboard.refreshingTokens}
              onSelectToken={dashboard.selectToken}
              onRefresh={dashboard.refreshTokens}
            />

            <ClaudeModelSection
              visible={!!dashboard.selectedToken}
              loading={dashboard.loadingModels}
              collapsed={dashboard.claudeModelsCollapsed}
              models={dashboard.claudeModels}
              selection={dashboard.claudeSelection}
              onToggleCollapsed={dashboard.toggleClaudeModelsCollapsed}
              onChange={dashboard.updateClaudeSelection}
            />
          </div>

          <div className="space-y-5">
            <QuickActionsSection
              selectedToken={dashboard.selectedToken}
              loading={dashboard.loading}
              canConfigureClaude={dashboard.canConfigureClaude}
              onConfigureClaude={dashboard.configureClaude}
              onConfigureCodex={dashboard.configureCodex}
            />

            <StatusSection
              configStatus={dashboard.configStatus}
              refreshing={dashboard.refreshingStatus}
              onOpenClaude={dashboard.openClaudeConfig}
              onOpenCodex={dashboard.openCodexConfig}
              onRefresh={dashboard.refreshStatus}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
