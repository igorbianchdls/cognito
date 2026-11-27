'use client'

import { FileText, Table2 } from 'lucide-react'

/** Ícone de uma página: o emoji dela, ou o desenho de documento (página) ou de tabela (base de dados). */
export function IconePagina({ icone, tipo, tamanho = 16, className }: { icone?: string | null; tipo?: 'pagina' | 'base' | null; tamanho?: number; className?: string }) {
  if (icone) return <span className={className} style={{ fontSize: tamanho, lineHeight: 1 }}>{icone}</span>
  const Desenho = tipo === 'base' ? Table2 : FileText
  return <Desenho size={tamanho} className={className} strokeWidth={1.7} />
}
