'use client';

import { Plate, usePlateEditor } from 'platejs/react';

import { Editor, EditorContainer } from '@/components/ui/editor';

export default function App() {
  const editor = usePlateEditor(); // Initializes the editor instance

  return (
    <Plate editor={editor}>      {/* Provides editor context */}
      <EditorContainer>         {/* Styles the editor area */}
        <Editor placeholder="Type your amazing content here..." />
      </EditorContainer>
    </Plate>
  );
}