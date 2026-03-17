export type DashboardCodeFile = {
  path: string
  name: string
  language: string
  content: string
}

export function buildDashboardCodeFiles(dsl: string, themeName: string): DashboardCodeFile[] {
  return [
    {
      path: 'dashboard.dsl',
      name: 'dashboard.dsl',
      language: 'dsl',
      content: dsl,
    },
    {
      path: 'theme.json',
      name: 'theme.json',
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
      language: 'markdown',
      content: `# Dashboard\n\nArquivo principal: \`dashboard.dsl\`\nTema ativo: \`${themeName}\``,
    },
  ]
}
