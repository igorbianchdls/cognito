'use client'

import { createContext, useContext } from 'react'
import type { BaseLigada } from '@/products/notas/shared/bases'

/** Bases ligadas por relação à base aberta (títulos dos itens ligados e escolha na célula). */
export const LigadasContexto = createContext<Map<string, BaseLigada>>(new Map())
export const useLigadas = () => useContext(LigadasContexto)
