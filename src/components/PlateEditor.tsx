'use client';

import * as React from 'react';
import type { Value } from 'platejs';

import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  HighlightPlugin,
  HorizontalRulePlugin,
  ItalicPlugin,
  KbdPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { TextAlignPlugin } from '@platejs/basic-styles/react';
import { List, ListOrdered, Square, Type, Palette, Bot, Link } from 'lucide-react';
import {
  Plate,
  usePlateEditor,
} from 'platejs/react';
import { createTSlatePlugin, type PluginConfig, KEYS } from 'platejs';
import { 
  type TriggerComboboxPluginOptions, 
  withTriggerCombobox 
} from '@platejs/combobox';

import { BlockquoteElement } from '@/components/ui/blockquote-node';
import { CodeLeaf } from '@/components/ui/code-node';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { FloatingToolbar } from '@/components/ui/floating-toolbar';
import { H1Element, H2Element, H3Element } from '@/components/ui/heading-node';
import { HighlightLeaf } from '@/components/ui/highlight-node';
import { HrElement } from '@/components/ui/hr-node';
import { KbdLeaf } from '@/components/ui/kbd-node';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button';
import { ToolbarButton } from '@/components/ui/toolbar';
import { FontSizeToolbarButton } from '@/components/ui/font-size-toolbar-button';
import { FontColorToolbarButton } from '@/components/ui/font-color-toolbar-button';
import { AIToolbarButton } from '@/components/ui/ai-toolbar-button';
import { AlignToolbarButton } from '@/components/ui/align-toolbar-button';
import { SlashKit } from '@/components/slash-kit';
import { MentionKit } from '@/components/mention-kit';
import { DndKit } from '@/components/dnd-kit';
import { ListKit } from '@/components/editor/plugins/list-kit';
import { FontKit } from '@/components/editor/plugins/font-kit';
import { EmbedPlugin } from '@/components/plate-plugins/EmbedPlugin';

const initialValue: Value = [
  {
    children: [{ text: 'Title' }],
    type: 'h3',
  },
  {
    children: [{ text: 'This is a quote.' }],
    type: 'blockquote',
  },
  {
    children: [
      { text: 'With some ' },
      { bold: true, text: 'bold' },
      { text: ' text for emphasis!' },
    ],
    type: 'p',
  },
];

type TagConfig = PluginConfig<'tag', TriggerComboboxPluginOptions>;

const TagPlugin = createTSlatePlugin<TagConfig>({
  key: 'tag',
  node: { isElement: true, isInline: true, isVoid: true },
  options: {
    trigger: '#',
    triggerPreviousCharPattern: /^\s?$/,
    createComboboxInput: () => ({
      children: [{ text: '' }],
      type: 'tag_input',
    }),
  },
}).overrideEditor(withTriggerCombobox);

export default function App() {
  const editor = usePlateEditor({
    plugins: [
      BlockSelectionPlugin,
      ...SlashKit,
      ...MentionKit,
      ...DndKit,
      ...ListKit,
      ...FontKit,
      TextAlignPlugin,
      TagPlugin,
      EmbedPlugin,
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      CodePlugin.withComponent(CodeLeaf),
      HighlightPlugin.withComponent(HighlightLeaf),
      KbdPlugin.withComponent(KbdLeaf),
      HorizontalRulePlugin.withComponent(HrElement),
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
    ],
    value: () => {
      if (typeof window !== 'undefined') {
        const savedValue = localStorage.getItem('installation-react-demo');
        return savedValue ? JSON.parse(savedValue) : initialValue;
      }
      return initialValue;
    },
  });

  return (
    <Plate
      editor={editor}
      onChange={({ value }) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('installation-react-demo', JSON.stringify(value));
        }
      }}
    >
      <FixedToolbar className="flex justify-center gap-1 rounded-t-lg">
        <ToolbarButton onClick={() => editor.tf.h1.toggle()}>H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.h2.toggle()}>H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.h3.toggle()}>H3</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.blockquote.toggle()}>Quote</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.hr.toggle()}>HR</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.toggleBlock(KEYS.ul)}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.toggleBlock(KEYS.ol)}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.toggleBlock(KEYS.listTodo)}>
          <Square className="h-4 w-4" />
        </ToolbarButton>
        <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">B</MarkToolbarButton>
        <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">I</MarkToolbarButton>
        <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">U</MarkToolbarButton>
        <MarkToolbarButton nodeType="code" tooltip="Code (⌘+E)">Code</MarkToolbarButton>
        <MarkToolbarButton nodeType="highlight" tooltip="Highlight">Highlight</MarkToolbarButton>
        <MarkToolbarButton nodeType="kbd" tooltip="Keyboard">Kbd</MarkToolbarButton>
        <FontSizeToolbarButton />
        <FontColorToolbarButton nodeType="color" tooltip="Text Color">
          <Type className="h-4 w-4" />
        </FontColorToolbarButton>
        <FontColorToolbarButton nodeType="backgroundColor" tooltip="Background Color">
          <Palette className="h-4 w-4" />
        </FontColorToolbarButton>
        <AIToolbarButton tooltip="Ask AI">
          <Bot className="h-4 w-4" />
        </AIToolbarButton>
        <AlignToolbarButton />
        <ToolbarButton
          className="px-2"
          onClick={() => {
            const embedUrl = prompt('Cole o link embed do widget:')
            if (embedUrl && embedUrl.includes('/embed/widget/')) {
              editor.tf.insertNodes({
                type: 'embed',
                embedUrl: embedUrl,
                width: 600,
                height: 400,
                children: [{ text: '' }]
              })
            } else if (embedUrl) {
              alert('URL inválida. Deve conter /embed/widget/')
            }
          }}
          title="Insert Embed Widget"
        >
          <Link className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          className="px-2"
          onClick={() => editor.tf.setValue(initialValue)}
        >
          Reset
        </ToolbarButton>
      </FixedToolbar>
      <EditorContainer>
        <Editor placeholder="Type your amazing content here..." />
        
        <FloatingToolbar>
          <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">B</MarkToolbarButton>
          <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">I</MarkToolbarButton>
          <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">U</MarkToolbarButton>
          <MarkToolbarButton nodeType="code" tooltip="Code (⌘+E)">Code</MarkToolbarButton>
          <MarkToolbarButton nodeType="highlight" tooltip="Highlight">Highlight</MarkToolbarButton>
          <MarkToolbarButton nodeType="kbd" tooltip="Keyboard">Kbd</MarkToolbarButton>
          <ToolbarButton onClick={() => editor.tf.h1.toggle()}>H1</ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.h2.toggle()}>H2</ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.h3.toggle()}>H3</ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.blockquote.toggle()}>Quote</ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.toggleBlock(KEYS.ul)}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.toggleBlock(KEYS.ol)}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.toggleBlock(KEYS.listTodo)}>
            <Square className="h-4 w-4" />
          </ToolbarButton>
          <FontSizeToolbarButton />
          <FontColorToolbarButton nodeType="color" tooltip="Text Color">
            <Type className="h-4 w-4" />
          </FontColorToolbarButton>
          <FontColorToolbarButton nodeType="backgroundColor" tooltip="Background Color">
            <Palette className="h-4 w-4" />
          </FontColorToolbarButton>
          <AIToolbarButton tooltip="Ask AI">
            <Bot className="h-4 w-4" />
          </AIToolbarButton>
          <AlignToolbarButton />
        </FloatingToolbar>
      </EditorContainer>
    </Plate>
  );
}