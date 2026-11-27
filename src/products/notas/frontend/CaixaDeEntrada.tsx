'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AtSign, Bell, CalendarClock, MessageSquare, UserPlus } from 'lucide-react'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { notasApi } from './api'
import { Menu } from './Menu'
import { usePessoas } from './base/pessoas'
import x from './notas.module.css'

type Notificacao = { id: string; tipo: 'mencao' | 'comentario' | 'atribuicao' | 'lembrete'; pagina_id: string | null; autor: string | null; texto: string; lida_em: string | null; created_at: string; titulo: string | null; icone: string | null }
type Caixa = { notificacoes: Notificacao[]; nao_lidas: number }

const ICONE = { mencao: AtSign, comentario: MessageSquare, atribuicao: UserPlus, lembrete: CalendarClock }
const quando = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  return s < 3600 ? `há ${Math.max(1, Math.floor(s / 60))} min` : s < 86400 ? `há ${Math.floor(s / 3600)} h` : new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

/** Caixa de entrada (como a do Notion): avisos de menção, comentário, atribuição e lembrete; confere a cada minuto. */
export function CaixaDeEntrada({ classe }: { classe: string }) {
  const router = useRouter()
  const pessoas = usePessoas()
  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const [ancora, setAncora] = useState<HTMLElement | null>(null)
  const carregar = useCallback(() => notasApi<Caixa>('/notificacoes').then(setCaixa).catch(() => undefined), [])
  useEffect(() => {
    const t = setTimeout(() => void carregar(), 0)
    const i = setInterval(() => void carregar(), 60_000)
    const voltar = () => { if (document.visibilityState === 'visible') void carregar() }
    document.addEventListener('visibilitychange', voltar)
    return () => { clearTimeout(t); clearInterval(i); document.removeEventListener('visibilitychange', voltar) }
  }, [carregar])

  const nome = (id: string | null) => !id ? 'Lembrete' : pessoas.find(p => p.id === id)?.nome ?? 'Alguém'
  const frase = (n: Notificacao) => n.tipo === 'mencao' ? `${nome(n.autor)} mencionou você` : n.tipo === 'comentario' ? `${nome(n.autor)} comentou`
    : n.tipo === 'atribuicao' ? `${nome(n.autor)} atribuiu a você` : n.texto
  const abrir = async (n: Notificacao) => {
    setAncora(null)
    if (!n.lida_em) await notasApi('/notificacoes', { method: 'PATCH', json: { ids: [n.id] } }).catch(() => undefined)
    void carregar()
    if (n.pagina_id) router.push(`/notas/${n.pagina_id}`)
  }
  const lerTodas = async () => { await notasApi('/notificacoes', { method: 'PATCH', json: { todas: true } }).catch(() => undefined); void carregar() }

  return <>
    <button type="button" className={classe} onClick={e => { setAncora(e.currentTarget); void carregar() }}>
      <Bell size={16} />Caixa de entrada{caixa?.nao_lidas ? <span className={x.badge}>{caixa.nao_lidas > 99 ? '99+' : caixa.nao_lidas}</span> : null}
    </button>
    {ancora && <Menu ancora={ancora} onFechar={() => setAncora(null)} className={x.inbox}>
      <div className={x.inboxHead}><b>Caixa de entrada</b>{Boolean(caixa?.nao_lidas) && <button type="button" className={x.barBtn} onClick={() => void lerTodas()}>Marcar tudo como lido</button>}</div>
      <div className={x.inboxLista}>
        {!caixa?.notificacoes.length && <div className={x.muted} style={{ padding: 16, fontSize: 13 }}>Nada por aqui. Menções, comentários nas suas páginas, tarefas atribuídas a você e lembretes de datas aparecem aqui.</div>}
        {caixa?.notificacoes.map(n => {
          const Icone = ICONE[n.tipo]
          return <button key={n.id} type="button" className={`${x.inboxItem} ${n.lida_em ? '' : x.inboxNova}`} onClick={() => void abrir(n)}>
            <Icone size={16} />
            <span className={x.inboxTexto}>
              <span><b>{frase(n)}</b> <small>{quando(n.created_at)}</small></span>
              <span className={x.cellText}>{n.icone ?? '📄'} {tituloExibido(n.titulo)}</span>
              {n.tipo !== 'lembrete' && n.texto && n.tipo !== 'mencao' && <span className={x.inboxTrecho}>{n.texto}</span>}
            </span>
          </button>
        })}
      </div>
    </Menu>}
  </>
}
