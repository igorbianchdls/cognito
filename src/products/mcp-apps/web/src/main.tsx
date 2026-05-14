import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/products/mcp-apps/web/src/App'
import { installCognitoWidgetRuntime } from '@/products/mcp-apps/web/src/bridge'

const rootElement = document.getElementById('root')

installCognitoWidgetRuntime()

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
