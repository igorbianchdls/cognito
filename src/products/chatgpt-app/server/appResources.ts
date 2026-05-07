export const DASHBOARD_WIDGET_RESOURCE_URI = 'ui://widget/dashboard.html'
export const DASHBOARD_WIDGET_MIME_TYPE = 'text/html;profile=mcp-app'

export type ChatGptAppResourceContent = {
  uri: string
  mimeType: string
  text: string
}

export type ChatGptAppResource = {
  name: string
  title: string
  description: string
  uri: string
  mimeType: string
  contents: ChatGptAppResourceContent[]
}

export function getDashboardWidgetHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cognito Dashboards</title>
    <style>
      :root {
        color-scheme: light;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f7f3ec;
        color: #231f1a;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(45, 96, 72, 0.16), transparent 34rem),
          linear-gradient(135deg, #fffaf1 0%, #efe6d5 100%);
      }

      main {
        display: grid;
        gap: 0.75rem;
        padding: 1rem;
      }

      .shell {
        border: 1px solid rgba(35, 31, 26, 0.12);
        border-radius: 1.25rem;
        background: rgba(255, 252, 246, 0.84);
        box-shadow: 0 18px 44px rgba(35, 31, 26, 0.1);
        padding: 1rem;
      }

      h1 {
        margin: 0 0 0.35rem;
        font-size: 1rem;
        letter-spacing: -0.02em;
      }

      p {
        margin: 0;
        color: rgba(35, 31, 26, 0.68);
        font-size: 0.875rem;
        line-height: 1.45;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="shell">
        <h1>Cognito Dashboards</h1>
        <p>The ChatGPT App widget resource is registered. The React renderer will be added in the UI build step.</p>
      </section>
    </main>
  </body>
</html>`
}

export const DASHBOARD_WIDGET_RESOURCE: ChatGptAppResource = {
  name: 'dashboard-widget',
  title: 'Cognito Dashboard Widget',
  description: 'Embedded UI for rendering Cognito dashboard lists and previews in ChatGPT.',
  uri: DASHBOARD_WIDGET_RESOURCE_URI,
  mimeType: DASHBOARD_WIDGET_MIME_TYPE,
  contents: [
    {
      uri: DASHBOARD_WIDGET_RESOURCE_URI,
      mimeType: DASHBOARD_WIDGET_MIME_TYPE,
      text: getDashboardWidgetHtml(),
    },
  ],
}

export function listCognitoChatGptAppResources() {
  return {
    resources: [
      {
        name: DASHBOARD_WIDGET_RESOURCE.name,
        title: DASHBOARD_WIDGET_RESOURCE.title,
        description: DASHBOARD_WIDGET_RESOURCE.description,
        uri: DASHBOARD_WIDGET_RESOURCE.uri,
        mimeType: DASHBOARD_WIDGET_RESOURCE.mimeType,
      },
    ],
  }
}

export function readCognitoChatGptAppResource(uri: string) {
  if (uri !== DASHBOARD_WIDGET_RESOURCE_URI) {
    return null
  }

  return {
    contents: DASHBOARD_WIDGET_RESOURCE.contents,
  }
}

