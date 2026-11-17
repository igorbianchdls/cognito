import type { ReactNode } from 'react'
import { IconBrandInstagram, IconBrandOpenai, IconBrandTiktok, IconBrandWhatsapp, IconBrandYoutube, IconCheck, IconFileSpreadsheet, IconMusic, IconShieldLock } from '@tabler/icons-react'
import s from './ToolCards.module.css'

// "Everything in one place" cards for the landing pages: a gradient card with an animated mock screen inside a dark
// frame, a tag pill, a title and a line of text. The mock screens are plain HTML/CSS animations (no video).

export type ToolCard = { tag: string; title: string; text: string; bg: string; screen: ReactNode; wide?: boolean }

export function ToolCards({ title, cards }: { title: string; cards: ToolCard[] }) {
  return <section className={s.section}>
    <h2 className={s.title}>{title}</h2>
    <div className={s.grid}>
      {cards.map(c => <article key={c.title} className={c.wide ? `${s.card} ${s.wide}` : s.card} style={{ background: c.bg }}>
        <div className={s.frame}>{c.screen}</div>
        <span className={s.tag}>{c.tag}</span>
        <h3>{c.title}</h3>
        <p>{c.text}</p>
      </article>)}
    </div>
  </section>
}

function Window({ title, action, children }: { title: string; action?: string; children: ReactNode }) {
  return <div className={s.window}>
    <div className={s.windowBar}><span>{title}</span>{action && <b>{action}</b>}</div>
    <div className={s.windowBody}>{children}</div>
  </div>
}

// ---------- shared: assistants ----------

/** Floating app icons around a chat box, like an agents hub. */
export function AgentsScreen({ prompt }: { prompt: string }) {
  const icons: { node: ReactNode; bg: string; x: string; y: string; d: number }[] = [
    { node: <IconBrandOpenai size={40} stroke={1.4} color="#fff" />, bg: '#10a37f', x: '-4%', y: '6%', d: 0 },
    // eslint-disable-next-line @next/next/no-img-element
    { node: <img src="/claudeLogo.svg" alt="" className={s.claudeIcon} />, bg: '#fff', x: '30%', y: '-6%', d: 1.2 },
    { node: <span className={s.ottoIcon}>O</span>, bg: '#fff', x: '62%', y: '30%', d: 0.6 },
    { node: <IconBrandInstagram size={36} stroke={1.6} color="#fff" />, bg: 'linear-gradient(45deg,#f9ce34,#ee2a7b 50%,#6228d7)', x: '16%', y: '34%', d: 1.8 },
    { node: <IconBrandTiktok size={34} stroke={1.6} color="#fff" />, bg: '#111', x: '86%', y: '4%', d: 0.9 },
    { node: <IconBrandWhatsapp size={36} stroke={1.6} color="#fff" />, bg: '#25d366', x: '88%', y: '50%', d: 2.4 },
  ]
  return <div className={s.agents}>
    {icons.map((ic, i) => <span key={i} className={s.floatIcon} style={{ left: ic.x, top: ic.y, background: ic.bg, animationDelay: `-${ic.d}s` }}>{ic.node}</span>)}
    <div className={s.askBox}><span>+</span><em className={s.typing}>{prompt}</em><i className={s.voice}>|||</i></div>
  </div>
}

// ---------- OttoCut screens ----------

export function CutsScreen() {
  const clips = [16, 7, 20, 5, 14, 8, 18]
  return <Window title="Linha do tempo" action="1:12 → 0:38">
    <div className={s.ruler}>{Array.from({ length: 8 }, (_, i) => <span key={i}>0:{String(i * 9).padStart(2, '0')}</span>)}</div>
    <div className={s.track}>
      {clips.map((w, i) => <i key={i} className={i % 2 ? s.cutOut : s.cutIn} style={{ flexGrow: w, animationDelay: `${0.4 + i * 0.25}s` }} />)}
    </div>
    <div className={s.track}><i className={s.audio} /></div>
    <div className={s.playhead} />
    <p className={s.status}><IconCheck size={14} /> 14 pausas e 3 erros removidos</p>
  </Window>
}

export function CaptionsScreen() {
  const words = ['VOCÊ', 'AINDA', 'EDITA', 'NA', 'MÃO?']
  return <div className={s.phoneStage}>
    <div className={s.phone}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ottocut/presenter.jpg" alt="" />
      <div className={s.caption}>{words.map((w, i) => <span key={w} style={{ animationDelay: `${i * 0.45}s` }}>{w}</span>)}</div>
    </div>
    <div className={s.stylePicker}>
      {['Clássica', 'Destaque amarelo', 'Marca-texto'].map((l, i) => <span key={l} className={i === 1 ? s.styleOn : undefined}>{l}</span>)}
    </div>
  </div>
}

export function PolishScreen() {
  return <Window title="Acabamento" action="Aplicar">
    <div className={s.polish}>
      <div className={s.zoomBox}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ottocut/presenter.jpg" alt="" />
      </div>
      <div className={s.sliders}>
        {[['Zoom', '112%'], ['Cor', '+12%'], ['Luz', '+6%']].map(([l, v], i) => <div key={l} className={s.slider}>
          <span>{l}<b>{v}</b></span><i><em style={{ animationDelay: `${i * 0.4}s` }} /></i>
        </div>)}
        <div className={s.eq}><IconMusic size={16} />{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ animationDelay: `-${(i * 0.13) % 0.9}s` }} />)}</div>
      </div>
    </div>
  </Window>
}

export function ExportScreen() {
  return <Window title="Exportar" action="Baixar">
    <div className={s.formats}>
      <div className={s.format}><span className={s.f916} /><b>9:16</b><small>Reels · TikTok · Shorts</small></div>
      <div className={s.format}><span className={s.f45} /><b>4:5</b><small>Feed</small></div>
    </div>
    <div className={s.progress}><i /></div>
    <div className={s.platforms}>
      {[{ I: IconBrandInstagram, bg: 'linear-gradient(45deg,#f9ce34,#ee2a7b 50%,#6228d7)' }, { I: IconBrandTiktok, bg: '#111' }, { I: IconBrandYoutube, bg: '#ff0033' }].map(({ I, bg }, i) => <span key={i} style={{ background: bg }}><I size={18} color="#fff" /></span>)}
      <p><IconCheck size={14} /> pronto para postar</p>
    </div>
  </Window>
}

// ---------- OttoGestão screens ----------

export function PayablesScreen() {
  const rows = [['Enel Distribuição SP', '05/11', 'R$ 1.482,40'], ['Imobiliária Lar', '08/11', 'R$ 7.800,00'], ['Fornecedor Alfa', '12/11', 'R$ 3.240,00'], ['Unimed', '15/11', 'R$ 5.460,00'], ['Receita Federal · DAS', '20/11', 'R$ 9.860,15']]
  return <Window title="Contas a pagar" action="+ Nova conta">
    {rows.map(([n, d, v], i) => <div key={n} className={s.row}>
      <span className={s.rowName}>{n}<small>vence {d}</small></span>
      <span className={s.rowValue}>{v}</span>
      <span className={s.pill} style={{ animationDelay: `${0.5 + i * 0.6}s` }}><b className={s.due}>a vencer</b><b className={s.paidText}>pago ✓</b></span>
    </div>)}
  </Window>
}

export function ReconcileScreen() {
  const pairs = [['TED CLIENTE NORTE', 'Mensalidade Cliente Norte', '+ 8.900,00'], ['PIX MERCADO SUL', 'Venda 0321 · Mercado Sul', '+ 7.450,00'], ['BOLETO IMOB LAR', 'Aluguel da unidade', '− 4.800,00'], ['TAR TED 0001', 'Tarifas bancárias', '− 18,00']]
  return <Window title="Conciliação · Banco Inter" action="Conciliar tudo">
    <div className={s.reconHead}><span>Extrato</span><span>Lançamento</span></div>
    {pairs.map(([a, b, v], i) => <div key={a} className={s.recon} style={{ animationDelay: `${0.4 + i * 0.55}s` }}>
      <span>{a}<small>{v}</small></span><i className={s.link}><IconCheck size={13} /></i><span>{b}</span>
    </div>)}
  </Window>
}

export function DreScreen() {
  const bars = [['Receita', 100, '#3ddc84'], ['Custos', 38, '#38d6f5'], ['Pessoal', 46, '#a78bfa'], ['Administrativas', 22, '#4f8cff'], ['Comerciais', 14, '#ff5fa2'], ['Resultado', 28, '#c6f432']] as const
  return <Window title="DRE · novembro" action={undefined}>
    <div className={s.dre}>
      {bars.map(([l, w, c], i) => <div key={l} className={s.dreRow}>
        <span>{l}</span><i><em style={{ width: `${w}%`, background: c, animationDelay: `${i * 0.25}s` }} /></i>
      </div>)}
    </div>
    <p className={s.status}><IconFileSpreadsheet size={14} /> montado a partir dos lançamentos, sem planilha</p>
  </Window>
}

export function SecurityScreen() {
  const log = [['Ana', 'confirmou baixa · Fornecedor Alfa'], ['Otto (ChatGPT)', 'preparou 12 classificações'], ['Bruno', 'aprovou classificações'], ['Otto (Claude)', 'conciliou 4 lançamentos']]
  return <Window title="Confirmar operação" action="Confirmar">
    <div className={s.confirm}><IconShieldLock size={18} /><span>Registrar pagamento de <b>R$ 3.240,00</b> para Fornecedor Alfa?</span></div>
    <div className={s.perms}>{['Financeiro: editar', 'Vendas: ver', 'Relatórios: ver'].map(p => <span key={p}>{p}</span>)}</div>
    <div className={s.log}>
      {log.map(([who, what], i) => <p key={i} style={{ animationDelay: `${0.5 + i * 0.7}s` }}><b>{who}</b> {what}</p>)}
    </div>
  </Window>
}
