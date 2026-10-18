'use client'
import { useMemo, useState, type DragEvent } from 'react'
import { FileSpreadsheet, LoaderCircle, UploadCloud } from 'lucide-react'
import { FIELD_LABELS, type TableBundle } from '../shared/contracts'
import { send, type TablesApi } from './client'
import { Modal } from './dialogs'
import { parseCsv } from '../shared/csv'

const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').trim().toLocaleLowerCase('pt-BR')
const BATCH = 200

type Result = { criados: number; erros: { linha: number; mensagem: string }[] }
export function CsvImportDialog({ api, bundle, onClose, onDone }: { api: TablesApi; bundle: TableBundle; onClose: () => void; onDone: () => void }) {
  const fields = useMemo(() => bundle.campos.filter(f => f.tipo !== 'anexo'), [bundle])
  const [file, setFile] = useState<{ nome: string; header: string[]; rows: string[][] } | null>(null)
  const [mapping, setMapping] = useState<string[]>([]), [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ feitas: number; total: number } | null>(null), [result, setResult] = useState<Result | null>(null), [dragging, setDragging] = useState(false)

  async function read(next?: File) {
    if (!next) return
    setError(null); setResult(null)
    if (next.size > 10 * 1024 * 1024) { setError('Use um arquivo de até 10 MB.'); return }
    const rows = parseCsv(await next.text())
    if (rows.length < 2) { setError('O arquivo precisa de uma linha de títulos e pelo menos um registro.'); return }
    const [header, ...data] = rows
    setFile({ nome: next.name, header, rows: data })
    // Columns with the name of a field are matched automatically.
    setMapping(header.map(h => fields.find(f => normalize(f.nome) === normalize(h))?.id ?? ''))
  }
  const used = mapping.filter(Boolean)
  const duplicate = used.length !== new Set(used).size
  const missing = fields.filter(f => f.obrigatorio && !used.includes(f.id))

  async function start() {
    if (!file) return
    const columns = mapping.map((id, index) => ({ id, index })).filter(c => c.id)
    const result: Result = { criados: 0, erros: [] }
    setError(null); setProgress({ feitas: 0, total: file.rows.length })
    try {
      for (let start = 0; start < file.rows.length; start += BATCH) {
        const batch = file.rows.slice(start, start + BATCH).map(r => columns.map(c => r[c.index] ?? ''))
        const answer = await api<Result>(`/tabelas/${bundle.tabela.id}/importar`, send('POST', { colunas: columns.map(c => c.id), linhas: batch, primeira_linha: start + 2, expectedStructureVersion: bundle.tabela.versao_estrutura }))
        result.criados += answer.criados; result.erros.push(...answer.erros)
        setProgress({ feitas: Math.min(start + BATCH, file.rows.length), total: file.rows.length })
        if (result.erros.length >= 200) break
      }
      setResult(result); onDone()
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível importar.'); if (result.criados) { setResult(result); onDone() } }
    finally { setProgress(null) }
  }

  const drop = (e: DragEvent) => { e.preventDefault(); setDragging(false); void read(e.dataTransfer.files?.[0]) }
  return <Modal wide title="Importar CSV" description={`Cria registros em ${bundle.tabela.nome} a partir de uma planilha. A primeira linha deve ter os títulos das colunas.`} onClose={() => { if (!progress) onClose() }} error={error}>
    {result ? <div className="tables-import-result">
      <p><strong>{result.criados.toLocaleString('pt-BR')}</strong> {result.criados === 1 ? 'registro criado' : 'registros criados'}{result.erros.length ? `, ${result.erros.length} ${result.erros.length === 1 ? 'linha com problema' : 'linhas com problema'}` : ''}.</p>
      {result.erros.length > 0 && <ul className="tables-import-errors">{result.erros.slice(0, 50).map(e => <li key={e.linha}><strong>Linha {e.linha}</strong>{e.mensagem}</li>)}</ul>}
      <div className="tables-dialog-footer"><button type="button" className="tables-button-primary" onClick={onClose}>Concluir</button></div>
    </div> : !file ? <label className={'tables-upload-drop' + (dragging ? ' ativo' : '')} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={drop}>
      <UploadCloud size={28} /><strong>Clique para escolher um arquivo CSV</strong><span>ou arraste e solte aqui · separado por ponto e vírgula ou vírgula</span>
      <input type="file" hidden accept=".csv,text/csv" onChange={e => void read(e.target.files?.[0])} />
    </label> : <div className="tables-import">
      <p className="tables-import-file"><FileSpreadsheet size={16} /><strong>{file.nome}</strong><span>{file.rows.length.toLocaleString('pt-BR')} linhas</span><button type="button" disabled={Boolean(progress)} onClick={() => { setFile(null); setMapping([]) }}>Trocar arquivo</button></p>
      <div className="tables-import-map">{file.header.map((title, index) => <label key={index}>
        <span><strong>{title || `Coluna ${index + 1}`}</strong><small>{file.rows.slice(0, 2).map(r => r[index]).filter(Boolean).join(' · ').slice(0, 60) || 'vazia'}</small></span>
        <select value={mapping[index] ?? ''} disabled={Boolean(progress)} onChange={e => setMapping(m => m.map((v, i) => i === index ? e.target.value : v))}><option value="">Não importar</option>{fields.map(f => <option key={f.id} value={f.id}>{f.nome} · {FIELD_LABELS[f.tipo]}</option>)}</select>
      </label>)}</div>
      {duplicate && <p className="tables-error" role="alert">Cada campo pode receber só uma coluna.</p>}
      {missing.length > 0 && <p className="tables-muted">Campos obrigatórios sem coluna: {missing.map(f => f.nome).join(', ')}. As linhas sem eles serão recusadas.</p>}
      <p className="tables-muted">Datas em dd/mm/aaaa, números com vírgula decimal, Sim/Não em caixas de seleção e várias escolhas separadas por vírgula. Opções, pessoas e vínculos são encontrados pelo nome.</p>
      <div className="tables-dialog-footer">{progress && <span className="tables-import-progress"><LoaderCircle size={14} className="tables-spin" />{progress.feitas.toLocaleString('pt-BR')} de {progress.total.toLocaleString('pt-BR')}</span>}<button type="button" onClick={onClose} disabled={Boolean(progress)}>Cancelar</button><button type="button" className="tables-button-primary" disabled={!used.length || duplicate || Boolean(progress)} onClick={() => void start()}>Importar {file.rows.length.toLocaleString('pt-BR')} linhas</button></div>
    </div>}
  </Modal>
}
