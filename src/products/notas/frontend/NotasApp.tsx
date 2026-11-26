'use client'

import type { ReactNode } from 'react'
import { Busca } from './Busca'
import { NotasProvider, useNotas } from './NotasProvider'
import { Sidebar } from './Sidebar'
import x from './notas.module.css'

function Aviso() {
  const { aviso, avisar } = useNotas()
  if (!aviso) return null
  return <div key={aviso.n} className={x.toast} role="status">
    {aviso.texto}
    {aviso.acao && <button type="button" className={x.toastAcao} onClick={() => { const fazer = aviso.acao!.fazer; avisar(''); fazer() }}>{aviso.acao.rotulo}</button>}
  </div>
}

/** Banco ainda sem as tabelas das Notas: aviso amigável no lugar da tela. */
function Conteudo({ children }: { children: ReactNode }) {
  const { preparacao } = useNotas()
  if (!preparacao) return <><Sidebar />{children}</>
  return <div className={x.main}><div className={x.home} style={{ textAlign: 'center', paddingTop: '18vh' }}>
    <div style={{ fontSize: 48 }}>🛠️</div>
    <h1>Notas em preparação</h1>
    <p className={x.muted}>Estamos terminando de preparar as Notas para a sua empresa. Volte em breve.</p>
  </div></div>
}

/** Moldura das Notas dentro do Otto: barra lateral própria (como no Notion) e a página à direita. */
export function NotasApp({ children }: { children: ReactNode }) {
  return <NotasProvider>
    <div className={x.app}>
      <Conteudo>{children}</Conteudo>
      <Busca />
      <Aviso />
    </div>
  </NotasProvider>
}
