'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AtSign, Bell, CalendarClock, FileText, MessageSquare, UserPlus } from 'lucide-react'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { fraseDoAviso, lerAvisos, recarregarAvisos, useAvisosNotas, type AvisoNotas } from './avisos'
import { Menu } from './Menu'
import { usePessoas } from './base/pessoas'
import x from './notas.module.css'

const ICONE = { mencao: AtSign, comentario: MessageSquare, atribuicao: UserPlus, lembrete: CalendarClock }
const quando = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  return s < 60 ? 'agora' : s < 3600 ? `há ${Math.floor(s / 60)} min` : s < 86400 ? `há ${Math.floor(s / 3600)} h`
    : new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
}

/** Atualizações (a caixa de entrada do Notion; aqui com outro nome porque o Otto já tem a Caixa de entrada do atendimento): avisos de menção, comentário, atribuição e lembrete. O sino do topo conta os mesmos. */
export function CaixaDeEntrada({ classe }: { classe: string }) {
  const router = useRouter()
  const pessoas = usePessoas()
  const caixa = useAvisosNotas()
  const [ancora, setAncora] = useState<HTMLElement | null>(null)
  const [aba, setAba] = useState<'todas' | 'nao_lidas'>('todas')
  const lista = aba === 'todas' ? caixa.notificacoes : caixa.notificacoes.filter(n => !n.lida_em)

  const abrir = (n: AvisoNotas) => {
    setAncora(null)
    if (!n.lida_em) void lerAvisos([n.id])
    if (n.pagina_id) router.push(`/notas/${n.pagina_id}`)
  }

  return <>
    <button type="button" className={classe} onClick={e => { setAncora(e.currentTarget); void recarregarAvisos() }}>
      <Bell size={16} />Atualizações{caixa.nao_lidas ? <span className={x.badge}>{caixa.nao_lidas > 99 ? '99+' : caixa.nao_lidas}</span> : null}
    </button>
    {ancora && <Menu ancora={ancora} onFechar={() => setAncora(null)} className={x.inbox}>
      <div className={x.inboxHead}>
        <b>Atualizações</b>
        {caixa.nao_lidas > 0 && <button type="button" className={x.barBtn} onClick={() => void lerAvisos('todas')}>Marcar tudo como lido</button>}
      </div>
      <div className={x.inboxAbas} role="tablist">
        <button type="button" role="tab" aria-selected={aba === 'todas'} onClick={() => setAba('todas')}>Todas</button>
        <button type="button" role="tab" aria-selected={aba === 'nao_lidas'} onClick={() => setAba('nao_lidas')}>
          Não lidas{caixa.nao_lidas > 0 && <span>{caixa.nao_lidas}</span>}
        </button>
      </div>
      <div className={x.inboxLista}>
        {!lista.length && <div className={x.inboxVazia}>
          <Bell size={28} strokeWidth={1.4} />
          <b>{aba === 'todas' ? 'Nada por aqui ainda' : 'Tudo lido'}</b>
          <span>{aba === 'todas' ? 'Menções, comentários nas suas páginas, itens atribuídos a você e lembretes de datas aparecem aqui.' : 'Você está em dia.'}</span>
        </div>}
        {lista.map(n => {
          const Icone = ICONE[n.tipo]
          return <button key={n.id} type="button" className={`${x.inboxItem} ${n.lida_em ? '' : x.inboxNova}`} onClick={() => abrir(n)}>
            <span className={x.inboxIcone}><Icone size={15} /></span>
            <span className={x.inboxTexto}>
              <span><b>{fraseDoAviso(n, pessoas)}</b> <small>{quando(n.created_at)}</small></span>
              <span className={x.inboxPagina}>{n.icone ? <span>{n.icone}</span> : <FileText size={13} />}{tituloExibido(n.titulo)}</span>
              {n.tipo === 'comentario' && n.texto && <span className={x.inboxTrecho}>{n.texto}</span>}
            </span>
          </button>
        })}
      </div>
    </Menu>}
  </>
}
