#!/usr/bin/env node

import { buildWidget } from '../mcp-apps/build-widget-shared.mjs'

await buildWidget({
  productDir: 'src/products/chatgpt-app',
  label: 'ChatGPT App',
})
