import type { DashboardCodeFile } from '@/products/dashboard/workspace/types'

function replaceDashboardCopy(dsl: string, title: string, subtitle: string) {
  return dsl
    .replace(/<Title text="Dashboard de Vendas" \/>/, `<Title text="${title}" />`)
    .replace(/<Subtitle text="Principais indicadores e cortes" \/>/, `<Subtitle text="${subtitle}" />`)
}

export function buildDashboardWorkspaceFiles(dsl: string, themeName: string): DashboardCodeFile[] {
  return [
    {
      path: 'app/dashboard-vendas.dsl',
      name: 'dashboard-vendas.dsl',
      directory: 'app',
      extension: 'dsl',
      language: 'dsl',
      content: dsl,
    },
    {
      path: 'app/dashboard-executivo.dsl',
      name: 'dashboard-executivo.dsl',
      directory: 'app',
      extension: 'dsl',
      language: 'dsl',
      content: replaceDashboardCopy(dsl, 'Dashboard Executivo', 'Visao geral dos principais resultados'),
    },
    {
      path: 'app/dashboard-operacoes.dsl',
      name: 'dashboard-operacoes.dsl',
      directory: 'app',
      extension: 'dsl',
      language: 'dsl',
      content: replaceDashboardCopy(dsl, 'Dashboard de Operacoes', 'Acompanhamento operacional e produtividade'),
    },
    {
      path: 'app/theme.json',
      name: 'theme.json',
      directory: 'app',
      extension: 'json',
      language: 'json',
      content: JSON.stringify(
        {
          theme: themeName,
          renderer: 'bi-json-render',
          entrypoint: 'app/dashboard-vendas.dsl',
        },
        null,
        2,
      ),
    },
    {
      path: 'app/README.md',
      name: 'README.md',
      directory: 'app',
      extension: 'md',
      language: 'markdown',
      content: `# Dashboard\n\nArquivos principais:\n- \`app/dashboard-vendas.dsl\`\n- \`app/dashboard-executivo.dsl\`\n- \`app/dashboard-operacoes.dsl\`\n\nTema ativo: \`${themeName}\``,
    },
  ]
}
