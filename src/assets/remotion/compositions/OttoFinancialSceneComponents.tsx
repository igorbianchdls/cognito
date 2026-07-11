import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { IOS_REMOTION_FONT_STACK, loadSfProFonts } from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const OTTO_FINANCIAL_SCENE_COMPONENT_DURATION = 170

const FONT = IOS_REMOTION_FONT_STACK

function p(frame: number, from: number, to: number, out: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], out, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

function Shell({ children, kicker, title }: { children: ReactNode; kicker: string; title: string }) {
  return (
    <AbsoluteFill style={{ background: '#f7f8fa', color: '#111827', fontFamily: FONT, overflow: 'hidden' }}>
      <div style={{ left: 62, position: 'absolute', right: 62, top: 46 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
          <span style={{ background: '#111827', borderRadius: 999, display: 'block', height: 10, width: 10 }} />
          <span style={{ color: '#667085', fontSize: 18, fontWeight: 720, letterSpacing: 0.4, textTransform: 'uppercase' }}>{kicker}</span>
        </div>
        <h1 style={{ color: '#111827', fontSize: 42, fontWeight: 780, letterSpacing: -0.2, lineHeight: 1.05, margin: '12px 0 0' }}>{title}</h1>
      </div>
      {children}
    </AbsoluteFill>
  )
}

function OttoMark() {
  return (
    <div style={{ alignItems: 'center', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 18, boxShadow: '0 18px 42px rgba(15, 23, 42, 0.08)', display: 'grid', height: 74, justifyItems: 'center', width: 74 }}>
      <div style={{ display: 'grid', gap: 4, gridTemplateColumns: 'repeat(2, 12px)' }}>
        {[0, 1, 2, 3].map((item) => <span key={item} style={{ background: item % 2 === 0 ? '#111827' : '#5aa889', borderRadius: 3, display: 'block', height: 12, width: 12 }} />)}
      </div>
    </div>
  )
}

function IconBadge({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ alignItems: 'center', background: color, borderRadius: 14, color: '#ffffff', display: 'flex', flexShrink: 0, fontSize: 17, fontWeight: 820, height: 46, justifyContent: 'center', letterSpacing: -0.2, width: 46 }}>{label}</span>
  )
}

function StatusPill({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'red' | 'amber' | 'blue' | 'slate' }) {
  const colors = {
    amber: ['#fff7ed', '#c2410c'],
    blue: ['#eff6ff', '#2563eb'],
    green: ['#ecfdf3', '#166534'],
    red: ['#fff1f2', '#be123c'],
    slate: ['#f1f5f9', '#475569'],
  } as const
  const [bg, color] = colors[tone]

  return <span style={{ background: bg, borderRadius: 999, color, fontSize: 15, fontWeight: 760, padding: '8px 12px', whiteSpace: 'nowrap' }}>{children}</span>
}

function MiniCursor({ frame, path }: { frame: number; path: Array<[number, number, number]> }) {
  const xs = path.map((point) => point[0])
  const ys = path.map((point) => point[1])
  const times = path.map((point) => point[2])
  const x = interpolate(frame, times, xs, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const y = interpolate(frame, times, ys, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const click = p(frame, times[times.length - 1] - 10, times[times.length - 1])

  return (
    <div style={{ left: x, position: 'absolute', top: y, transform: `scale(${1 - Math.sin(click * Math.PI) * 0.12})`, zIndex: 30 }}>
      <svg fill="none" height="42" viewBox="0 0 84 84" width="42">
        <path d="M18 10L62 48L44 52L35 72L18 10Z" fill="#111827" stroke="#ffffff" strokeLinejoin="round" strokeWidth="4" />
      </svg>
    </div>
  )
}

const timelineSteps = [
  ['Recebe pedido', 'Pagamento acima da regra detectado', '09:12', '#2563eb'],
  ['Consulta dados', 'ERP, banco e historico do fornecedor', '09:13', '#0f766e'],
  ['Decide caminho', 'Risco baixo, mas exige confirmacao', '09:14', '#c2410c'],
  ['Pede aprovacao', 'Humano confirma antes da execucao', '09:15', '#7c3aed'],
  ['Executa e registra', 'Pagamento agendado com trilha salva', '09:16', '#16a34a'],
]

export function OttoDecisionTimelineScene() {
  const frame = useCurrentFrame()

  return (
    <Shell kicker="Controle de decisao" title="A IA mostra o caminho antes de executar">
      <div style={{ alignItems: 'center', bottom: 58, display: 'grid', gridTemplateColumns: '280px 1fr', left: 62, position: 'absolute', right: 62, top: 150 }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <OttoMark />
          <div style={{ color: '#111827', fontSize: 30, fontWeight: 780, lineHeight: 1.1 }}>Pagamento sensivel</div>
          <div style={{ color: '#667085', fontSize: 20, fontWeight: 500, lineHeight: 1.38 }}>Otto explica dados consultados, regra aplicada e ponto de aprovacao humana.</div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 28, boxShadow: '0 26px 72px rgba(15, 23, 42, 0.10)', display: 'grid', gap: 0, padding: 28 }}>
          {timelineSteps.map(([title, description, time, color], index) => {
            const itemIn = p(frame, 14 + index * 18, 34 + index * 18)
            return (
              <div key={title} style={{ alignItems: 'center', display: 'grid', gap: 18, gridTemplateColumns: '58px 1fr auto', minHeight: 82, opacity: itemIn, transform: `translateX(${(1 - itemIn) * 28}px)` }}>
                <span style={{ alignItems: 'center', background: color, borderRadius: 999, color: '#ffffff', display: 'flex', fontSize: 18, fontWeight: 820, height: 48, justifyContent: 'center', width: 48 }}>{index + 1}</span>
                <div>
                  <div style={{ color: '#111827', fontSize: 24, fontWeight: 760 }}>{title}</div>
                  <div style={{ color: '#667085', fontSize: 17, fontWeight: 500, marginTop: 5 }}>{description}</div>
                </div>
                <StatusPill tone={index === 2 ? 'amber' : index === 4 ? 'green' : 'blue'}>{time}</StatusPill>
              </div>
            )
          })}
        </div>
      </div>
    </Shell>
  )
}

const exceptions = [
  ['NF sem pedido', 'Fornecedor Beta', 'Documento sem PO', 'Alta', '#be123c'],
  ['Pagamento fora do padrao', 'AWS Brasil', 'R$ 12.790 acima da media', 'Revisar', '#c2410c'],
  ['Imposto vencendo', 'DAS mensal', 'vence hoje as 17h', 'Urgente', '#dc2626'],
  ['Cliente atrasado', 'Cliente Norte', 'R$ 42.100 em aberto', 'Cobrar', '#7c3aed'],
  ['Conta duplicada', 'Meta Ads', 'duas faturas parecidas', 'Checar', '#2563eb'],
]

export function OttoExceptionQueueScene() {
  const frame = useCurrentFrame()

  return (
    <Shell kicker="Fila de excecoes" title="Otto resolve o comum e separa o que pede atencao">
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 26px 72px rgba(15, 23, 42, 0.10)', left: 62, overflow: 'hidden', position: 'absolute', right: 62, top: 158 }}>
        <div style={{ alignItems: 'center', borderBottom: '1px solid #eef0f2', display: 'flex', justifyContent: 'space-between', padding: '24px 30px' }}>
          <div>
            <div style={{ color: '#111827', fontSize: 27, fontWeight: 800 }}>Excecoes que precisam de decisao</div>
            <div style={{ color: '#667085', fontSize: 17, fontWeight: 500, marginTop: 5 }}>Financeiro, fiscal, cobranca e documentos em uma fila priorizada</div>
          </div>
          <StatusPill tone="red">5 itens abertos</StatusPill>
        </div>
        {exceptions.map(([title, owner, description, action, color], index) => {
          const itemIn = p(frame, 14 + index * 16, 32 + index * 16)
          const resolved = frame > 104 + index * 8
          return (
            <div key={title} style={{ alignItems: 'center', borderTop: index === 0 ? '0 solid transparent' : '1px solid #f1f3f5', display: 'grid', gap: 18, gridTemplateColumns: '52px 1.2fr 1fr auto', margin: '0 30px', minHeight: 84, opacity: itemIn, transform: `translateY(${(1 - itemIn) * 14}px)` }}>
              <IconBadge color={color} label={title.slice(0, 2).toUpperCase()} />
              <div>
                <div style={{ color: '#111827', fontSize: 22, fontWeight: 740 }}>{title}</div>
                <div style={{ color: '#667085', fontSize: 16, fontWeight: 500, marginTop: 4 }}>{description}</div>
              </div>
              <div style={{ color: '#475467', fontSize: 19, fontWeight: 620 }}>{owner}</div>
              <StatusPill tone={resolved ? 'green' : index < 3 ? 'amber' : 'blue'}>{resolved ? 'Encaminhado' : action}</StatusPill>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

const auditRows = [
  ['09:12', 'Usuario pediu revisao', 'Prompt recebido no ChatGPT', 'Ana'],
  ['09:13', 'Otto consultou ERP', 'Conta Azul, Omie e banco', 'Otto'],
  ['09:14', 'Regra aplicada', 'Aprovacao acima de R$ 1.000', 'Otto'],
  ['09:15', 'Aprovacao registrada', '3 pagamentos autorizados', 'Ana'],
  ['09:16', 'Execucao feita', 'Agendamento e comprovantes salvos', 'Otto'],
]

export function OttoAuditTrailScene() {
  const frame = useCurrentFrame()

  return (
    <Shell kicker="Audit trail" title="Cada acao fica rastreavel, com origem e aprovacao">
      <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 26px 72px rgba(15, 23, 42, 0.10)', left: 62, overflow: 'hidden', position: 'absolute', right: 62, top: 160 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1.4fr 120px', padding: '22px 30px' }}>
          {['Hora', 'Evento', 'Detalhe', 'Autor'].map((item) => <span key={item} style={{ color: '#8a94a6', fontSize: 15, fontWeight: 800, textTransform: 'uppercase' }}>{item}</span>)}
        </div>
        {auditRows.map(([time, event, detail, actor], index) => {
          const itemIn = p(frame, 16 + index * 18, 32 + index * 18)
          return (
            <div key={event} style={{ alignItems: 'center', borderTop: '1px solid #eef0f2', display: 'grid', gridTemplateColumns: '120px 1fr 1.4fr 120px', minHeight: 82, opacity: itemIn, padding: '0 30px', transform: `translateX(${(1 - itemIn) * 24}px)` }}>
              <span style={{ color: '#475467', fontSize: 20, fontWeight: 720 }}>{time}</span>
              <span style={{ color: '#111827', fontSize: 22, fontWeight: 740 }}>{event}</span>
              <span style={{ color: '#667085', fontSize: 18, fontWeight: 500 }}>{detail}</span>
              <StatusPill tone={actor === 'Otto' ? 'green' : 'blue'}>{actor}</StatusPill>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

const handoffAgents = [
  ['Financeiro', 'classifica despesas e concilia bancos', '#2563eb'],
  ['Fiscal', 'valida notas, XML e impostos', '#c2410c'],
  ['Cobranca', 'prioriza clientes atrasados', '#7c3aed'],
  ['Relatorios', 'gera dashboard e resumo executivo', '#16a34a'],
]

export function OttoMultiAgentHandoffScene() {
  const frame = useCurrentFrame()

  return (
    <Shell kicker="Multi-agent handoff" title="Um agente termina e passa contexto para o proximo">
      <div style={{ alignItems: 'center', bottom: 58, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, left: 62, position: 'absolute', right: 62, top: 186 }}>
        {handoffAgents.map(([name, description, color], index) => {
          const itemIn = p(frame, 12 + index * 22, 34 + index * 22)
          const active = frame > 28 + index * 28
          return (
            <div key={name} style={{ background: active ? '#ffffff' : '#fbfcfd', border: `1px solid ${active ? '#d9e2ec' : '#edf1f5'}`, borderRadius: 28, boxShadow: active ? '0 24px 64px rgba(15, 23, 42, 0.10)' : 'none', height: 340, opacity: itemIn, padding: 24, position: 'relative', transform: `translateY(${(1 - itemIn) * 34}px)` }}>
              <IconBadge color={color} label={name.slice(0, 2).toUpperCase()} />
              <div style={{ color: '#111827', fontSize: 28, fontWeight: 820, marginTop: 24 }}>{name}</div>
              <div style={{ color: '#667085', fontSize: 18, fontWeight: 500, lineHeight: 1.35, marginTop: 10 }}>{description}</div>
              <div style={{ bottom: 24, left: 24, position: 'absolute', right: 24 }}>
                <StatusPill tone={active ? 'green' : 'slate'}>{active ? 'Contexto recebido' : 'Aguardando'}</StatusPill>
              </div>
              {index < handoffAgents.length - 1 ? <div style={{ background: '#cbd5e1', height: 2, position: 'absolute', right: -18, top: 170, width: 18 }} /> : null}
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

const inboxItems = [
  ['Contrato Cliente Norte', 'Contrato', '#2563eb'],
  ['Boleto Fornecedor Beta', 'Boleto', '#c2410c'],
  ['NF Shopify pedidos', 'Nota fiscal', '#16a34a'],
  ['Comprovante Google Ads', 'Comprovante', '#4285f4'],
  ['Anexo contabil maio', 'Contabilidade', '#7c3aed'],
  ['Pendencia juridica', 'Revisao', '#111827'],
]

export function OttoAdminInboxZeroScene() {
  const frame = useCurrentFrame()

  return (
    <Shell kicker="Inbox zero administrativo" title="Documentos entram baguncados e saem organizados">
      <div style={{ bottom: 58, display: 'grid', gap: 28, gridTemplateColumns: '1fr 1fr', left: 62, position: 'absolute', right: 62, top: 168 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 20px 56px rgba(15,23,42,0.08)', padding: 26 }}>
          <div style={{ color: '#111827', fontSize: 27, fontWeight: 800 }}>Entrada</div>
          <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
            {inboxItems.map(([name, type, color], index) => {
              const itemIn = p(frame, 12 + index * 9, 28 + index * 9)
              return (
                <div key={name} style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #eef0f2', borderRadius: 18, display: 'grid', gap: 14, gridTemplateColumns: '46px 1fr auto', opacity: itemIn, padding: 14, transform: `translateX(${(1 - itemIn) * -20}px)` }}>
                  <IconBadge color={color} label={type.slice(0, 2).toUpperCase()} />
                  <span style={{ color: '#111827', fontSize: 19, fontWeight: 680 }}>{name}</span>
                  <StatusPill tone="slate">Novo</StatusPill>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 20px 56px rgba(15,23,42,0.08)', padding: 26 }}>
          <div style={{ color: '#111827', fontSize: 27, fontWeight: 800 }}>Pastas prontas</div>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr', marginTop: 24 }}>
            {['Contratos', 'Boletos', 'Notas fiscais', 'Comprovantes', 'Contabilidade', 'Pendencias'].map((folder, index) => {
              const itemIn = p(frame, 74 + index * 8, 94 + index * 8)
              return (
                <div key={folder} style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 20, color: '#166534', fontSize: 20, fontWeight: 760, opacity: itemIn, padding: 20, transform: `translateY(${(1 - itemIn) * 18}px)` }}>
                  {folder}
                  <div style={{ color: '#3f7f5a', fontSize: 15, fontWeight: 650, marginTop: 8 }}>Organizado</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Shell>
  )
}

const leakRows = [
  ['Frete', '+18%', 'R$ 12.400 de impacto', 'red'],
  ['Midia paga', '+9%', 'CPL subiu em 3 campanhas', 'amber'],
  ['Inadimplencia', 'R$ 42.100', 'Cliente Norte em atraso', 'red'],
  ['Assinaturas', 'R$ 3.800', 'planos duplicados detectados', 'blue'],
]

export function OttoMarginLeakInsightScene() {
  const frame = useCurrentFrame()
  const reveal = p(frame, 24, 64)

  return (
    <Shell kicker="Insight reveal" title="Otto mostra onde a empresa esta perdendo dinheiro">
      <div style={{ bottom: 58, display: 'grid', gap: 28, gridTemplateColumns: '0.9fr 1.1fr', left: 62, position: 'absolute', right: 62, top: 168 }}>
        <div style={{ background: '#111827', borderRadius: 30, boxShadow: '0 26px 72px rgba(15, 23, 42, 0.18)', color: '#ffffff', padding: 30 }}>
          <div style={{ color: '#cbd5e1', fontSize: 18, fontWeight: 700 }}>Margem projetada</div>
          <div style={{ fontSize: 74, fontWeight: 860, letterSpacing: -1, marginTop: 12 }}>{Math.round(interpolate(reveal, [0, 1], [31, 24]))}%</div>
          <div style={{ color: '#fca5a5', fontSize: 24, fontWeight: 760, marginTop: 10 }}>queda de 7 p.p. no mes</div>
          <div style={{ background: '#263244', borderRadius: 18, height: 170, marginTop: 40, overflow: 'hidden', padding: 20 }}>
            <svg height="130" viewBox="0 0 440 130" width="100%">
              <path d="M0 98 C70 54 105 80 150 62 C205 40 240 92 292 76 C342 61 376 91 440 36" fill="none" stroke="#94a3b8" strokeWidth="5" />
              <path d="M0 98 C70 54 105 80 150 62 C205 40 240 92 292 76 C342 61 376 91 440 36" fill="none" stroke="#22c55e" strokeDasharray={`${reveal * 620} 620`} strokeLinecap="round" strokeWidth="6" />
            </svg>
          </div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 30, boxShadow: '0 26px 72px rgba(15, 23, 42, 0.10)', padding: 28 }}>
          <div style={{ color: '#111827', fontSize: 29, fontWeight: 820 }}>Principais vazamentos</div>
          <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
            {leakRows.map(([name, value, description, tone], index) => {
              const itemIn = p(frame, 50 + index * 16, 70 + index * 16)
              return (
                <div key={name} style={{ alignItems: 'center', background: '#f8fafc', border: '1px solid #eef0f2', borderRadius: 20, display: 'grid', gap: 18, gridTemplateColumns: '1fr auto', opacity: itemIn, padding: 20, transform: `translateX(${(1 - itemIn) * 20}px)` }}>
                  <div>
                    <div style={{ color: '#111827', fontSize: 22, fontWeight: 760 }}>{name}</div>
                    <div style={{ color: '#667085', fontSize: 16, fontWeight: 500, marginTop: 5 }}>{description}</div>
                  </div>
                  <StatusPill tone={tone as 'red' | 'amber' | 'blue'}>{value}</StatusPill>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <MiniCursor frame={frame} path={[[990, 520, 100], [1030, 454, 126]]} />
    </Shell>
  )
}
