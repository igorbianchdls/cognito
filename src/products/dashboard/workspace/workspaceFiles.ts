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
          entrypoint: 'app/dashboard-classico.tsx',
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
      content: `# Dashboard\n\nArquivos principais:\n- \`app/dashboard-classico.tsx\`\n- \`app/dashboard-compras.tsx\`\n- \`app/dashboard-financeiro.tsx\`\n- \`app/dashboard-metaads.tsx\`\n- \`app/dashboard-googleads.tsx\`\n- \`app/dashboard-shopify.tsx\`\n\nTema ativo: \`${themeName}\``,
    },
  ]
}
