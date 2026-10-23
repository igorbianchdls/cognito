import { Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, FileCheck2, FileSearch, ListChecks, Package, Sparkles, Trash2, Undo2, User, Users } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { MentionBubble } from './ChatGptMention'
import type { MentionMessage } from './ChatGptMention'
import { ChatGptScreenReel, screenReelDuration } from './ChatGptScreenReelKit'
import type { Scene } from './ChatGptScreenReelKit'
import { AssistantText, CardHeader, CardShell, DONE_OK, DoneView, GREEN, IconTile, LINE, MUTED, TEXT, addTile, editTile, iv, p, pop } from './ChatGptVendasCardReplica'
import { makeHookScene } from './OttoNotaFiscalChatGptVideos'

/**
 * Reel (no narration yet): one request, the AI runs several CRUD operations in a row without asking for
 * confirmation — "Vou criar o cliente…" → final card → "Cliente criado." — clients, products and the batch invoices.
 * Everything runs on its own clock (replica frame = reel frame after the hook).
 */

const MSG: MentionMessage = {
  lines: ['cadastra a Nova Empresa Ltda.', 'de Recife, cria o produto Cadeira', 'Ergonômica a R$ 890, atualiza o e-mail', 'do Cliente Exemplo, exclui o Cliente', 'Antigo Ltda. e emite as notas fiscais', 'das vendas de hoje'],
  send: 284,
  typing: [130, 280],
}

/** Document positions of the conversation (before scrolling). */
/** Height of the batch invoices card. */
const NF_H = 2244

const Y = {
  bubble: 230,
  ops: [
    { card: 720, done: 1580, say: 640 },
    { card: 1810, done: 2670, say: 1680 },
    { card: 2900, done: 3760, say: 2770 },
    { card: 3990, done: 4830, say: 3860 },
  ],
  nf: { card: 5060, done: 5060 + NF_H + 40, say: 4930 },
  wrap: 5060 + NF_H + 140,
}

/** Frame each operation starts: announce → card (+26) → "done" line (+80). */
const OPS = [310, 420, 530, 640]
/** Batch invoices: a taller card, so it gets more time (and scrolls through). */
const NF_OP = 750
const NF_CARD = NF_OP + 26
const WRAP = 970
/** Updated client list after the wrap-up line. */
const LIST = WRAP + 40
const LIST_Y = { card: Y.wrap + 220, say: Y.wrap + 140 }
const LIST_H = 846

const CLIENT_ROWS = [
  { badge: ['Novo', '#e7f0fb', '#285d96'], city: 'Recife', id: 'CLI-004', name: 'Nova Empresa Ltda.', type: 'Pessoa jurídica' },
  { badge: ['Atualizado', '#fff4d9', '#71541a'], city: 'Recife', id: 'CLI-001', name: 'Cliente Exemplo Ltda.', type: 'Pessoa jurídica' },
  { badge: ['Ativo', '#e6f4ea', '#1a7f37'], city: 'Olinda', id: 'CLI-002', name: 'Maria Souza', type: 'Pessoa física' },
]

/** Same UI as the clients list of the replica, with the result of the operations (Cliente Antigo is gone). */
function ClientListCard({ frame }: { frame: number }) {
  const fade = (at: number): CSSProperties => {
    const s = pop(frame, at)
    return { opacity: frame < at ? 0 : s, transform: `translateY(${(1 - s) * 18}px)` }
  }
  return (
    <CardShell frame={frame} height={LIST_H} start={LIST + 20} top={LIST_Y.card}>
      <div style={{ padding: '0 31px 30px' }}>
        <div style={{ alignItems: 'flex-start', display: 'flex', justifyContent: 'space-between', paddingTop: 32 }}>
          <div>
            <span style={{ color: TEXT, display: 'block', fontSize: 41, fontWeight: 650, letterSpacing: '-0.01em', lineHeight: '48px' }}>Clientes</span>
            <span style={{ color: MUTED, display: 'block', fontSize: 28, lineHeight: '34px', marginTop: 8 }}>3 clientes ativos</span>
          </div>
          <Users color="#5b5b5b" size={32} strokeWidth={2} style={iv(32, 2, { marginTop: 32 })} />
        </div>
        <div style={{ marginTop: 18 }}>
          {CLIENT_ROWS.map((c, i) => (
            <div key={c.id} style={{ alignItems: 'center', borderBottom: `2px solid ${LINE}`, display: 'flex', gap: 26, height: 190, ...fade(LIST + 30 + i * 12) }}>
              <IconTile>
                <User color="#5b5b5b" size={32} strokeWidth={2} style={iv(32, 2)} />
              </IconTile>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: TEXT, display: 'block', fontSize: 33, fontWeight: 650, letterSpacing: '-0.01em' }}>{c.name}</span>
                <span style={{ color: MUTED, display: 'block', fontSize: 28, marginTop: 6 }}>{c.id} · {c.type}</span>
                <span style={{ color: MUTED, display: 'block', fontSize: 27, marginTop: 6 }}>{c.city}</span>
              </div>
              <span style={{ background: c.badge[1], borderRadius: 99, color: c.badge[2], fontSize: 26, fontWeight: 500, marginBottom: 60, padding: '8px 17px' }}>{c.badge[0]}</span>
            </div>
          ))}
        </div>
        <div style={{ alignItems: 'center', display: 'flex', height: 60, justifyContent: 'space-between', marginTop: 34, ...fade(LIST + 66) }}>
          <span style={{ color: MUTED, fontSize: 28 }}>1–3 de 3 clientes</span>
          <span style={{ alignItems: 'center', display: 'flex', gap: 16 }}>
            <span style={{ alignItems: 'center', border: `2px solid ${LINE}`, borderRadius: 99, display: 'flex', height: 60, justifyContent: 'center', width: 98 }}>
              <ChevronLeft color="#9a9a9a" size={32} strokeWidth={2} style={iv(32, 2)} />
            </span>
            <span style={{ color: TEXT, fontSize: 30, fontWeight: 600 }}>1 / 1</span>
            <span style={{ alignItems: 'center', border: `2px solid ${LINE}`, borderRadius: 99, display: 'flex', height: 60, justifyContent: 'center', width: 98 }}>
              <ChevronRight color="#9a9a9a" size={32} strokeWidth={2} style={iv(32, 2)} />
            </span>
          </span>
        </div>
      </div>
    </CardShell>
  )
}

const productTile = (
  <IconTile size={88}>
    <Package color="#4a4a4a" size={34} strokeWidth={2} style={iv(34, 2)} />
  </IconTile>
)

const deleteTile = (
  <IconTile size={88}>
    <Trash2 color="#4a4a4a" size={34} strokeWidth={2} style={iv(34, 2)} />
  </IconTile>
)

/** Final state only, like the print: no form, no confirmation. */
function DeletedClientCard({ frame, start, top }: { frame: number; start: number; top: number }) {
  const at = (delay: number): CSSProperties => {
    const s = pop(frame, start + delay)
    return { opacity: frame < start + delay ? 0 : s, transform: `translateY(${(1 - s) * 16}px)` }
  }
  return (
    <CardShell frame={frame} height={800} start={start} top={top}>
      <div style={{ padding: '0 31px' }}>
        <CardHeader icon={deleteTile} subtitle="Operação concluída" title="Cliente excluído" />
        <div style={{ background: LINE, height: 2 }} />
        <div style={{ display: 'flex', gap: 18, marginTop: 46, ...at(10) }}>
          <svg height={38} style={{ flex: 'none', marginTop: 8 }} viewBox="0 0 60 60" width={38}>
            <circle cx={30} cy={30} fill="none" pathLength={1} r={26} stroke={GREEN} strokeDasharray={1} strokeDashoffset={1 - p(frame, start + 10, start + 24)} strokeWidth={5} transform="rotate(-90 30 30)" />
            <path d="M19 31 l7 7 l15 -16" fill="none" pathLength={1} stroke={GREEN} strokeDasharray={1} strokeDashoffset={1 - p(frame, start + 20, start + 30)} strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} />
          </svg>
          <div>
            <span style={{ color: TEXT, display: 'block', fontSize: 33, fontWeight: 650, letterSpacing: '-0.01em' }}>Exclusão realizada com sucesso</span>
            <span style={{ color: MUTED, display: 'block', fontSize: 25, marginTop: 10 }}>Nenhuma confirmação adicional necessária</span>
          </div>
        </div>
        <div style={{ background: '#f2f2f2', borderRadius: 28, marginTop: 34, padding: '24px 24px 12px', ...at(20) }}>
          <div style={{ alignItems: 'center', display: 'flex', gap: 26 }}>
            <span style={{ alignItems: 'center', background: '#fff', borderRadius: 22, display: 'flex', height: 84, justifyContent: 'center', width: 84 }}>
              <User color="#5b5b5b" size={30} strokeWidth={2} style={iv(30, 2)} />
            </span>
            <div>
              <span style={{ color: TEXT, display: 'block', fontSize: 31, fontWeight: 650 }}>Cliente Antigo Ltda.</span>
              <span style={{ color: MUTED, display: 'block', fontSize: 26, marginTop: 10 }}>Cliente #CLI-003</span>
            </div>
          </div>
          <div style={{ background: '#e2e2e2', height: 2, marginTop: 26 }} />
          {[
            ['Situação', 'Excluído'],
            ['Tipo de operação', 'Exclusão lógica'],
          ].map(([label, value]) => (
            <div key={label} style={{ alignItems: 'center', display: 'flex', height: 64, justifyContent: 'space-between' }}>
              <span style={{ color: MUTED, fontSize: 29 }}>{label}</span>
              <span style={{ color: TEXT, fontSize: 29, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 36, color: '#3d3d3d', display: 'flex', fontSize: 27, fontWeight: 500, gap: 14, height: 70, justifyContent: 'center', marginTop: 26, ...at(28) }}>
          <Undo2 color="#3d3d3d" size={28} strokeWidth={2} style={iv(28, 2)} /> Desfazer exclusão
        </div>
      </div>
    </CardShell>
  )
}

const NOTES = [
  { client: 'Clínica Horizonte Ltda.', number: 'NFS-e #501', sale: 'Venda #2031', value: 'R$ 1.500,00' },
  { client: 'Agência Atlas Ltda.', number: 'NFS-e #502', sale: 'Venda #2032', value: 'R$ 850,00' },
  { client: 'Marina Oliveira', number: 'NFS-e #503', sale: 'Venda #2033', value: 'R$ 430,00' },
]

const DID = ['Identificou as 3 vendas e seus respectivos clientes e serviços.', 'Preparou os dados necessários para a emissão fiscal.', 'Validou e emitiu as 3 NFS-e.', 'Organizou os resultados por venda e cliente.']

const notesTile = (
  <IconTile size={88}>
    <FileCheck2 color="#4a4a4a" size={34} strokeWidth={2} style={iv(34, 2)} />
  </IconTile>
)

function OutlineButton({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ alignItems: 'center', border: '2px solid #d9d9d9', borderRadius: 36, color: '#3d3d3d', display: 'flex', fontSize: 28, fontWeight: 500, gap: 16, height: 72, justifyContent: 'center', marginTop: 24, ...style }}>{children}</div>
}

/** "Notas fiscais emitidas" — final state of the automatic batch issuance (like the print). */
function IssuedNotesCard({ frame }: { frame: number }) {
  const start = NF_CARD
  const at = (delay: number): CSSProperties => {
    const s = pop(frame, start + delay)
    return { opacity: frame < start + delay ? 0 : s, transform: `translateY(${(1 - s) * 16}px)` }
  }
  return (
    <CardShell frame={frame} height={NF_H} start={start} top={Y.nf.card}>
      <div style={{ padding: '0 22px' }}>
        <CardHeader icon={notesTile} subtitle="OTTO IA · Emissão automática em lote" title="Notas fiscais emitidas" />
        <div style={{ background: LINE, height: 2 }} />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
          <svg height={60} viewBox="0 0 60 60" width={60}>
            <circle cx={30} cy={30} fill="none" pathLength={1} r={26} stroke={GREEN} strokeDasharray={1} strokeDashoffset={1 - p(frame, start + 8, start + 22)} strokeWidth={4.5} transform="rotate(-90 30 30)" />
            <path d="M19 31 l7 7 l15 -16" fill="none" pathLength={1} stroke={GREEN} strokeDasharray={1} strokeDashoffset={1 - p(frame, start + 18, start + 28)} strokeLinecap="round" strokeLinejoin="round" strokeWidth={4.5} />
          </svg>
        </div>
        <div style={{ textAlign: 'center', ...at(18) }}>
          <span style={{ color: TEXT, display: 'block', fontSize: 37, fontWeight: 650, letterSpacing: '-0.01em', marginTop: 24 }}>3 notas emitidas</span>
          <span style={{ color: MUTED, display: 'block', fontSize: 27, lineHeight: '40px', marginTop: 14 }}>A IA processou automaticamente as 3 notas fiscais, sem necessidade de revisão manual.</span>
        </div>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', marginTop: 34, ...at(24) }}>
          {[
            ['Notas emitidas', '3 de 3', '100% processadas', GREEN],
            ['Valor total', 'R$ 2.780,00', '3 vendas faturadas', TEXT],
          ].map(([label, value, sub, color]) => (
            <div key={label} style={{ background: '#f2f2f2', borderRadius: 28, height: 188, padding: '26px 24px 0' }}>
              <span style={{ color: MUTED, display: 'block', fontSize: 25 }}>{label}</span>
              <span style={{ color, display: 'block', fontSize: 40, fontWeight: 650, letterSpacing: '-0.01em', marginTop: 10 }}>{value}</span>
              <span style={{ color: MUTED, display: 'block', fontSize: 25, marginTop: 10 }}>{sub}</span>
            </div>
          ))}
        </div>
        <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginTop: 34, ...at(32) }}>
          <span style={{ color: TEXT, fontSize: 31, fontWeight: 650 }}>Notas fiscais emitidas</span>
          <span style={{ background: '#d4eedc', borderRadius: 99, color: GREEN, fontSize: 24, fontWeight: 500, padding: '5px 15px' }}>Concluídas</span>
        </div>
        {NOTES.map((note, i) => {
          const rowAt = 40 + i * 14
          const check = pop(frame, start + rowAt + 6)
          return (
            <div key={note.number} style={{ borderBottom: `2px solid ${LINE}`, display: 'flex', gap: 22, height: 236, paddingTop: 44, ...at(rowAt) }}>
              <span style={{ marginTop: 6, transform: `scale(${frame < start + rowAt + 6 ? 0.6 : check})` }}>
                <CircleCheck color={GREEN} size={34} strokeWidth={2.2} style={iv(34, 2.2)} />
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ color: TEXT, display: 'block', fontSize: 33 }}>{note.number}</span>
                <span style={{ color: MUTED, display: 'block', fontSize: 29, marginTop: 10 }}>{note.client}</span>
                <span style={{ color: MUTED, display: 'block', fontSize: 26, marginTop: 10 }}>{note.sale}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: TEXT, display: 'block', fontSize: 31, fontWeight: 650 }}>{note.value}</span>
                <span style={{ alignItems: 'center', color: GREEN, display: 'flex', fontSize: 27, gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                  Emitida <ChevronDown color="#6b6b6b" size={28} strokeWidth={2} style={iv(28, 2)} />
                </span>
              </div>
            </div>
          )
        })}
        <div style={{ background: '#f2f2f2', borderRadius: 30, marginTop: 40, padding: '30px 26px 6px', ...at(90) }}>
          <span style={{ alignItems: 'center', color: TEXT, display: 'flex', fontSize: 33, fontWeight: 650, gap: 16 }}>
            <Sparkles color={TEXT} size={34} strokeWidth={2} style={iv(34, 2)} /> O que o OTTO fez
          </span>
          {DID.map((line, i) => (
            <div key={line} style={{ display: 'flex', gap: 18, marginTop: 22, ...at(98 + i * 8) }}>
              <Check color={GREEN} size={28} strokeWidth={2.4} style={iv(28, 2.4, { flex: 'none', marginTop: 6 })} />
              <span style={{ color: TEXT, fontSize: 29, lineHeight: '40px' }}>{line}</span>
            </div>
          ))}
          <div style={{ background: '#e2e2e2', height: 2, marginTop: 30 }} />
          <div style={{ alignItems: 'center', display: 'flex', height: 80, justifyContent: 'space-between', ...at(134) }}>
            <span style={{ color: MUTED, fontSize: 29 }}>Emissões pendentes</span>
            <span style={{ color: GREEN, fontSize: 34, fontWeight: 650 }}>0</span>
          </div>
        </div>
        <OutlineButton style={at(140)}>
          <FileSearch color="#3d3d3d" size={30} strokeWidth={2} style={iv(30, 2)} /> Ver detalhes das 3 notas
        </OutlineButton>
        <OutlineButton style={at(146)}>
          <ListChecks color="#3d3d3d" size={30} strokeWidth={2} style={iv(30, 2)} /> Ver etapas do processamento
        </OutlineButton>
      </div>
    </CardShell>
  )
}

const struck = (text: string) => <span style={{ color: MUTED, textDecoration: 'line-through' }}>{text}</span>

/** "Vou criar…" + card + "Cliente criado." for operation `i`. */
function Operation({ card, done, frame, i, say }: { card: ReactNode; done: string; frame: number; i: number; say: string }) {
  const t = OPS[i]
  const y = Y.ops[i]
  return (
    <>
      <AssistantText frame={frame} text={say} top={y.say} window={[t, t + 20]} />
      {card}
      <AssistantText frame={frame} text={done} top={y.done} window={[t + 80, t + 92]} />
    </>
  )
}

function Conversation({ frame }: { frame: number }) {
  const done = (start: number, top: number, props: Omit<Parameters<typeof DoneView>[0], 'frame' | 'start'>) => (
    <CardShell frame={frame} height={820} start={start} top={top}>
      <DoneView frame={frame} start={start} {...props} />
    </CardShell>
  )
  const c = (i: number) => OPS[i] + 26
  return (
    <>
      <MentionBubble at={MSG.send + 2} frame={frame} lines={MSG.lines} top={Y.bubble} />
      <Operation
        card={done(c(0), Y.ops[0].card, {
          back: 'Ver cadastro',
          heading: 'Cliente criado com sucesso',
          icon: addTile,
          rows: [
            ['Cliente', 'Nova Empresa Ltda.'],
            ['Cidade', 'Recife · Pessoa jurídica'],
            ['Resultado', DONE_OK],
          ],
          sub: 'O cadastro já está disponível no Otto.',
          subtitle: 'Operação concluída',
          title: 'Cliente criado',
        })}
        done="Cliente criado."
        frame={frame}
        i={0}
        say="Vou criar o cliente Nova Empresa Ltda."
      />
      <Operation
        card={done(c(1), Y.ops[1].card, {
          back: 'Ver produto',
          heading: 'Produto cadastrado com sucesso',
          icon: productTile,
          rows: [
            ['Produto', 'Cadeira Ergonômica'],
            ['SKU', 'CAD-ERG-01'],
            ['Preço', 'R$ 890,00'],
          ],
          sub: 'Estoque inicial: 12 unidades · Móveis',
          subtitle: 'Operação concluída',
          title: 'Produto criado',
        })}
        done="Produto cadastrado."
        frame={frame}
        i={1}
        say="Agora vou cadastrar o produto Cadeira Ergonômica."
      />
      <Operation
        card={done(c(2), Y.ops[2].card, {
          back: 'Ver cadastro',
          heading: 'Cliente atualizado com sucesso',
          icon: editTile,
          rows: [
            ['Cliente', 'Cliente Exemplo Ltda.'],
            ['E-mail anterior', struck('contato@cliente.example')],
            ['E-mail novo', 'financeiro@cliente.example'],
          ],
          sub: 'As alterações já estão salvas no cadastro.',
          subtitle: 'Operação concluída',
          title: 'Cliente atualizado',
        })}
        done="E-mail atualizado."
        frame={frame}
        i={2}
        say="Agora vou atualizar o e-mail do Cliente Exemplo."
      />
      <Operation card={<DeletedClientCard frame={frame} start={c(3)} top={Y.ops[3].card} />} done="Cliente excluído." frame={frame} i={3} say="Por último, vou excluir o Cliente Antigo Ltda." />
      <AssistantText frame={frame} text="Agora vou emitir as notas fiscais das vendas de hoje." top={Y.nf.say} window={[NF_OP, NF_OP + 20]} />
      <IssuedNotesCard frame={frame} />
      <AssistantText frame={frame} text="3 notas fiscais emitidas." top={Y.nf.done} window={[NF_OP + 190, NF_OP + 202]} />
      <AssistantText frame={frame} text="Pronto! Fiz as 5 alterações no Otto." top={Y.wrap} window={[WRAP, WRAP + 14]} />
      {frame >= WRAP + 16 ? (
        <span style={{ alignItems: 'center', color: GREEN, display: 'flex', fontSize: 26, gap: 10, left: 33, opacity: pop(frame, WRAP + 16), position: 'absolute', top: Y.wrap + 62 }}>
          <CircleCheck color={GREEN} size={26} strokeWidth={2.2} style={iv(26, 2.2)} /> 5 alterações concluídas
        </span>
      ) : null}
      <AssistantText frame={frame} text="Aqui está a sua lista de clientes atualizada:" top={LIST_Y.say} window={[LIST, LIST + 16]} />
      <ClientListCard frame={frame} />
    </>
  )
}

/** Holds ~2s on the full list. */
const END = LIST + 66 + 60

const SCENES: Scene[] = [
  {
    content: (rf) => <Conversation frame={rf} />,
    messages: [MSG],
    // each operation scrolls its announcement to the top; the invoices card is scrolled through
    scroll: [
      ...OPS.map((t, i): [number, number, number] => [t - 6, t + 20, Y.ops[i].say - 200]),
      [NF_OP - 6, NF_OP + 20, Y.nf.say - 200],
      [NF_CARD + 24, NF_CARD + 64, Y.nf.card + 560 - 198], // through the issued notes
      [NF_CARD + 74, NF_CARD + 114, Y.nf.card + NF_H - 1150], // "O que o OTTO fez" + buttons
      [WRAP - 6, WRAP + 20, Y.wrap - 600],
      [LIST - 4, LIST + 24, LIST_Y.say - 200],
    ],
    scroll0: 0,
    start: 0,
    warp: [
      [0, 0],
      [END / 30, END],
    ],
  },
]

const OUTRO_AT = END / 30
export const OTTO_CHATGPT_CRUD_DURATION = screenReelDuration(SCENES, OUTRO_AT)

const HookScene = makeHookScene('Agora o ChatGPT pode cuidar dos cadastros da sua empresa.', ['cadastros'], 88, '')

export function OttoChatGptCrudReel() {
  return <ChatGptScreenReel hook={{ Component: HookScene, end: 3.7 }} outroAt={OUTRO_AT} scenes={SCENES} />
}
