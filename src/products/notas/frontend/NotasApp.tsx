'use client'

import type { ReactNode } from 'react'
import { Busca } from './Busca'
import { NotasProvider, useNotas } from './NotasProvider'
import { Sidebar } from './Sidebar'
import x from './notas.module.css'

function Aviso() {
  const { aviso } = useNotas()
  return aviso ? <div className={x.toast} role="status">{aviso}</div> : null
}

/** Moldura das Notas dentro do Otto: barra lateral própria (como no Notion) e a página à direita. */
export function NotasApp({ children }: { children: ReactNode }) {
  return <NotasProvider>
    <div className={x.app}>
      <Sidebar />
      {children}
    </div>
    <Busca />
    <Aviso />
  </NotasProvider>
}
