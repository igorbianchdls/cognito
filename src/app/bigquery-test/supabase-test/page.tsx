'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface YouTubeContent {
  id: string
  titulo: string
  hook: string | null
  intro: string | null
  value_proposition: string | null
  script: string | null
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
  hook: string | null
  hook_expansion: string | null
  script: string | null
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
  const [showYoutubeForm, setShowYoutubeForm] = useState(false)
  const [showReelsForm, setShowReelsForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingYoutube, setEditingYoutube] = useState<string | null>(null)
  const [editingReels, setEditingReels] = useState<string | null>(null)

  const [youtubeForm, setYoutubeForm] = useState({
    titulo: '',
    hook: '',
    intro: '',
    value_proposition: '',
    script: '',
    categoria: ''
  })

  const [reelsForm, setReelsForm] = useState({
    titulo: '',
    hook: '',
    hook_expansion: '',
    script: ''
  })

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

  async function handleCreateYoutube(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('youtube_content').insert([youtubeForm])

      if (error) throw error

      setYoutubeForm({ titulo: '', hook: '', intro: '', value_proposition: '', script: '', categoria: '' })
      setShowYoutubeForm(false)
      await fetchData()
    } catch (err) {
      alert('Erro ao criar: ' + String(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateYoutube(id: string) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('youtube_content')
        .update(youtubeForm)
        .eq('id', id)

      if (error) throw error

      setEditingYoutube(null)
      setYoutubeForm({ titulo: '', hook: '', intro: '', value_proposition: '', script: '', categoria: '' })
      await fetchData()
    } catch (err) {
      alert('Erro ao atualizar: ' + String(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteYoutube(id: string, titulo: string) {
    if (!confirm(`Tem certeza que deseja deletar "${titulo}"?`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('youtube_content').delete().eq('id', id)

      if (error) throw error

      await fetchData()
    } catch (err) {
      alert('Erro ao deletar: ' + String(err))
    }
  }

  async function handleCreateReels(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('reels_content').insert([reelsForm])

      if (error) throw error

      setReelsForm({ titulo: '', hook: '', hook_expansion: '', script: '' })
      setShowReelsForm(false)
      await fetchData()
    } catch (err) {
      alert('Erro ao criar: ' + String(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateReels(id: string) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reels_content')
        .update(reelsForm)
        .eq('id', id)

      if (error) throw error

      setEditingReels(null)
      setReelsForm({ titulo: '', hook: '', hook_expansion: '', script: '' })
      await fetchData()
    } catch (err) {
      alert('Erro ao atualizar: ' + String(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteReels(id: string, titulo: string) {
    if (!confirm(`Tem certeza que deseja deletar "${titulo}"?`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('reels_content').delete().eq('id', id)

      if (error) throw error

      await fetchData()
    } catch (err) {
      alert('Erro ao deletar: ' + String(err))
    }
  }

  function startEditYoutube(item: YouTubeContent) {
    setEditingYoutube(item.id)
    setYoutubeForm({
      titulo: item.titulo,
      hook: item.hook || '',
      intro: item.intro || '',
      value_proposition: item.value_proposition || '',
      script: item.script || '',
      categoria: item.categoria || ''
    })
  }

  function startEditReels(item: ReelsContent) {
    setEditingReels(item.id)
    setReelsForm({
      titulo: item.titulo,
      hook: item.hook || '',
      hook_expansion: item.hook_expansion || '',
      script: item.script || ''
    })
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
          <p className="text-gray-600">CRUD completo - YouTube e Reels</p>
        </div>

        {/* Tabela YouTube */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-red-600 text-white flex justify-between items-center">
            <h2 className="text-2xl font-bold">YouTube ({youtubeData.length})</h2>
            <button
              onClick={() => setShowYoutubeForm(!showYoutubeForm)}
              className="px-4 py-2 bg-white text-red-600 rounded hover:bg-gray-100 font-semibold"
            >
              {showYoutubeForm ? 'Cancelar' : '+ Criar Novo'}
            </button>
          </div>

          {showYoutubeForm && (
            <form onSubmit={handleCreateYoutube} className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título*</label>
                  <input
                    type="text"
                    required
                    value={youtubeForm.titulo}
                    onChange={e => setYoutubeForm({...youtubeForm, titulo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={youtubeForm.categoria}
                    onChange={e => setYoutubeForm({...youtubeForm, categoria: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hook</label>
                  <textarea
                    value={youtubeForm.hook}
                    onChange={e => setYoutubeForm({...youtubeForm, hook: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intro</label>
                  <textarea
                    value={youtubeForm.intro}
                    onChange={e => setYoutubeForm({...youtubeForm, intro: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value Proposition</label>
                  <textarea
                    value={youtubeForm.value_proposition}
                    onChange={e => setYoutubeForm({...youtubeForm, value_proposition: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Script</label>
                  <textarea
                    value={youtubeForm.script}
                    onChange={e => setYoutubeForm({...youtubeForm, script: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Criando...' : 'Criar Vídeo'}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {youtubeData.map((item) => (
                  <>
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.titulo}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.categoria || '-'}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.views)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.likes)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => startEditYoutube(item)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 mr-2"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteYoutube(item.id, item.titulo)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          🗑️ Deletar
                        </button>
                      </td>
                    </tr>
                    {editingYoutube === item.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-blue-50">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Título*</label>
                              <input
                                type="text"
                                required
                                value={youtubeForm.titulo}
                                onChange={e => setYoutubeForm({...youtubeForm, titulo: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                              <input
                                type="text"
                                value={youtubeForm.categoria}
                                onChange={e => setYoutubeForm({...youtubeForm, categoria: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hook</label>
                              <textarea
                                value={youtubeForm.hook}
                                onChange={e => setYoutubeForm({...youtubeForm, hook: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Intro</label>
                              <textarea
                                value={youtubeForm.intro}
                                onChange={e => setYoutubeForm({...youtubeForm, intro: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={2}
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Value Proposition</label>
                              <textarea
                                value={youtubeForm.value_proposition}
                                onChange={e => setYoutubeForm({...youtubeForm, value_proposition: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={2}
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Script</label>
                              <textarea
                                value={youtubeForm.script}
                                onChange={e => setYoutubeForm({...youtubeForm, script: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={4}
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => handleUpdateYoutube(item.id)}
                              disabled={submitting}
                              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {submitting ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingYoutube(null)
                                setYoutubeForm({ titulo: '', hook: '', intro: '', value_proposition: '', script: '', categoria: '' })
                              }}
                              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela Reels */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white flex justify-between items-center">
            <h2 className="text-2xl font-bold">Reels ({reelsData.length})</h2>
            <button
              onClick={() => setShowReelsForm(!showReelsForm)}
              className="px-4 py-2 bg-white text-purple-600 rounded hover:bg-gray-100 font-semibold"
            >
              {showReelsForm ? 'Cancelar' : '+ Criar Novo'}
            </button>
          </div>

          {showReelsForm && (
            <form onSubmit={handleCreateReels} className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título*</label>
                  <input
                    type="text"
                    required
                    value={reelsForm.titulo}
                    onChange={e => setReelsForm({...reelsForm, titulo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hook</label>
                  <textarea
                    value={reelsForm.hook}
                    onChange={e => setReelsForm({...reelsForm, hook: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hook Expansion</label>
                  <textarea
                    value={reelsForm.hook_expansion}
                    onChange={e => setReelsForm({...reelsForm, hook_expansion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Script</label>
                  <textarea
                    value={reelsForm.script}
                    onChange={e => setReelsForm({...reelsForm, script: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Criando...' : 'Criar Reel'}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saves</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reelsData.map((item) => (
                  <>
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.titulo}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.views)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.likes)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatNumber(item.saves)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => startEditReels(item)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 mr-2"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteReels(item.id, item.titulo)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          🗑️ Deletar
                        </button>
                      </td>
                    </tr>
                    {editingReels === item.id && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-purple-50">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Título*</label>
                              <input
                                type="text"
                                required
                                value={reelsForm.titulo}
                                onChange={e => setReelsForm({...reelsForm, titulo: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hook</label>
                              <textarea
                                value={reelsForm.hook}
                                onChange={e => setReelsForm({...reelsForm, hook: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hook Expansion</label>
                              <textarea
                                value={reelsForm.hook_expansion}
                                onChange={e => setReelsForm({...reelsForm, hook_expansion: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={2}
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Script</label>
                              <textarea
                                value={reelsForm.script}
                                onChange={e => setReelsForm({...reelsForm, script: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                rows={4}
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => handleUpdateReels(item.id)}
                              disabled={submitting}
                              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                            >
                              {submitting ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingReels(null)
                                setReelsForm({ titulo: '', hook: '', hook_expansion: '', script: '' })
                              }}
                              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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