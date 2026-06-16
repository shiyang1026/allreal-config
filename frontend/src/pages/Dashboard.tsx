import DashboardHeader from '../components/dashboard/DashboardHeader'
import TokenSection from '../components/dashboard/TokenSection'
import ClaudeModelSection from '../components/dashboard/ClaudeModelSection'
import QuickActionsSection from '../components/dashboard/QuickActionsSection'
import StatusSection from '../components/dashboard/StatusSection'
import { useDashboard } from '../hooks/useDashboard'

interface Props {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: Props) {
  const dashboard = useDashboard(onLogout)

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col"
         style={{ '--wails-draggable': 'drag' } as React.CSSProperties}>
      <DashboardHeader serverURL={dashboard.serverURL} onLogout={dashboard.logout} />

      {dashboard.message && (
        <div className="app-shell mx-auto mb-3 px-5">
          <div className={`px-3 py-2 rounded-lg text-sm ${
            dashboard.message.type === 'success'
              ? 'bg-green-900/50 text-green-300 border border-green-800'
              : 'bg-red-900/50 text-red-300 border border-red-800'
          }`}>
            {dashboard.message.text}
          </div>
        </div>
      )}

      <div className="app-shell flex-1 overflow-y-auto px-5 pb-5 space-y-4"
           style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}>
        <TokenSection
          tokens={dashboard.tokens}
          selectedToken={dashboard.selectedToken}
          onSelectToken={dashboard.selectToken}
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

        <QuickActionsSection
          selectedToken={dashboard.selectedToken}
          loading={dashboard.loading}
          canConfigureClaude={dashboard.canConfigureClaude}
          ccSwitchInstalled={!!dashboard.configStatus?.cc_switch?.installed}
          onConfigureClaude={dashboard.configureClaude}
          onConfigureCodex={dashboard.configureCodex}
          onDetectCCSwitch={dashboard.refreshData}
          onUninstallCCSwitch={dashboard.uninstallCCSwitch}
        />

        <StatusSection
          configStatus={dashboard.configStatus}
          editors={dashboard.editors}
          selectedEditor={dashboard.selectedEditor}
          onSelectEditor={dashboard.setSelectedEditor}
          onOpenClaude={dashboard.openClaudeConfig}
          onOpenCodex={dashboard.openCodexConfig}
          onRefresh={dashboard.refreshStatus}
        />
      </div>
    </div>
  )
}
