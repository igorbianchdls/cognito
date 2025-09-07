'use client'

import { useEffect, useState } from 'react'
import { Editor } from '@tiptap/react'
import { 
  MoreHorizontal,
  Copy,
  Trash2,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"

interface DragContextMenuProps {
  editor: Editor | null
}

export function DragContextMenu({ editor }: DragContextMenuProps) {
  const [showHandle, setShowHandle] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      const { selection } = editor.state
      if (selection.empty) return

      // Get the position of the selection
      const { from } = selection
      const start = editor.view.coordsAtPos(from)
      
      setPosition({
        top: start.top,
        left: start.left - 40, // Position to the left of content
      })
      setShowHandle(true)
    }

    const handleClick = () => {
      setShowHandle(false)
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    document.addEventListener('click', handleClick)

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
      document.removeEventListener('click', handleClick)
    }
  }, [editor])

  if (!editor || !showHandle) return null

  const transformTo = (type: string, attrs?: { level: number }) => {
    const { from, to } = editor.state.selection
    
    switch (type) {
      case 'paragraph':
        editor.chain().focus().setParagraph().run()
        break
      case 'heading':
        editor.chain().focus().setHeading(attrs).run()
        break
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run()
        break
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run()
        break
    }
    setShowHandle(false)
  }

  const copyBlock = () => {
    const { from, to } = editor.state.selection
    const text = editor.state.doc.textBetween(from, to, ' ')
    navigator.clipboard.writeText(text)
    setShowHandle(false)
  }

  const deleteBlock = () => {
    const { from, to } = editor.state.selection
    editor.chain().focus().deleteRange({ from, to }).run()
    setShowHandle(false)
  }

  return (
    <div
      className="fixed z-50"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-200 rounded-sm drag-handle"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Type className="h-4 w-4 mr-2" />
              Transformar em
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => transformTo('paragraph')}>
                <Type className="h-4 w-4 mr-2" />
                Parágrafo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => transformTo('heading', { level: 1 })}>
                <Heading1 className="h-4 w-4 mr-2" />
                Título 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => transformTo('heading', { level: 2 })}>
                <Heading2 className="h-4 w-4 mr-2" />
                Título 2
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => transformTo('heading', { level: 3 })}>
                <Heading3 className="h-4 w-4 mr-2" />
                Título 3
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => transformTo('bulletList')}>
                <List className="h-4 w-4 mr-2" />
                Lista com marcadores
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => transformTo('orderedList')}>
                <ListOrdered className="h-4 w-4 mr-2" />
                Lista numerada
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => transformTo('blockquote')}>
                <Quote className="h-4 w-4 mr-2" />
                Citação
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={copyBlock}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={deleteBlock} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}