'use client'

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

// Preferências da tela guardadas no navegador (largura da barra, páginas expandidas…). No servidor vale o padrão.
const EVENTO = 'notas:local'
const assinar = (avisar: () => void) => {
  window.addEventListener('storage', avisar); window.addEventListener(EVENTO, avisar)
  return () => { window.removeEventListener('storage', avisar); window.removeEventListener(EVENTO, avisar) }
}
const ler = (chave: string) => { try { return localStorage.getItem(chave) } catch { return null } }

export function useLocal<T>(chave: string, padrao: T): [T, (valor: T) => void] {
  const bruto = useSyncExternalStore(assinar, () => ler(chave), () => null)
  const valor = useMemo(() => { try { return bruto == null ? padrao : JSON.parse(bruto) as T } catch { return padrao } },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o padrão é constante para cada chave
    [bruto])
  const gravar = useCallback((novo: T) => {
    try { localStorage.setItem(chave, JSON.stringify(novo)) } catch { /* armazenamento indisponível */ }
    window.dispatchEvent(new Event(EVENTO))
  }, [chave])
  return [valor, gravar]
}

/**
 * Título da aba do navegador. O Next aplica os metadados da raiz depois (em streaming) e sobrescreveria o título; por
 * isso ele é reaplicado sempre que o <head> muda.
 */
export function useTituloDaAba(titulo: string | null) {
  useEffect(() => {
    if (!titulo) return
    const aplicar = () => { if (document.title !== titulo) document.title = titulo }
    aplicar()
    const observador = new MutationObserver(aplicar)
    observador.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => observador.disconnect()
  }, [titulo])
}
