import { CircleCheck, Package, Trash2, Undo2, User } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { MentionBubble } from './ChatGptMention'
import type { MentionMessage } from './ChatGptMention'
import { ChatGptScreenReel, screenReelDuration } from './ChatGptScreenReelKit'
import type { Scene } from './ChatGptScreenReelKit'
import { AssistantText, CardHeader, CardShell, DONE_OK, DoneView, GREEN, IconTile, LINE, MUTED, TEXT, addTile, editTile, iv, p, pop } from './ChatGptVendasCardReplica'
import { makeHookScene } from './OttoNotaFiscalChatGptVideos'

/**
 * Reel (no narration yet): one request, the AI runs several CRUD operations in a row without asking for
 * confirmation — "Vou criar o cliente…" → final card → "Cliente criado." — mixing clients and products.
 * Everything runs on its own clock (replica frame = reel frame after the hook).
 */

const MSG: MentionMessage = {
  lines: ['cadastra a Nova Empresa Ltda.', 'de Recife, cria o produto Cadeira', 'Ergonômica a R$ 890, atualiza o e-mail', 'do Cliente Exemplo e exclui o Cliente', 'Antigo Ltda.'],
  send: 254,
  typing: [130, 250],
}

/** Document positions of the conversation (before scrolling). */
const Y = {
  bubble: 230,
  ops: [
    { card: 660, done: 1520, say: 580 },
    { card: 1750, done: 2610, say: 1620 },
    { card: 2840, done: 3700, say: 2710 },
    { card: 3930, done: 4770, say: 3800 },
  ],
  wrap: 4870,
}

/** Frame each operation starts: announce → card (+26) → "done" line (+80). */
const OPS = [280, 390, 500, 610]
const WRAP = 720

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
      <AssistantText frame={frame} text="Pronto! Fiz as 4 alterações no Otto." top={Y.wrap} window={[WRAP, WRAP + 14]} />
      {frame >= WRAP + 16 ? (
        <span style={{ alignItems: 'center', color: GREEN, display: 'flex', fontSize: 26, gap: 10, left: 33, opacity: pop(frame, WRAP + 16), position: 'absolute', top: Y.wrap + 62 }}>
          <CircleCheck color={GREEN} size={26} strokeWidth={2.2} style={iv(26, 2.2)} /> 4 alterações concluídas
        </span>
      ) : null}
    </>
  )
}

const END = WRAP + 80

const SCENES: Scene[] = [
  {
    content: (rf) => <Conversation frame={rf} />,
    messages: [MSG],
    // each operation scrolls its announcement to the top; the last view keeps the delete card + wrap-up
    scroll: [
      ...OPS.map((t, i): [number, number, number] => [t - 6, t + 20, Y.ops[i].say - 200]),
      [WRAP - 6, WRAP + 20, Y.ops[3].card - 198],
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
