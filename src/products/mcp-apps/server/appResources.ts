import { readFileSync } from 'node:fs'
import path from 'node:path'

export const DASHBOARD_WIDGET_RESOURCE_URI = 'ui://widget/dashboard-v2.html'
export const DASHBOARD_WIDGET_LEGACY_RESOURCE_URI = 'ui://widget/dashboard.html'
export const DASHBOARD_WIDGET_MIME_TYPE = 'text/html;profile=mcp-app'

export type McpAppResourceContent = {
  uri: string
  mimeType: string
  text: string
  _meta?: Record<string, unknown>
}

export type McpAppResource = {
  name: string
  title: string
  description: string
  uri: string
  mimeType: string
  contents: McpAppResourceContent[]
}

function getConfiguredAppOrigin() {
  const explicitBaseUrl = String(
    process.env.COGNITO_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '',
  ).trim()

  if (explicitBaseUrl) {
    try {
      return new URL(explicitBaseUrl).origin
    } catch {
      return 'https://cognito-seven.vercel.app'
    }
  }

  const vercelUrl = String(process.env.VERCEL_URL || '').trim()
  return vercelUrl ? `https://${vercelUrl.replace(/\/+$/, '')}` : 'https://cognito-seven.vercel.app'
}

function getWidgetAllowedDomains() {
  return Array.from(new Set([getConfiguredAppOrigin(), 'https://cognito-seven.vercel.app']))
}

function readBuiltWidgetHtml() {
  try {
    return readFileSync(
      path.join(process.cwd(), 'src/products/mcp-apps/web/dist/widget.html'),
      'utf8',
    )
  } catch {
    return null
  }
}

export function getDashboardWidgetHtml() {
  const builtWidgetHtml = readBuiltWidgetHtml()
  if (builtWidgetHtml) return builtWidgetHtml

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
        <p>The MCP Apps widget resource is registered. The renderer will be added in the UI build step.</p>
      </section>
    </main>
  </body>
</html>`
}

function getDashboardWidgetResourceContentMeta() {
  const domains = getWidgetAllowedDomains()

  return {
    ui: {
      description: 'Interface visual MCP Apps para listar dashboards Cognito e mostrar previews dentro do host.',
      prefersBorder: true,
      csp: {
        connectDomains: domains,
        resourceDomains: domains,
        redirectDomains: domains,
      },
    },
  } as const
}

export const DASHBOARD_WIDGET_RESOURCE: McpAppResource = {
  name: 'dashboard-widget',
  title: 'Cognito Dashboard Widget',
  description: 'Embedded UI for rendering Cognito dashboard lists and previews in MCP Apps hosts.',
  uri: DASHBOARD_WIDGET_RESOURCE_URI,
  mimeType: DASHBOARD_WIDGET_MIME_TYPE,
  contents: [
    {
      uri: DASHBOARD_WIDGET_RESOURCE_URI,
      mimeType: DASHBOARD_WIDGET_MIME_TYPE,
      text: getDashboardWidgetHtml(),
      _meta: getDashboardWidgetResourceContentMeta(),
    },
  ],
}

export const DASHBOARD_WIDGET_LEGACY_RESOURCE: McpAppResource = {
  ...DASHBOARD_WIDGET_RESOURCE,
  uri: DASHBOARD_WIDGET_LEGACY_RESOURCE_URI,
  contents: [
    {
      uri: DASHBOARD_WIDGET_LEGACY_RESOURCE_URI,
      mimeType: DASHBOARD_WIDGET_MIME_TYPE,
      text: getDashboardWidgetHtml(),
      _meta: getDashboardWidgetResourceContentMeta(),
    },
  ],
}

function toResourceListItem(resource: McpAppResource) {
  return {
    name: resource.name,
    title: resource.title,
    description: resource.description,
    uri: resource.uri,
    mimeType: resource.mimeType,
  }
}

export function listCognitoMcpAppResources() {
  return {
    resources: [
      toResourceListItem(DASHBOARD_WIDGET_RESOURCE),
      toResourceListItem(DASHBOARD_WIDGET_LEGACY_RESOURCE),
    ],
  }
}

export function readCognitoMcpAppResource(uri: string) {
  if (uri !== DASHBOARD_WIDGET_RESOURCE_URI && uri !== DASHBOARD_WIDGET_LEGACY_RESOURCE_URI) {
    return null
  }

  return {
    contents: [
      {
        uri,
        mimeType: DASHBOARD_WIDGET_MIME_TYPE,
        text: getDashboardWidgetHtml(),
        _meta: getDashboardWidgetResourceContentMeta(),
      },
    ],
  }
}
