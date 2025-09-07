'use client';

import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { EditorContent, EditorContext, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button'

import '@/components/tiptap-node/paragraph-node/paragraph-node.scss'

function MyEditor() {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: `
        <blockquote>
            <p>"The best way to predict the future is to invent it."</p><p>— Alan Kay</p>
        </blockquote>
        `,
  })

  return (
    <EditorContext.Provider value={{ editor }}>
      <BlockquoteButton
        editor={editor}
        text="Quote"
        hideWhenUnavailable={true}
        showShortcut={true}
        onToggled={() => console.log('Blockquote toggled!')}
      />

      <EditorContent editor={editor} role="presentation" />
    </EditorContext.Provider>
  )
}

export default function NotesPage() {
  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarShadcn />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border bg-white">
          <div className="flex items-center justify-between w-full px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sidebar-foreground">
                      Notas
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </header>

        <div className="flex flex-1 bg-white">
          <div className="flex-1 p-6">
            <MyEditor />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}