'use client'

import { useState, useEffect } from 'react'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TiptapEditor from '@/components/docs/TiptapEditor'
import DocsList from '@/components/docs/DocsList'
import { 
  Doc, 
  DocFormData, 
  getDocsFromStorage, 
  saveDocsToStorage, 
  createDoc, 
  updateDoc, 
  deleteDoc 
} from '@/lib/docs'
import { Save } from 'lucide-react'

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<DocFormData>({ title: '', content: '' })

  // Load docs from localStorage on mount
  useEffect(() => {
    const storedDocs = getDocsFromStorage()
    setDocs(storedDocs)
  }, [])

  // Save to localStorage whenever docs change
  useEffect(() => {
    saveDocsToStorage(docs)
  }, [docs])

  const handleCreateDoc = () => {
    const newDoc = createDoc({ title: 'Novo Documento', content: '<p>Comece a escrever aqui...</p>' })
    const updatedDocs = [newDoc, ...docs]
    setDocs(updatedDocs)
    setSelectedDoc(newDoc)
    setFormData({ title: newDoc.title, content: newDoc.content })
    setIsEditing(true)
  }

  const handleSelectDoc = (doc: Doc) => {
    setSelectedDoc(doc)
    setFormData({ title: doc.title, content: doc.content })
    setIsEditing(true)
  }

  const handleDeleteDoc = (id: string) => {
    const updatedDocs = deleteDoc(docs, id)
    setDocs(updatedDocs)
    
    if (selectedDoc?.id === id) {
      setSelectedDoc(null)
      setFormData({ title: '', content: '' })
      setIsEditing(false)
    }
  }

  const handleSaveDoc = () => {
    if (!selectedDoc) return

    const updatedDocs = updateDoc(docs, selectedDoc.id, formData)
    setDocs(updatedDocs)
    
    // Update selected doc
    const updatedSelectedDoc = updatedDocs.find(doc => doc.id === selectedDoc.id)
    if (updatedSelectedDoc) {
      setSelectedDoc(updatedSelectedDoc)
    }
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({ ...prev, title }))
  }

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }))
  }

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
                      Documentos
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </header>

        <div className="flex flex-1 bg-white">
          {/* Docs Sidebar */}
          <DocsList
            docs={docs}
            selectedDocId={selectedDoc?.id}
            onSelectDoc={handleSelectDoc}
            onDeleteDoc={handleDeleteDoc}
            onCreateDoc={handleCreateDoc}
          />

          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            {isEditing && selectedDoc ? (
              <>
                {/* Document Header */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-center justify-between gap-4">
                    <Input
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="text-xl font-semibold bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Título do documento..."
                    />
                    <Button onClick={handleSaveDoc} className="shrink-0">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 p-6">
                  <TiptapEditor
                    content={formData.content}
                    onChange={handleContentChange}
                    placeholder="Comece a escrever seu documento..."
                  />
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="text-gray-300 mb-4">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum documento selecionado
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Selecione um documento existente ou crie um novo para começar a editar.
                  </p>
                  <Button onClick={handleCreateDoc}>
                    Criar Novo Documento
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}