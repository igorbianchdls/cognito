'use client'

import { FileText, Sparkles, Table2 } from 'lucide-react'

/** Ícone de uma página: o emoji dela, ou o desenho de documento (página), tabela (base de dados) ou brilho (artefato). */
export function IconePagina({ icone, tipo, tamanho = 16, className }: { icone?: string | null; tipo?: 'pagina' | 'base' | 'artefato' | null; tamanho?: number; className?: string }) {
  if (icone) return <span className={className} style={{ fontSize: tamanho, lineHeight: 1 }}>{icone}</span>
  const Desenho = tipo === 'base' ? Table2 : tipo === 'artefato' ? Sparkles : FileText
  return <Desenho size={tamanho} className={className} strokeWidth={1.7} />
}
