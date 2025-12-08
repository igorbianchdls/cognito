export default function DashboardsPage() {
  return <div>Dashboards</div>
}
"use client";

import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn";
import NexusHeader from "@/components/nexus/NexusHeader";
import NexusPageContainer from "@/components/nexus/NexusPageContainer";
import PageHeader from "@/components/modulos/PageHeader";
import TabsNav from "@/components/modulos/TabsNav";
import { $titulo, $tabs, $layout, moduleUiActions } from "@/stores/modulos/moduleUiStore";
import { Layout, Users, Globe2 } from "lucide-react";

export default function DashboardsPage() {
  const titulo = useStore($titulo);
  const tabs = useStore($tabs);
  const layout = useStore($layout);

  useEffect(() => {
    // Initialize module UI state for this page
    moduleUiActions.setTitulo({
      title: "Dashboards",
      subtitle: "Gerencie e navegue entre dashboards",
    });
    moduleUiActions.setTabs({
      options: [
        { value: "meus", label: "Meus", icon: <Layout className="text-blue-600" /> },
        { value: "equipe", label: "Equipe", icon: <Users className="text-emerald-600" /> },
        { value: "publicos", label: "Públicos", icon: <Globe2 className="text-gray-700" /> },
      ],
      selected: "meus",
    });
    moduleUiActions.setLayout({ contentBg: "rgb(253, 253, 253)", contentTopGap: 8, mbTitle: 16, mbTabs: 8 });
  }, []);

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: layout.contentBg }}>
          <div className="flex flex-col h-full w-full">
            <NexusHeader
              viewMode={"dashboard"}
              onChangeViewMode={() => { /* no-op for dashboards shell */ }}
              borderless
              size="sm"
              showBreadcrumb={false}
            />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2">
              <NexusPageContainer className="h-full">
                <div className="w-full" style={{ marginBottom: layout.mbTitle }}>
                  <PageHeader title={titulo.title} subtitle={titulo.subtitle} />
                </div>
                <div className="w-full" style={{ marginBottom: layout.mbTabs }}>
                  <TabsNav
                    options={tabs.options}
                    value={tabs.selected}
                    onValueChange={(v) => moduleUiActions.setTabs({ selected: v })}
                  />
                </div>
                {/* Placeholder de conteúdo — sem tabelas por enquanto */}
                <div className="w-full p-4 text-sm text-gray-600">
                  Selecione uma aba. O conteúdo será definido depois.
                </div>
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

