#!/usr/bin/env node

import { buildWidget } from './build-widget-shared.mjs'

await buildWidget({
  productDir: 'src/products/mcp-apps',
  label: 'MCP Apps',
})
