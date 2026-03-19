import type { DashboardCodeFile } from '@/products/dashboard/workspace/types'
import { buildDashboardTemplateVariants } from '@/products/dashboard/shared/templates/dashboardTemplate'

export function buildDashboardWorkspaceFiles(themeName: string): DashboardCodeFile[] {
  const dashboardFiles = buildDashboardTemplateVariants(themeName).map((file) => ({
    path: file.path,
    name: file.name,
    directory: 'app',
    extension: 'tsx',
    language: 'typescript',
    content: file.content,
    tree: file.tree,
  }))

  return [
    ...dashboardFiles,
    {
      path: 'app/theme.json',
      name: 'theme.json',
      directory: 'app',
      extension: 'json',
      language: 'json',
      content: JSON.stringify(
        {
          theme: themeName,
          renderer: 'dashboard-jsx-render',
          entrypoint: 'app/dashboard-vendas.tsx',
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
      content: `# Dashboard\n\nArquivos principais:\n- \`app/dashboard-vendas.tsx\`\n- \`app/dashboard-executivo.tsx\`\n- \`app/dashboard-operacoes.tsx\`\n\nTema ativo: \`${themeName}\``,
    },
  ]
}
