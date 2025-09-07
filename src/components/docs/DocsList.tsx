'use client'

import { Doc } from '@/lib/docs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/docs'
import { FileText, Trash2, Edit } from 'lucide-react'

interface DocsListProps {
  docs: Doc[]
  selectedDocId?: string
  onSelectDoc: (doc: Doc) => void
  onDeleteDoc: (id: string) => void
  onCreateDoc: () => void
}

export default function DocsList({ 
  docs, 
  selectedDocId, 
  onSelectDoc, 
  onDeleteDoc, 
  onCreateDoc 
}: DocsListProps) {
  return (
    <div className="w-80 border-r bg-gray-50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Documentos</h2>
        <Button onClick={onCreateDoc} size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Novo Doc
        </Button>
      </div>

      {/* Docs List */}
      <div className="space-y-2">
        {docs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">Nenhum documento criado</p>
            <p className="text-xs">Clique em "Novo Doc" para começar</p>
          </div>
        ) : (
          docs.map((doc) => (
            <Card 
              key={doc.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedDocId === doc.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => onSelectDoc(doc)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground truncate">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {formatDate(doc.updatedAt)}
                      </Badge>
                    </div>
                    {/* Preview of content */}
                    <div 
                      className="text-xs text-muted-foreground mt-2 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: doc.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
                      }}
                    />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteDoc(doc.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}