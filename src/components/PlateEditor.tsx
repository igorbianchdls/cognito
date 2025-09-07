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
import {
  Plate,
  usePlateEditor,
} from 'platejs/react';
import { createTSlatePlugin, type PluginConfig } from 'platejs';
import { 
  type TriggerComboboxPluginOptions, 
  withTriggerCombobox 
} from '@platejs/combobox';

import { BlockquoteElement } from '@/components/ui/blockquote-node';
import { CodeElement } from '@/components/ui/code-node';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { FloatingToolbar } from '@/components/ui/floating-toolbar';
import { H1Element, H2Element, H3Element } from '@/components/ui/heading-node';
import { HighlightElement } from '@/components/ui/highlight-node';
import { HrElement } from '@/components/ui/hr-node';
import { KbdElement } from '@/components/ui/kbd-node';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button';
import { ToolbarButton } from '@/components/ui/toolbar';
import { SlashKit } from '@/components/slash-kit';
import { MentionKit } from '@/components/mention-kit';
import { DndKit } from '@/components/dnd-kit';
import { ListKit } from '@/components/editor/plugins/list-kit';

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
      TagPlugin,
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      CodePlugin.withComponent(CodeElement),
      HighlightPlugin.withComponent(HighlightElement),
      KbdPlugin.withComponent(KbdElement),
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
      <FixedToolbar className="flex justify-start gap-1 rounded-t-lg">
        <ToolbarButton onClick={() => editor.tf.h1.toggle()}>H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.h2.toggle()}>H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.h3.toggle()}>H3</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.blockquote.toggle()}>Quote</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.hr.insert()}>HR</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.list.toggle({ type: 'ul' })}>• List</ToolbarButton>
        <ToolbarButton onClick={() => editor.tf.list.toggle({ type: 'ol' })}>1. List</ToolbarButton>
        <MarkToolbarButton nodeType="bold" tooltip="Bold (⌘+B)">B</MarkToolbarButton>
        <MarkToolbarButton nodeType="italic" tooltip="Italic (⌘+I)">I</MarkToolbarButton>
        <MarkToolbarButton nodeType="underline" tooltip="Underline (⌘+U)">U</MarkToolbarButton>
        <MarkToolbarButton nodeType="code" tooltip="Code (⌘+E)">Code</MarkToolbarButton>
        <MarkToolbarButton nodeType="highlight" tooltip="Highlight">Highlight</MarkToolbarButton>
        <MarkToolbarButton nodeType="kbd" tooltip="Keyboard">Kbd</MarkToolbarButton>
        <div className="flex-1" />
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
          <ToolbarButton onClick={() => editor.tf.list.toggle({ type: 'ul' })}>• List</ToolbarButton>
          <ToolbarButton onClick={() => editor.tf.list.toggle({ type: 'ol' })}>1. List</ToolbarButton>
        </FloatingToolbar>
      </EditorContainer>
    </Plate>
  );
}