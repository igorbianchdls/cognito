'use client'

import { useState, useEffect } from 'react'
import { Database, MapPin, Calendar, AlertCircle, RefreshCw } from 'lucide-react'

interface Dataset {
  id: string
  friendlyName?: string
  description?: string
  location?: string
  creationTime?: string
}

export default function DatasetsPanel() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDatasets = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/bigquery?action=datasets')
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        setDatasets(result.data)
      } else {
        throw new Error(result.error || 'Failed to load datasets')
      }
    } catch (err) {
      console.error('Error loading datasets:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Load datasets on component mount
  useEffect(() => {
    loadDatasets()
  }, [])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Datasets</h2>
            <span className="text-sm text-gray-500">({datasets.length})</span>
          </div>
          <button
            onClick={loadDatasets}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && datasets.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading datasets...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : datasets.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-gray-500">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No datasets found</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                {/* Dataset Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {dataset.friendlyName || dataset.id}
                      </h3>
                      {dataset.friendlyName && (
                        <p className="text-xs text-gray-500 font-mono">{dataset.id}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dataset Description */}
                {dataset.description && (
                  <p className="text-sm text-gray-600 mb-3">{dataset.description}</p>
                )}

                {/* Dataset Metadata */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {dataset.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{dataset.location}</span>
                    </div>
                  )}
                  {dataset.creationTime && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(dataset.creationTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}