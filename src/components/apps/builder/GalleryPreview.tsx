'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, Images, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { BigQueryField } from './TablesExplorer'

export interface GalleryData {
  image_url: string
  title?: string
  description?: string
  [key: string]: string | number | boolean | null | undefined
}

interface GalleryPreviewProps {
  imageUrl: BigQueryField[]
  title?: BigQueryField[]
  description?: BigQueryField[]
  filters: BigQueryField[]
  selectedTable: string | null
  onDataReady?: (data: GalleryData[], query: string) => void
}

export default function GalleryPreview({
  imageUrl,
  title,
  description,
  filters,
  selectedTable,
  onDataReady
}: GalleryPreviewProps) {
  const [galleryData, setGalleryData] = useState<GalleryData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string>('')

  // Generate SQL query for Gallery data
  const generateQuery = () => {
    if (!selectedTable || imageUrl.length === 0) {
      return ''
    }

    // Build SELECT clause
    const selectColumns = [imageUrl[0].name + ' as image_url']
    
    if (title && title.length > 0) {
      selectColumns.push(title[0].name + ' as title')
    }
    
    if (description && description.length > 0) {
      selectColumns.push(description[0].name + ' as description')
    }

    // Build WHERE clause for filters
    let whereClause = ''
    if (filters.length > 0) {
      const filterConditions = filters.map(filter => {
        return `${filter.name} IS NOT NULL`
      }).join(' AND ')
      
      if (filterConditions) {
        whereClause = `WHERE ${filterConditions} AND ${imageUrl[0].name} IS NOT NULL`
      } else {
        whereClause = `WHERE ${imageUrl[0].name} IS NOT NULL`
      }
    } else {
      whereClause = `WHERE ${imageUrl[0].name} IS NOT NULL`
    }

    const sql = `
SELECT 
  ${selectColumns.join(',\n  ')}
FROM \`creatto-463117.biquery_data.${selectedTable}\`
${whereClause}
LIMIT 20
    `.trim()

    return sql
  }

  // Generate fallback data for preview when API fails
  const generateFallbackData = (): GalleryData[] => {
    const sampleImages = [
      'https://picsum.photos/300/300?random=1',
      'https://picsum.photos/300/300?random=2', 
      'https://picsum.photos/300/300?random=3',
      'https://picsum.photos/300/300?random=4'
    ]
    
    return sampleImages.map((url, index) => ({
      image_url: url,
      title: `Image ${index + 1}`,
      description: `Sample description for image ${index + 1}`
    }))
  }

  // Execute query and load Gallery data
  const loadGalleryData = async () => {
    console.log('🖼️ GalleryPreview: loadGalleryData iniciado', {
      selectedTable,
      imageUrlLength: imageUrl.length,
      imageUrl: imageUrl.map(i => ({ name: i.name, type: i.type }))
    })

    if (!selectedTable || imageUrl.length === 0) {
      console.log('🖼️ GalleryPreview: Configuração incompleta, limpando dados')
      setGalleryData([])
      setError(null)
      return
    }

    const sql = generateQuery()
    console.log('🖼️ GalleryPreview: SQL gerado:', sql)
    setQuery(sql)
    setLoading(true)
    setError(null)

    try {
      console.log('🖼️ GalleryPreview: Fazendo chamada para /api/bigquery')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          query: sql
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      console.log('🖼️ GalleryPreview: Resposta recebida', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      if (!response.ok) {
        throw new Error(`API response: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('🖼️ GalleryPreview: Resultado parseado', {
        success: result.success,
        hasData: !!result.data,
        dataLength: result.data?.data?.length,
        error: result.error
      })

      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const rawData = result.data.data as GalleryData[]
        
        console.log('🖼️ GalleryPreview: Dados Gallery processados', {
          rawDataLength: rawData.length,
          sampleRow: rawData[0]
        })

        setGalleryData(rawData)
        
        if (onDataReady) {
          console.log('🖼️ GalleryPreview: Notificando parent component')
          onDataReady(rawData, sql)
        }
      } else {
        const errorMsg = result.error || 'No data returned from Gallery query'
        console.error('🖼️ GalleryPreview: Erro no resultado', errorMsg)
        throw new Error(errorMsg)
      }
    } catch (err) {
      console.error('🖼️ GalleryPreview: Erro na execução', err)
      
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🖼️ GalleryPreview: Timeout - usando dados simulados')
        setError('API timeout - usando dados simulados para preview')
      } else {
        console.log('🖼️ GalleryPreview: Erro de API - usando dados simulados')
        setError('API indisponível - usando dados simulados para preview')
      }
      
      const fallbackData = generateFallbackData()
      setGalleryData(fallbackData)
      
      if (onDataReady) {
        console.log('🖼️ GalleryPreview: Notificando parent com dados simulados')
        onDataReady(fallbackData, sql)
      }
    } finally {
      console.log('🖼️ GalleryPreview: Finalizando loading')
      setLoading(false)
    }
  }

  // Auto-reload when configuration changes
  useEffect(() => {
    console.log('🖼️ GalleryPreview: Configuração mudou, agendando reload')
    const timer = setTimeout(() => {
      loadGalleryData()
    }, 200)

    return () => clearTimeout(timer)
  }, [imageUrl, title, description, filters, selectedTable])

  // Check if ready to render
  const canRender = selectedTable && imageUrl.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Images className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Gallery Preview</CardTitle>
          </div>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
        </div>
        <CardDescription>
          Visualização em tempo real da galeria de imagens
        </CardDescription>
      </CardHeader>

      {/* Query Preview - moved to top for better UX */}
      {query && (
        <div className="px-6 pb-3">
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              View SQL Query
            </summary>
            <Card className="mt-2 bg-muted/50">
              <CardContent className="p-3">
                <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {query}
                </pre>
              </CardContent>
            </Card>
          </details>
        </div>
      )}

      <CardContent>
        <div className="min-h-[200px]">
          {!canRender ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Images className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm text-center">
                Configure URL da imagem para ver preview
              </p>
              <p className="text-xs text-center opacity-70 mt-1">
                Arraste um campo string com URLs de imagens
              </p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Carregando galeria...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <p className="text-sm text-orange-600 mb-2">Usando dados simulados</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : galleryData.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <Images className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">No images found</p>
                <p className="text-xs text-muted-foreground">Try different image URL field or filters</p>
              </div>
            </div>
          ) : (
            <div>
              {/* Gallery Preview */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-3">
                  {galleryData.length} imagens encontradas
                </p>
                
                {/* Preview Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {galleryData.slice(0, 8).map((item, index) => (
                    <div key={index} className="aspect-square relative group">
                      <img
                        src={item.image_url}
                        alt={item.title || `Image ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://via.placeholder.com/150x150?text=No+Image'
                        }}
                      />
                      {item.title && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end">
                          <div className="p-2 text-white text-xs">
                            <p className="font-medium truncate">{item.title}</p>
                            {item.description && (
                              <p className="text-xs opacity-80 truncate">{item.description}</p>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
                
                {galleryData.length > 8 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Mostrando 8 de {galleryData.length} imagens
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}