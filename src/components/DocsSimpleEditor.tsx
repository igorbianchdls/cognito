"use client"

import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Underline } from "@tiptap/extension-underline"

// --- UI Components ---
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// --- Icons ---
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Code2,
  List, 
  ListOrdered, 
  Quote, 
  Redo, 
  Undo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Image as ImageIcon,
  Minus
} from "lucide-react"

// --- Drag Context Menu ---
import { DragContextMenu } from "@/components/tiptap-ui/drag-context-menu"

// Initial content for the editor
const content = `
<h1>Editor de Documentos</h1>
<p>Este é um editor de texto avançado com Drag Context Menu. Você pode:</p>
<ul>
  <li>Arrastar blocos usando o ícone de grip</li>
  <li>Clicar no grip para abrir o menu contextual</li>
  <li>Transformar blocos, aplicar cores, duplicar e muito mais!</li>
</ul>
<p>Comece a escrever aqui...</p>
`

export function DocsSimpleEditor() {
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Superscript,
      Subscript,
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Typography,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-8',
      },
    },
  })

  if (!mounted || !editor) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-gray-500">Carregando editor...</div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col bg-white">
      <EditorContext.Provider value={{ editor }}>
        {/* Toolbar */}
        <div className="border-b bg-gray-50 p-3 flex gap-1 flex-wrap">
          {/* Headings */}
          <Select
            value={
              editor.isActive('heading', { level: 1 }) ? 'h1' :
              editor.isActive('heading', { level: 2 }) ? 'h2' :
              editor.isActive('heading', { level: 3 }) ? 'h3' :
              editor.isActive('paragraph') ? 'p' : 'p'
            }
            onValueChange={(value) => {
              if (value === 'p') {
                editor.chain().focus().setParagraph().run()
              } else {
                const level = parseInt(value.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6
                editor.chain().focus().toggleHeading({ level }).run()
              }
            }}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Texto</SelectItem>
              <SelectItem value="h1">H1</SelectItem>
              <SelectItem value="h2">H2</SelectItem>
              <SelectItem value="h3">H3</SelectItem>
            </SelectContent>
          </Select>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Text Formatting */}
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Sublinhado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Riscado"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('code') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Código"
          >
            <Code2 className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('highlight') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            title="Realçar"
          >
            <Highlighter className="h-4 w-4" />
          </Button>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Scripts */}
          <Button
            size="sm"
            variant={editor.isActive('superscript') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            title="Sobrescrito"
          >
            <SuperscriptIcon className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('subscript') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            title="Subscrito"
          >
            <SubscriptIcon className="h-4 w-4" />
          </Button>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Alignment */}
          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Alinhar à esquerda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Centralizar"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Alinhar à direita"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Justificar"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Lists & Blocks */}
          <Button
            size="sm"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista com marcadores"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Citação"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Media & Dividers */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const url = prompt('URL da imagem:')
              if (url) {
                editor.chain().focus().setImage({ src: url }).run()
              }
            }}
            title="Inserir imagem"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Linha horizontal"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Undo/Redo */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Desfazer"
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Refazer"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto">
          <EditorContent 
            editor={editor} 
            className="h-full"
          />
        </div>
        
        {/* Drag Context Menu */}
        <DragContextMenu editor={editor} withSlashCommandTrigger={true} />
      </EditorContext.Provider>
    </div>
  )
}