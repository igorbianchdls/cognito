import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/products/plugin/web/src/App'
import { installCognitoWidgetRuntime } from '@/products/plugin/web/src/bridge'

const rootElement = document.getElementById('root')

installCognitoWidgetRuntime()

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
