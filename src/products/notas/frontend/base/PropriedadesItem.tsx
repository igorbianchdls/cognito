'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { novoId, type Item, type Propriedade, type TipoPropriedade } from '@/products/notas/shared/bases'
import { notasApi, type BaseCompleta, type Pagina } from '../api'
import { Menu } from '../Menu'
import { useNotas } from '../NotasProvider'
import { Celula, ICONE_TIPO } from './Celula'
import { ListaTipos, MenuPropriedade } from './MenuPropriedade'
import { usePessoas } from './pessoas'
import { avisarItem } from './useBase'
import x from '../notas.module.css'

/** Propriedades do item, no topo da página dele (como no Notion): nome à esquerda, valor editável à direita. */
export function PropriedadesItem({ pagina, editavel }: { pagina: Pagina; editavel: boolean }) {
  const { avisar } = useNotas()
  const pessoas = usePessoas()
  const [esquema, setEsquema] = useState<Propriedade[] | null>(null)
  const [valores, setValores] = useState(pagina.propriedades)
  const [menuProp, setMenuProp] = useState<{ ancora: HTMLElement; prop: Propriedade } | null>(null)
  const [nova, setNova] = useState<HTMLElement | null>(null)
  const baseId = pagina.base_id!

  useEffect(() => {
    let ativo = true
    notasApi<BaseCompleta>(`/bases/${baseId}?sem_itens=1`).then(d => { if (ativo) setEsquema(d.base.esquema) }).catch(e => avisar((e as Error).message))
    return () => { ativo = false }
  }, [baseId, avisar])

  const salvarEsquema = async (novo: Propriedade[]) => {
    setEsquema(novo)
    try {
      const d = await notasApi<BaseCompleta>(`/bases/${baseId}`, { method: 'PATCH', json: { esquema: novo } })
      setEsquema(d.base.esquema)
      const eu = d.itens.find(i => i.id === pagina.id)
      if (eu) setValores(eu.propriedades)
    } catch (e) { avisar((e as Error).message) }
  }
  const mudar = async (prop: Propriedade, valor: unknown) => {
    const antes = valores
    setValores(v => ({ ...v, [prop.id]: valor }))
    try {
      const salvo = await notasApi<Item>(`/itens/${pagina.id}`, { method: 'PATCH', json: { propriedades: { [prop.id]: valor } } })
      setValores(salvo.propriedades)
      avisarItem({ id: pagina.id, base_id: baseId, propriedades: salvo.propriedades })
    } catch (e) { setValores(antes); avisar((e as Error).message) }
  }
  const criarOpcao = async (prop: Propriedade, nome: string) => {
    if (!esquema) return null
    const id = novoId()
    await salvarEsquema(esquema.map(p => p.id === prop.id ? { ...p, opcoes: [...(p.opcoes ?? []), { id, nome, cor: 'azul' as const, ...(p.tipo === 'status' ? { grupo: 'a_fazer' as const } : {}) }] } : p))
    return id
  }

  if (!esquema) return <div className={x.props} style={{ minHeight: 34 }} />
  const item: Item = { id: pagina.id, titulo: pagina.titulo, icone: pagina.icone, posicao: pagina.posicao, propriedades: valores,
    created_at: pagina.created_at, updated_at: pagina.updated_at, created_by: pagina.created_by, updated_by: pagina.updated_by }

  return <div className={x.props}>
    {esquema.map(prop => {
      const Icone = ICONE_TIPO[prop.tipo]
      return <div key={prop.id} className={x.propRow}>
        <button type="button" className={x.propName} onClick={e => setMenuProp({ ancora: e.currentTarget, prop })}><Icone size={14} /><span>{prop.nome}</span></button>
        <Celula item={item} prop={prop} pessoas={pessoas} editavel={editavel} className={x.propValue} quebrar
          vazio={<span className={x.placeholder}>Vazio</span>}
          onMudar={valor => void mudar(prop, valor)} onTitulo={() => undefined} criarOpcao={nome => criarOpcao(prop, nome)} />
      </div>
    })}
    {editavel && <button type="button" className={x.propAdd} onClick={e => setNova(e.currentTarget)}><Plus size={14} />Adicionar uma propriedade</button>}
    {menuProp && <MenuPropriedade ancora={menuProp.ancora} prop={menuProp.prop} editavel={editavel} onFechar={() => setMenuProp(null)}
      onMudar={m => void salvarEsquema(esquema.map(p => p.id === menuProp.prop.id ? { ...p, ...m } : p))}
      onExcluir={() => void salvarEsquema(esquema.filter(p => p.id !== menuProp.prop.id))} />}
    {nova && <Menu ancora={nova} onFechar={() => setNova(null)} className={x.menuWide}>
      <ListaTipos onEscolher={(tipo: TipoPropriedade) => {
        let n = esquema.length + 1
        while (esquema.some(p => p.nome === `Propriedade ${n}`)) n++
        void salvarEsquema([...esquema, { id: novoId(), nome: `Propriedade ${n}`, tipo, ...(['selecao', 'multisselecao', 'status'].includes(tipo) ? { opcoes: [] } : {}) }])
        setNova(null)
      }} />
    </Menu>}
  </div>
}
