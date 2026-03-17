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
      path: 'dashboard.dsl',
      name: 'dashboard.dsl',
      directory: '/',
      extension: 'dsl',
      language: 'dsl',
      content: dsl,
    },
    {
      path: 'theme.json',
      name: 'theme.json',
      directory: '/',
      extension: 'json',
      language: 'json',
      content: JSON.stringify(
        {
          theme: themeName,
          renderer: 'bi-json-render',
          entrypoint: 'dashboard.dsl',
        },
        null,
        2,
      ),
    },
    {
      path: 'README.md',
      name: 'README.md',
      directory: '/',
      extension: 'md',
      language: 'markdown',
      content: `# Dashboard\n\nArquivo principal: \`dashboard.dsl\`\nTema ativo: \`${themeName}\``,
    },
  ]
}
