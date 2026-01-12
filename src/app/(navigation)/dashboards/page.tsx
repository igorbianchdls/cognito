"use client";

import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import NexusShell from "@/components/navigation/nexus/NexusShell";
import PageHeader from "@/components/modulos/PageHeader";
import TabsNav from "@/components/modulos/TabsNav";
import { $titulo, $tabs, $layout, moduleUiActions } from "@/stores/modulos/moduleUiStore";
import { Layout, Users, Globe2, LayoutGrid } from "lucide-react";
import DashboardGridView from "@/components/navigation/dashboards/DashboardGridView";

const fontVar = (name?: string) => {
  if (!name) return undefined;
  if (name === 'Inter') return 'var(--font-inter)';
  if (name === 'Geist') return 'var(--font-geist-sans)';
  return name;
};

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
        { value: "catalogo", label: "Catálogo", icon: <LayoutGrid className="text-indigo-600" /> },
      ],
      selected: "catalogo",
    });
    moduleUiActions.setLayout({ contentBg: "rgb(253, 253, 253)", contentTopGap: 8, mbTitle: 16, mbTabs: 8 });
  }, []);

  return (
    <NexusShell outerBg={layout.contentBg}>
      <div className="w-full" style={{ marginBottom: layout.mbTitle }}>
                  <PageHeader
                    title={titulo.title}
                    subtitle={titulo.subtitle}
                    titleFontFamily={fontVar(titulo.titleFontFamily)}
                    titleFontSize={titulo.titleFontSize}
                    titleFontWeight={titulo.titleFontWeight}
                    titleColor={titulo.titleColor}
                    titleLetterSpacing={titulo.titleLetterSpacing}
                    subtitleFontFamily={fontVar(titulo.subtitleFontFamily)}
                    subtitleLetterSpacing={titulo.subtitleLetterSpacing}
                  />
      </div>
      <div className="w-full" style={{ marginBottom: 0 }}>
                  <TabsNav
                    options={tabs.options}
                    value={tabs.selected}
                    onValueChange={(v) => moduleUiActions.setTabs({ selected: v })}
                    fontFamily={fontVar(tabs.fontFamily)}
                    fontSize={tabs.fontSize}
                    fontWeight={tabs.fontWeight}
                    color={tabs.color}
                    letterSpacing={tabs.letterSpacing}
                    iconSize={tabs.iconSize}
                    labelOffsetY={tabs.labelOffsetY}
                    startOffset={tabs.leftOffset}
                    activeColor={tabs.activeColor}
                    activeFontWeight={tabs.activeFontWeight}
                    activeBorderColor={tabs.activeBorderColor}
                    className="px-0 md:px-0"
                  />
      </div>
      {/* Conteúdo principal abaixo das tabs */}
      <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
        <div className="px-4 md:px-6">
          <DashboardGridView />
        </div>
      </div>
    </NexusShell>
  );
}
