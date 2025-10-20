'use client';

import { createTSlatePlugin } from 'platejs';
import { EmbedElement } from '@/components/ui/embed-node';

export const EmbedPlugin = createTSlatePlugin({
  key: 'embed',
  node: { 
    isElement: true, 
    isVoid: true 
  },
}).withComponent(EmbedElement);