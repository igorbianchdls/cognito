'use client'

// Mapa de calor: os cliques de uma página desenhados por cima dela (num quadro com a página de verdade, quando o
// site deixa), até onde as pessoas rolam e os elementos mais clicados (com os cliques de raiva).
import { useEffect, useRef, useState } from 'react'
import { useLeitura } from './api'
import { fmt } from './graficos'
import type { Property } from './properties'
import { Card, campoCls, Notice, Tela, Vazio } from './ui'

type Mapa = { pontos: { x: string | number; y: string | number; n: number }[]; elementos: { seletor: string; texto: string | null; tag: string | null; cliques: number; raiva: number }[]
  rolagem: { faixa: number; pessoas: number }[]; largura: number | null; altura: number | null; visitas: number }

export function MapaView() {
  return <Tela title="Mapa de calor" subtitle="Onde clicam e até onde rolam, página por página.">{site => <MapaSite key={site.id} site={site} />}</Tela>
}

function MapaSite({ site }: { site: Property }) {
  const paginas = useLeitura<{ paginas: { pagina: string; url: string; cliques: number }[] }>(`catalogo?propriedade=${site.id}&tipo=paginas`)
  const [pagina, setPagina] = useState('')
  const [aparelho, setAparelho] = useState<'desktop' | 'mobile' | 'tablet'>('desktop')
  const [dias, setDias] = useState(30)
  const [fundo, setFundo] = useState(true)
  const escolhida = pagina || paginas.dados?.paginas[0]?.pagina || ''
  const mapa = useLeitura<Mapa>(escolhida ? `mapa?propriedade=${site.id}&pagina=${encodeURIComponent(escolhida)}&aparelho=${aparelho}&dias=${dias}` : null)
  if (paginas.erro) return <Notice tone="error">{paginas.erro}</Notice>
  if (!paginas.dados) return <div className="h-64 animate-pulse rounded-2xl bg-[#f0f0f0]" />
  if (!paginas.dados.paginas.length) return <Vazio titulo="Nenhum clique ainda">Os cliques chegam sozinhos com a autocaptura ligada (em Sites e apps). Abra o site, clique em alguns botões e volte aqui.</Vazio>
  const url = paginas.dados.paginas.find(p => p.pagina === escolhida)?.url
  return <div className="grid gap-4">
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Página" value={escolhida} onChange={e => setPagina(e.target.value)} className={`${campoCls} max-w-xs`}>{paginas.dados.paginas.map(p => <option key={p.pagina} value={p.pagina}>{p.pagina} · {fmt(p.cliques)} cliques</option>)}</select>
      <div role="group" aria-label="Aparelho" className="flex rounded-lg border border-[#e2e2e2] bg-white p-0.5">
        {(['desktop', 'tablet', 'mobile'] as const).map(a => <button key={a} type="button" aria-pressed={aparelho === a} onClick={() => setAparelho(a)} className={`h-8 rounded-md px-3 text-[12.5px] ${aparelho === a ? 'bg-[#111] text-white' : 'text-[#555] hover:bg-[#f3f3f3]'}`}>{a === 'desktop' ? 'Computador' : a === 'tablet' ? 'Tablet' : 'Celular'}</button>)}
      </div>
      <select aria-label="Período" value={dias} onChange={e => setDias(Number(e.target.value))} className={campoCls}><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option></select>
      <label className="flex items-center gap-1.5 text-[13px] text-[#333]"><input type="checkbox" checked={fundo} onChange={e => setFundo(e.target.checked)} />Mostrar a página por trás</label>
    </div>
    {mapa.erro ? <Notice tone="error">{mapa.erro}</Notice> : !mapa.dados ? <div className="h-96 animate-pulse rounded-2xl bg-[#f0f0f0]" /> : <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="min-w-0 p-3">{mapa.dados.pontos.length ? <Desenho mapa={mapa.dados} url={fundo ? url : undefined} aparelho={aparelho} />
        : <p className="p-6 text-[13px] text-[#888]">Sem cliques nesta página {aparelho === 'desktop' ? 'no computador' : aparelho === 'mobile' ? 'no celular' : 'no tablet'} no período.</p>}</Card>
      <div className="grid gap-4">
        <Card title="Até onde rolam">
          {!mapa.dados.rolagem.length ? <p className="text-[13px] text-[#888]">Sem dados de rolagem ainda.</p> : <div className="grid gap-1.5" data-rolagem>
            {mapa.dados.rolagem.map(f => { const base = mapa.dados!.rolagem[0].pessoas || 1; const pct = Math.round(f.pessoas / base * 100); return <div key={f.faixa} className="grid grid-cols-[48px_1fr_44px] items-center gap-2 text-[12.5px]">
              <span className="text-[#777]">{f.faixa}%</span><span className="h-2.5 overflow-hidden rounded-full bg-[#f1f3f5]"><span className="block h-full rounded-full bg-[#e8590c]" style={{ width: `${pct}%` }} /></span><span className="text-right tabular-nums">{pct}%</span></div> })}
          </div>}
          <p className="mt-2 text-[11.5px] text-[#999]">{fmt(mapa.dados.visitas)} visitas à página no período.</p>
        </Card>
        <Card title="Mais clicados">
          {!mapa.dados.elementos.length ? <p className="text-[13px] text-[#888]">Nada ainda.</p> : <ul className="grid gap-1.5" data-elementos>{mapa.dados.elementos.map(e => <li key={e.seletor} className="flex items-center justify-between gap-2 text-[12.5px]">
            <span className="min-w-0"><span className="block truncate font-medium text-[#111]">{e.texto || `<${e.tag}>`}</span><span className="block truncate font-mono text-[11px] text-[#999]" title={e.seletor}>{e.seletor}</span></span>
            <span className="shrink-0 text-right tabular-nums"><b>{fmt(e.cliques)}</b>{e.raiva ? <span className="ml-1 rounded bg-[#fdf0f0] px-1 text-[11px] text-[#c92a2a]" title="cliques repetidos de frustração">{e.raiva} raiva</span> : null}</span></li>)}</ul>}
        </Card>
      </div>
    </div>}
  </div>
}

function Desenho({ mapa, url, aparelho }: { mapa: Mapa; url?: string; aparelho: string }) {
  const caixa = useRef<HTMLDivElement>(null)
  const tela = useRef<HTMLCanvasElement>(null)
  const [largura, setLargura] = useState(800)
  useEffect(() => {
    const el = caixa.current; if (!el) return
    const ro = new ResizeObserver(() => setLargura(el.clientWidth)); ro.observe(el); setLargura(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  const vw = mapa.largura || (aparelho === 'mobile' ? 390 : aparelho === 'tablet' ? 820 : 1280)
  const escala = Math.min(1, largura / vw)
  const maxY = Math.max(...mapa.pontos.map(p => Number(p.y)), 600)
  const alturaPagina = Math.min(8000, Math.max(mapa.altura ?? 0, maxY + 200))
  useEffect(() => {
    const c = tela.current; if (!c) return
    const w = vw * escala, h = alturaPagina * escala, dpr = window.devicePixelRatio || 1
    c.width = w * dpr; c.height = h * dpr; c.style.width = `${w}px`; c.style.height = `${h}px`
    const g = c.getContext('2d'); if (!g) return
    g.scale(dpr, dpr); g.clearRect(0, 0, w, h)
    // Intensidade em tons de cinza, depois colorida (azul → verde → amarelo → vermelho).
    const max = Math.max(...mapa.pontos.map(p => p.n), 1), raio = Math.max(14, 28 * escala)
    for (const p of mapa.pontos) {
      const x = Number(p.x) / 100 * w, y = Number(p.y) * escala
      const grad = g.createRadialGradient(x, y, 0, x, y, raio)
      grad.addColorStop(0, `rgba(0,0,0,${Math.min(1, 0.25 + 0.75 * p.n / max)})`); grad.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = grad; g.fillRect(x - raio, y - raio, raio * 2, raio * 2)
    }
    const img = g.getImageData(0, 0, c.width, c.height), d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] / 255; if (!a) continue
      const [r, gg, b] = a < 0.25 ? [40, 110, 230] : a < 0.5 ? [50, 190, 90] : a < 0.75 ? [250, 200, 30] : [235, 50, 40]
      d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = Math.round(Math.min(0.85, a + 0.15) * 255)
    }
    g.putImageData(img, 0, 0)
  }, [mapa, escala, vw, alturaPagina])
  const linhas = mapa.rolagem.filter(f => f.faixa > 0 && f.faixa < 100)
  const base = mapa.rolagem[0]?.pessoas || 1
  return <div ref={caixa} className="max-h-[78vh] overflow-auto rounded-xl bg-[#f6f7f9]" data-mapa>
    <div className="relative mx-auto" style={{ width: vw * escala, height: alturaPagina * escala }}>
      {url ? <iframe title="Prévia do site" src={url} sandbox="allow-same-origin" tabIndex={-1} aria-hidden className="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white" style={{ width: vw, height: alturaPagina, transform: `scale(${escala})` }} /> : null}
      <canvas ref={tela} className="pointer-events-none absolute left-0 top-0" aria-label={`Mapa de calor com ${mapa.pontos.length} pontos`} role="img" />
      {linhas.map(f => <div key={f.faixa} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#e8590c]/70" style={{ top: alturaPagina * escala * f.faixa / 100 }}>
        <span className="absolute right-1 top-0.5 rounded bg-[#e8590c] px-1.5 py-0.5 text-[10.5px] font-medium text-white">{Math.round(f.pessoas / base * 100)}% chegam aqui</span></div>)}
    </div>
  </div>
}
