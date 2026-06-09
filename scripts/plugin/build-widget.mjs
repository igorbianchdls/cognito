#!/usr/bin/env node

import { buildWidget } from './build-widget-shared.mjs'

await buildWidget({
  productDir: 'src/products/plugin',
  label: 'Plugin',
})
