'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface YouTubeContent {
  id: string
  titulo: string
  categoria: string | null
  views: number
  likes: number
  comments: number
  retention_rate: number | null
  subscribers_gained: number
  status: string
  created_at: string
}

interface ReelsContent {
  id: string
  titulo: string
  views: number
  likes: number
  comments: number
  saves: number
  engagement_rate: number | null
  follows: number
  status: string
  created_at: string
}

export default function SupabaseDataPage() {
  const [youtubeData, setYoutubeData] = useState<YouTubeContent[]>([])
  const [reelsData, setReelsData] = useState<ReelsContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const supabase = createClient()

      const [youtubeResult, reelsResult] = await Promise.all([
        supabase.from('youtube_content').select('*').order('created_at', { ascending: false }),
        supabase.from('reels_content').select('*').order('created_at', { ascending: false })
      ])

      if (youtubeResult.error) throw new Error(`YouTube: ${youtubeResult.error.message}`)
      if (reelsResult.error) throw new Error(`Reels: ${reelsResult.error.message}`)

      setYoutubeData(youtubeResult.data || [])
      setReelsData(reelsResult.data || [])
      setError(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-2xl">Carregando dados...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Erro:</strong> {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-gray-800">Conteúdo do Supabase</h1>
          <p className="text-gray-600">Dados das tabelas YouTube e Reels</p>
        </div>

        {/* Tabela YouTube */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-red-600 text-white">
            <h2 className="text-2xl font-bold">YouTube ({youtubeData.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comments</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Retention</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subs+</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {youtubeData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.titulo}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.categoria || '-'}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.views)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.likes)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.comments)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {item.retention_rate ? `${item.retention_rate}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                      +{formatNumber(item.subscribers_gained)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela Reels */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <h2 className="text-2xl font-bold">Reels ({reelsData.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comments</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saves</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Follows+</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reelsData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.titulo}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.views)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.likes)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.comments)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.saves)}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {item.engagement_rate ? `${item.engagement_rate}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                      +{formatNumber(item.follows)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            🔄 Recarregar Dados
          </button>
        </div>
      </div>
    </div>
  )
}