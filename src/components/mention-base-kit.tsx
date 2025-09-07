import { BaseMentionPlugin } from '@platejs/mention';

import { MentionElementStatic } from '@/components/mention-node-static';

export const BaseMentionKit = [
  BaseMentionPlugin.withComponent(MentionElementStatic),
];
