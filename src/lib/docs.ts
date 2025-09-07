export interface Doc {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface DocFormData {
  title: string
  content: string
}

// Utility functions for local storage
export const DOCS_STORAGE_KEY = 'cognito_docs'

export function getDocsFromStorage(): Doc[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(DOCS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading docs from storage:', error)
    return []
  }
}

export function saveDocsToStorage(docs: Doc[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(docs))
  } catch (error) {
    console.error('Error saving docs to storage:', error)
  }
}

export function createDoc(data: DocFormData): Doc {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: data.title || 'Documento sem título',
    content: data.content,
    createdAt: now,
    updatedAt: now,
  }
}

export function updateDoc(docs: Doc[], id: string, data: Partial<DocFormData>): Doc[] {
  return docs.map(doc => {
    if (doc.id === id) {
      return {
        ...doc,
        ...data,
        updatedAt: new Date().toISOString()
      }
    }
    return doc
  })
}

export function deleteDoc(docs: Doc[], id: string): Doc[] {
  return docs.filter(doc => doc.id !== id)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}