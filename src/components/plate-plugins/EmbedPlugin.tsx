'use client';

import { createTSlatePlugin, type PluginConfig } from 'platejs';
import { EmbedElement } from '@/components/ui/embed-node';

export interface EmbedConfig extends PluginConfig {
  // Plugin configuration options can be added here
}

export const EmbedPlugin = createTSlatePlugin<EmbedConfig>({
  key: 'embed',
  node: { 
    isElement: true, 
    isVoid: true 
  },
  options: {
    // Default options
  },
}).withComponent(EmbedElement);