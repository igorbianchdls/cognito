'use client'

// Como cada resultado aparece: linha/área/barras (várias séries e o período anterior tracejado), número com variação,
// tabela, funil em barras, retenção em tabela de calor e caminhos passo a passo.
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { rotuloPeriodo, type ResultadoCaminhos, type ResultadoFunil, type ResultadoRetencao, type ResultadoTendencia } from '../shared/consulta'

export const CORES = ['#2a78d6', '#e8590c', '#2f9e44', '#9c36b5', '#e03131', '#0c8599', '#f08c00', '#5c7cfa', '#a61e4d', '#495057']
export const fmt = (n: number | null | undefined) => n == null ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
export const duracao = (s: number | null) => s == null ? '—' : s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : s < 86400 ? `${Math.round(s / 360) / 10} h` : `${Math.round(s / 8640) / 10} d`
const tooltip = { contentStyle: { borderRadius: 10, border: '1px solid #ececec', fontSize: 12 }, labelStyle: { color: '#555' } }

export type Visual = 'linha' | 'area' | 'barras' | 'numero' | 'tabela'

export function GraficoTendencia({ r, intervalo, visual, altura = 280 }: { r: ResultadoTendencia; intervalo: string; visual: Visual; altura?: number }) {
  if (visual === 'numero') return <NumeroTendencia r={r} />
  if (visual === 'tabela') return <TabelaTendencia r={r} intervalo={intervalo} />
  const dados = r.rotulos.map((l, i) => ({
    rotulo: rotuloPeriodo(l, intervalo),
    ...Object.fromEntries(r.series.map((s, k) => [`s${k}`, s.valores[i]])),
    ...(r.anterior ? Object.fromEntries(r.anterior.series.map((s, k) => [`a${k}`, s.valores[i] ?? null])) : {}),
  }))
  const comum = { data: dados, margin: { top: 8, right: 8, bottom: 0, left: -8 } }
  const eixos = <>
    <CartesianGrid vertical={false} stroke="#f0f0f0" />
    <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} minTickGap={20} />
    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} width={44} />
    <Tooltip {...tooltip} formatter={(v, n) => [fmt(Number(v)), String(n)]} />
    {r.series.length > 1 || r.anterior ? <Legend wrapperStyle={{ fontSize: 12 }} /> : null}
  </>
  return <div style={{ height: altura }} role="img" aria-label={`Gráfico: ${r.series.map(s => s.nome).join(', ')}`}>
    <ResponsiveContainer width="100%" height="100%">
      {visual === 'barras'
        ? <BarChart {...comum}>{eixos}{r.series.map((s, k) => <Bar key={k} dataKey={`s${k}`} name={s.nome} fill={CORES[k % CORES.length]} radius={[3, 3, 0, 0]} stackId={r.series.length > 3 ? 'a' : undefined} />)}</BarChart>
        : visual === 'area'
          ? <AreaChart {...comum}>{eixos}{r.series.map((s, k) => <Area key={k} type="monotone" dataKey={`s${k}`} name={s.nome} stroke={CORES[k % CORES.length]} fill={CORES[k % CORES.length]} fillOpacity={0.12} strokeWidth={2} />)}</AreaChart>
          : <LineChart {...comum}>{eixos}
            {r.series.map((s, k) => <Line key={k} type="monotone" dataKey={`s${k}`} name={s.nome} stroke={CORES[k % CORES.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />)}
            {r.anterior?.series.map((s, k) => <Line key={`a${k}`} type="monotone" dataKey={`a${k}`} name={`${s.nome} (anterior)`} stroke={CORES[k % CORES.length]} strokeOpacity={0.45} strokeDasharray="4 4" strokeWidth={1.5} dot={false} />)}
          </LineChart>}
    </ResponsiveContainer>
  </div>
}

function NumeroTendencia({ r }: { r: ResultadoTendencia }) {
  return <div className="flex flex-wrap gap-8 py-2">
    {r.series.map((s, k) => {
      const antes = r.anterior?.series[k]?.total
      const variacao = antes ? Math.round((s.total - antes) / antes * 1000) / 10 : null
      return <div key={k}>
        <p className="text-[13px] text-[#6b6b6b]">{s.nome}</p>
        <p className="text-[40px] font-semibold tabular-nums tracking-[-0.02em] text-[#111]" data-numero>{fmt(s.total)}</p>
        {variacao != null && <p className={`text-[13px] font-medium ${variacao >= 0 ? 'text-[#2f9e44]' : 'text-[#e03131]'}`}>{variacao >= 0 ? '▲' : '▼'} {Math.abs(variacao)}% vs. período anterior</p>}
      </div>
    })}
  </div>
}

function TabelaTendencia({ r, intervalo }: { r: ResultadoTendencia; intervalo: string }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-[13px]">
    <thead><tr className="text-left text-[12px] text-[#888]"><th className="pb-2 pr-3 font-medium">Série</th><th className="pb-2 pr-3 text-right font-medium">Total</th>
      {r.rotulos.slice(-8).map(l => <th key={l} className="pb-2 pr-3 text-right font-medium">{rotuloPeriodo(l, intervalo)}</th>)}</tr></thead>
    <tbody>{r.series.map((s, k) => <tr key={k} className="border-t border-[#f3f3f3]">
      <td className="py-2 pr-3"><span className="mr-2 inline-block size-2 rounded-full" style={{ background: CORES[k % CORES.length] }} />{s.nome}</td>
      <td className="py-2 pr-3 text-right font-semibold tabular-nums">{fmt(s.total)}</td>
      {s.valores.slice(-8).map((v, i) => <td key={i} className="py-2 pr-3 text-right tabular-nums text-[#444]">{fmt(v)}</td>)}
    </tr>)}</tbody>
  </table></div>
}

export function GraficoFunil({ r, compacto = false }: { r: ResultadoFunil; compacto?: boolean }) {
  return <div className="grid gap-4">
    <div className="grid gap-2" role="list" aria-label="Passos do funil">
      {r.passos.map((p, i) => <div key={i} role="listitem" className="grid grid-cols-[minmax(0,180px)_1fr] items-center gap-3 sm:grid-cols-[minmax(0,220px)_1fr]" data-passo={i + 1}>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-[#111]" title={p.nome}><span className="mr-1.5 text-[#999]">{i + 1}.</span>{p.nome}</p>
          {i > 0 && !compacto && <p className="text-[11.5px] text-[#888]">{p.do_anterior}% do passo anterior{p.tempo_mediano_s != null ? ` · ${duracao(p.tempo_mediano_s)}` : ''}</p>}
        </div>
        <div className="relative h-9 overflow-hidden rounded-lg bg-[#f3f5f8]">
          <div className="absolute inset-y-0 left-0 rounded-lg bg-[#2a78d6] transition-[width] duration-500" style={{ width: `${Math.max(p.conversao, p.pessoas ? 1.5 : 0)}%` }} />
          <span className="relative flex h-full items-center px-3 text-[12.5px] font-semibold tabular-nums text-[#111] mix-blend-normal"><span className="rounded bg-white/85 px-1.5">{fmt(p.pessoas)} · {p.conversao}%</span></span>
        </div>
      </div>)}
    </div>
    {!compacto && r.passos.length > 1 && <p className="text-[13px] text-[#555]">Conversão total: <b className="text-[#111]">{r.passos.at(-1)!.conversao}%</b>
      {r.passos.at(-1)!.pessoas < r.passos[0].pessoas && <> · maior queda no passo {(() => { let pior = 1; r.passos.forEach((p, i) => { if (i && p.do_anterior < r.passos[pior].do_anterior) pior = i }); return `${pior + 1} (${r.passos[pior].nome}: ${r.passos[pior].do_anterior}%)` })()}</>}</p>}
    {!compacto && r.quebras.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-[13px]">
      <thead><tr className="text-left text-[12px] text-[#888]"><th className="pb-2 pr-3 font-medium">Quebra</th>{r.passos.map((p, i) => <th key={i} className="pb-2 pr-3 text-right font-medium">{i + 1}. {p.nome}</th>)}</tr></thead>
      <tbody>{r.quebras.map(q => <tr key={q.quebra} className="border-t border-[#f3f3f3]"><td className="py-2 pr-3 font-medium">{q.quebra}</td>
        {q.passos.map((p, i) => <td key={i} className="py-2 pr-3 text-right tabular-nums">{fmt(p.pessoas)}{i > 0 && <span className="ml-1 text-[#888]">({p.conversao}%)</span>}</td>)}</tr>)}</tbody>
    </table></div>}
  </div>
}

export function TabelaRetencao({ r, intervalo }: { r: ResultadoRetencao; intervalo: string }) {
  if (!r.coortes.length) return <p className="text-[13px] text-[#888]">Ninguém fez o evento inicial no período.</p>
  const cor = (v: number) => `rgba(42, 120, 214, ${Math.min(0.9, 0.08 + v / 110)})`
  return <div className="overflow-x-auto"><table className="w-full min-w-[560px] border-separate border-spacing-[3px] text-[12.5px]" aria-label="Retenção por coorte">
    <thead><tr className="text-left text-[11.5px] text-[#888]"><th className="pb-1 pr-2 font-medium">Coorte</th><th className="pb-1 pr-2 text-right font-medium">Pessoas</th>
      {r.rotulos.map(l => <th key={l} className="pb-1 text-center font-medium">{l}</th>)}</tr></thead>
    <tbody>{r.coortes.map(c => <tr key={c.inicio}>
      <td className="whitespace-nowrap pr-2 text-[#444]">{rotuloPeriodo(c.inicio, intervalo === 'dia' ? 'dia' : intervalo)}</td>
      <td className="pr-2 text-right tabular-nums text-[#444]">{fmt(c.tamanho)}</td>
      {c.valores.map((v, k) => <td key={k} className="h-8 min-w-[52px] rounded-md text-center tabular-nums" style={v == null ? { background: '#fafafa' } : { background: cor(v), color: v > 55 ? '#fff' : '#111' }}>{v == null ? '' : `${v}%`}</td>)}
    </tr>)}</tbody>
  </table></div>
}

export function Caminhos({ r }: { r: ResultadoCaminhos }) {
  const passos = [...new Set(r.ligacoes.map(l => l.passo))].sort((a, b) => a - b)
  if (!r.inicio.length) return <p className="text-[13px] text-[#888]">Nenhuma sessão com essa página no período.</p>
  const max = Math.max(...r.ligacoes.map(l => l.sessoes), 1)
  return <div className="flex gap-4 overflow-x-auto pb-2" aria-label="Caminhos">
    <div className="grid min-w-[200px] content-start gap-1.5">
      <p className="text-[11.5px] font-medium uppercase tracking-wide text-[#888]">Início</p>
      {r.inicio.map(p => <div key={p.pagina} className="flex items-center justify-between gap-2 rounded-lg border border-[#e6eefb] bg-[#f3f7fd] px-2.5 py-1.5 text-[12.5px]"><span className="truncate" title={p.pagina}>{p.pagina}</span><b className="tabular-nums">{fmt(p.sessoes)}</b></div>)}
    </div>
    {passos.map(passo => <div key={passo} className="grid min-w-[240px] content-start gap-1.5">
      <p className="text-[11.5px] font-medium uppercase tracking-wide text-[#888]">Passo {passo + 1} → {passo + 2}</p>
      {r.ligacoes.filter(l => l.passo === passo).map(l => <div key={`${l.de}>${l.para}`} className="relative overflow-hidden rounded-lg border border-[#ececec] bg-white px-2.5 py-1.5 text-[12.5px]" data-ligacao>
        <span aria-hidden className="absolute inset-y-0 left-0 bg-[#2a78d6]/10" style={{ width: `${l.sessoes / max * 100}%` }} />
        <span className="relative flex items-center justify-between gap-2"><span className="min-w-0 truncate" title={`${l.de} → ${l.para}`}><span className="text-[#888]">{l.de}</span> → <b className="font-medium text-[#111]">{l.para}</b></span><b className="tabular-nums">{fmt(l.sessoes)}</b></span>
      </div>)}
    </div>)}
  </div>
}

/** Barras simples (rolagem, distribuição). */
export function Barras({ dados, chave, valor, altura = 180, sufixo = '' }: { dados: Record<string, unknown>[]; chave: string; valor: string; altura?: number; sufixo?: string }) {
  return <div style={{ height: altura }}><ResponsiveContainer width="100%" height="100%">
    <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
      <CartesianGrid vertical={false} stroke="#f0f0f0" />
      <XAxis dataKey={chave} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}${sufixo}`} />
      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} width={40} />
      <Tooltip {...tooltip} labelFormatter={v => `${v}${sufixo}`} formatter={v => [fmt(Number(v)), 'Pessoas']} />
      <Bar dataKey={valor} fill="#2a78d6" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer></div>
}
