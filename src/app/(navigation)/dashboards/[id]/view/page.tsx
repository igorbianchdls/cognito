import DashboardChatPanelViewOnly from "@/components/dashboards/DashboardChatPanelViewOnly";

export default function DashboardViewPage({ params }: { params: { id: string } }) {
  const id = params?.id;
  // Apenas renderiza o painel de dashboard usado no ChatPanel para máxima compatibilidade.
  // A URL deve conter ?dashboardId={id} (o botão View já garante isso).
  return <DashboardChatPanelViewOnly />;
}
