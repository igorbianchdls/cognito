export type DashboardCodeFile = {
  path: string
  name: string
  directory: string
  extension: string
  language: string
  content: string
}

export function buildDashboardCodeFiles(dsl: string, themeName: string): DashboardCodeFile[] {
  return [
    {
      path: 'app/dashboard.dsl',
      name: 'dashboard.dsl',
      directory: 'app',
      extension: 'dsl',
      language: 'dsl',
      content: dsl,
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
          entrypoint: 'app/dashboard.dsl',
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
      content: `# Dashboard\n\nArquivo principal: \`app/dashboard.dsl\`\nTema ativo: \`${themeName}\``,
    },
  ]
}
