import type { DashboardCodeFile } from '@/products/dashboard/workspace/types'
import {
  DASHBOARD_TEMPLATE_DEFAULT_THEMES,
} from '@/products/dashboard/shared/templates/dashboardTemplateSupport'
import { DASHBOARD_REAL_WORKSPACE_FILES } from '@/products/dashboard/workspace/realWorkspaceFileSources'

export function buildDashboardWorkspaceFiles(themeName: string): DashboardCodeFile[] {
  const appFiles = DASHBOARD_REAL_WORKSPACE_FILES.map((file) => ({ ...file }))

  return [
    ...appFiles,
    {
      path: 'app/theme.json',
      name: 'theme.json',
      directory: 'app',
      extension: 'json',
      language: 'json',
      content: JSON.stringify(
        {
          theme: themeName,
          templateThemes: DASHBOARD_TEMPLATE_DEFAULT_THEMES,
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
      content: `# Dashboard\n\nArquivos principais:\n- \`app/dashboard-classico.tsx\` (\`${DASHBOARD_TEMPLATE_DEFAULT_THEMES.classic}\`)\n- \`app/dashboard-compras.tsx\` (\`${DASHBOARD_TEMPLATE_DEFAULT_THEMES.compras}\`)\n- \`app/dashboard-financeiro.tsx\` (\`${DASHBOARD_TEMPLATE_DEFAULT_THEMES.financeiro}\`)\n- \`app/dashboard-metaads.tsx\` (\`${DASHBOARD_TEMPLATE_DEFAULT_THEMES.metaads}\`)\n- \`app/dashboard-googleads.tsx\` (\`${DASHBOARD_TEMPLATE_DEFAULT_THEMES.googleads}\`)\n- \`app/dashboard-shopify.tsx\` (\`${DASHBOARD_TEMPLATE_DEFAULT_THEMES.shopify}\`)\n\nArquivos auxiliares:\n- \`app/chart-colors.ts\`\n- \`app/theme-tokens.ts\`\n\nTema global do workspace: \`${themeName}\`\nCada template ativo usa seu proprio tema padrao.`,
    },
  ]
}
