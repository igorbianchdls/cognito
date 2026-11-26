// Notas — edição simultânea: sincroniza um documento Yjs e a presença (cursores, quem está na página) entre as
// pessoas pela mensagem de um canal (Supabase Realtime no app; BroadcastChannel nos testes de tela).
//   sync1: "cheguei; este é o meu vetor de estado"  →  quem já está responde sync2 com o que falta.
//   update: cada alteração local.   awareness: presença.   meta: título/ícone/capa mudados (fora do documento).
import * as Y from 'yjs'
import * as presenca from 'y-protocols/awareness'

export type Transporte = {
  enviar: (evento: string, dados: string) => void
  /** Começa a ouvir; devolve a função que para. */
  ouvir: (aoReceber: (evento: string, dados: string) => void) => () => void
  fechar: () => void
}

export const paraBase64 = (bytes: Uint8Array) => {
  let texto = ''
  for (let i = 0; i < bytes.length; i += 0x8000) texto += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(texto)
}
export const deBase64 = (texto: string) => Uint8Array.from(atob(texto), c => c.charCodeAt(0))

const REMOTO = Symbol('remoto')
/** Origem das atualizações que vêm do servidor (estado fundido devolvido ao salvar): não são retransmitidas. */
export const ORIGEM_SERVIDOR = Symbol('servidor')

export class Sincronizador {
  readonly awareness: presenca.Awareness
  private pararDeOuvir: () => void
  private aoMeta = new Set<(dados: Record<string, unknown>) => void>()

  /** A presença foi criada aqui (então é encerrada aqui também). */
  private presencaPropria: boolean

  constructor(readonly doc: Y.Doc, private transporte: Transporte, awareness?: presenca.Awareness) {
    this.presencaPropria = !awareness
    this.awareness = awareness ?? new presenca.Awareness(doc)
    doc.on('update', this.aoAtualizar)
    this.awareness.on('update', this.aoMudarPresenca)
    this.pararDeOuvir = transporte.ouvir(this.receber)
    transporte.enviar('sync1', paraBase64(Y.encodeStateVector(doc)))
  }

  private aoAtualizar = (update: Uint8Array, origem: unknown) => {
    if (origem !== REMOTO && origem !== ORIGEM_SERVIDOR) this.transporte.enviar('update', paraBase64(update))
  }

  private aoMudarPresenca = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origem: unknown) => {
    if (origem === REMOTO) return
    const mudaram = [...added, ...updated, ...removed]
    if (mudaram.length) this.transporte.enviar('awareness', paraBase64(presenca.encodeAwarenessUpdate(this.awareness, mudaram)))
  }

  private receber = (evento: string, dados: string) => {
    try {
      if (evento === 'update' || evento === 'sync2') Y.applyUpdate(this.doc, deBase64(dados), REMOTO)
      else if (evento === 'sync1') {
        // Alguém chegou: manda o que essa pessoa não tem e a presença de quem está aqui.
        this.transporte.enviar('sync2', paraBase64(Y.encodeStateAsUpdate(this.doc, deBase64(dados))))
        this.transporte.enviar('awareness', paraBase64(presenca.encodeAwarenessUpdate(this.awareness, [...this.awareness.getStates().keys()])))
      } else if (evento === 'awareness') presenca.applyAwarenessUpdate(this.awareness, deBase64(dados), REMOTO)
      else if (evento === 'meta') { const m = JSON.parse(dados); for (const f of this.aoMeta) f(m) }
    } catch {
      // Mensagem estragada ou de outra versão: ignora (o estado salvo no servidor corrige depois).
    }
  }

  /** Título, ícone, capa…: avisa quem está na página (não fazem parte do documento). */
  enviarMeta(dados: Record<string, unknown>) { this.transporte.enviar('meta', JSON.stringify(dados)) }
  ouvirMeta(f: (dados: Record<string, unknown>) => void) { this.aoMeta.add(f); return () => { this.aoMeta.delete(f) } }

  destruir() {
    presenca.removeAwarenessStates(this.awareness, [this.doc.clientID], 'saindo')
    this.doc.off('update', this.aoAtualizar)
    this.awareness.off('update', this.aoMudarPresenca)
    if (this.presencaPropria) this.awareness.destroy()
    this.pararDeOuvir()
    this.transporte.fechar()
  }
}

/** Canal em memória (testes): todos os transportes do mesmo nome se ouvem, menos a si mesmos. */
export function transporteEmMemoria(rede: Map<string, Set<(e: string, d: string) => void>>, canal: string): Transporte {
  let meu: ((e: string, d: string) => void) | null = null
  const ouvintes = () => { if (!rede.has(canal)) rede.set(canal, new Set()); return rede.get(canal)! }
  return {
    enviar: (e, d) => { for (const f of ouvintes()) if (f !== meu) f(e, d) },
    ouvir: f => { meu = f; ouvintes().add(f); return () => { ouvintes().delete(f) } },
    fechar: () => { if (meu) ouvintes().delete(meu) },
  }
}
