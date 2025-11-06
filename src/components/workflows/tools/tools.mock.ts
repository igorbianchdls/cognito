import { Database, Globe, Mail, Bot, Cloud, FileText, Image, Sparkles, Plug, Server, MessageSquare, FlaskConical } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ToolMeta = {
  id: string
  name: string
  description: string
  category: string
  icon: LucideIcon
}

export const TOOL_CATEGORIES = [
  'Todas',
  'Data',
  'HTTP',
  'Email',
  'RAG',
  'Databases',
  'Cloud',
  'Messaging',
  'External',
] as const

export const TOOLS_MOCK: ToolMeta[] = [
  { id: 'http', name: 'HTTP Request', description: 'Realize chamadas GET/POST para APIs externas.', category: 'HTTP', icon: Globe },
  { id: 'email', name: 'Email', description: 'Envie e-mails transacionais e notificações.', category: 'Email', icon: Mail },
  { id: 'rag', name: 'RAG Search', description: 'Busque contexto em coleções indexadas (RAG).', category: 'RAG', icon: Bot },
  { id: 'bq', name: 'BigQuery', description: 'Execute consultas SQL no BigQuery.', category: 'Databases', icon: Database },
  { id: 's3', name: 'S3 Storage', description: 'Grave e leia arquivos em buckets S3.', category: 'Cloud', icon: Cloud },
  { id: 'gcs', name: 'GCS Storage', description: 'Gerencie objetos no Google Cloud Storage.', category: 'Cloud', icon: Cloud },
  { id: 'pdf', name: 'PDF Extract', description: 'Extraia texto e metadados de PDFs.', category: 'External', icon: FileText },
  { id: 'img', name: 'Image Gen', description: 'Geração de imagens com modelos visuais.', category: 'External', icon: Image },
  { id: 'search', name: 'Web Search', description: 'Pesquise na web para obter informações atualizadas.', category: 'External', icon: Sparkles },
  { id: 'slack', name: 'Slack', description: 'Envie mensagens para canais do Slack.', category: 'Messaging', icon: MessageSquare },
  { id: 'queue', name: 'Message Queue', description: 'Envie eventos para filas/streaming.', category: 'Messaging', icon: Server },
  { id: 'zapier', name: 'Zapier', description: 'Conecte com milhares de integrações externas.', category: 'External', icon: Plug },
  { id: 'lab', name: 'Experimental', description: 'Ferramentas de laboratório e protótipos.', category: 'External', icon: FlaskConical },
]

