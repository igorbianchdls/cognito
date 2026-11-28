// Animação de saída para menus, painéis e janelas: quando o elemento sai da tela, uma cópia só visual (sem eventos,
// fora da acessibilidade) fica no lugar dele fazendo o movimento de saída e some em seguida. Assim nenhum componente
// precisa esperar a animação para fechar.
import x from './notas.module.css'

function fantasma(el: HTMLElement, classe: string, desde: number) {
  const pai = el.parentNode
  // Montado e desmontado na hora (o React faz isso em desenvolvimento): não anima.
  if (!pai || !el.isConnected || performance.now() - desde < 150) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const copia = el.cloneNode(true) as HTMLElement
  copia.classList.add(classe)
  copia.setAttribute('aria-hidden', 'true')
  copia.setAttribute('inert', '')
  copia.removeAttribute('role')
  copia.style.pointerEvents = 'none'
  copia.querySelectorAll('[role], [id], [data-id], [contenteditable]').forEach(n => {
    n.removeAttribute('role'); n.removeAttribute('id'); n.removeAttribute('data-id'); n.removeAttribute('contenteditable')
  })
  // Vídeos e páginas incorporadas não são recarregados só para a animação.
  copia.querySelectorAll('iframe, video, audio').forEach(n => n.replaceWith(Object.assign(document.createElement('div'), { style: `height:${(n as HTMLElement).offsetHeight}px` })))
  pai.insertBefore(copia, el.nextSibling)
  const tirar = () => copia.remove()
  copia.addEventListener('animationend', tirar, { once: true })
  setTimeout(tirar, 400)
}

/** Ref que anima a saída do elemento com a classe dada (uma por elemento; use as constantes abaixo). */
export function saidaAnimada(classe: string) {
  return (el: HTMLElement | null) => {
    if (!el) return
    const desde = performance.now()
    return () => fantasma(el, classe, desde)
  }
}

export const saidaPainel = saidaAnimada(x.painelSaindo)
export const saidaJanela = saidaAnimada(x.janelaSaindo)
export const saidaAviso = saidaAnimada(x.avisoSaindo)
export const saidaMenu = (el: HTMLElement) => { const desde = performance.now(); return () => fantasma(el, x.menuSaindo, desde) }

/**
 * Menus do editor (barra de formatação, menu "/" e menu ⋮⋮ do bloco) são montados e tirados pelo próprio editor:
 * observa quando saem e deixa a cópia fazendo a saída no mesmo lugar. Devolve a função que para de observar.
 */
const MENUS_DO_EDITOR = '.bn-formatting-toolbar, .bn-suggestion-menu, .mantine-Menu-dropdown'
export function observarMenusDoEditor(raiz: HTMLElement) {
  const entrou = new WeakMap<Node, number>()
  // Onde cada menu estava na tela (para quando ele sai junto com a moldura dele, como o ⋮⋮).
  const lugar = new WeakMap<Node, DOMRect>()
  // O editor tira o mesmo menu em mais de um passo (o menu e depois a moldura): anima uma vez só.
  const animado = new WeakSet<Node>()
  const medir = () => raiz.querySelectorAll<HTMLElement>(MENUS_DO_EDITOR).forEach(e => { if (!e.closest('[data-fantasma]')) lugar.set(e, e.getBoundingClientRect()) })
  // O menu de verdade dentro do nó (nunca o de uma cópia que ainda está saindo).
  const menuDe = (n: Node) => {
    if (!(n instanceof HTMLElement) || n.closest('[data-fantasma]') || n.dataset.fantasma) return null
    if (n.matches(MENUS_DO_EDITOR)) return n
    return [...n.querySelectorAll<HTMLElement>(MENUS_DO_EDITOR)].find(e => !e.closest('[data-fantasma]')) ?? null
  }
  const ehMenu = (n: Node): n is HTMLElement => menuDe(n) !== null
  const observador = new MutationObserver(mudancas => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    for (const m of mudancas) {
      // O texto do editor muda o tempo todo: só interessa o que fica fora dele.
      if (m.target instanceof Element && m.target.closest('.ProseMirror')) continue
      m.addedNodes.forEach(n => { if (ehMenu(n)) entrou.set(n, performance.now()) })
      m.removedNodes.forEach(n => {
        if (!ehMenu(n) || !(m.target instanceof HTMLElement)) return
        const desde = entrou.get(n)
        if (desde !== undefined && performance.now() - desde < 120) return
        const menuSaiu = menuDe(n)
        const r = menuSaiu && lugar.get(menuSaiu)
        // A moldura saiu junto: a cópia vai para a caixa do editor, fixa onde o menu estava.
        const fora = !m.target.isConnected
        if ((fora && !r) || !menuSaiu || animado.has(menuSaiu)) return
        animado.add(menuSaiu)
        const copia = n.cloneNode(true) as HTMLElement
        copia.dataset.fantasma = '1'
        copia.setAttribute('aria-hidden', 'true')
        copia.setAttribute('inert', '')
        copia.style.pointerEvents = 'none'
        copia.querySelectorAll('[role], [id]').forEach(e => { e.removeAttribute('role'); e.removeAttribute('id') })
        copia.removeAttribute('role')
        const menu = copia.matches(MENUS_DO_EDITOR) ? copia : copia.querySelector<HTMLElement>(MENUS_DO_EDITOR)
        menu?.classList.add(x.menuEditorSaindo)
        if (fora && r) {
          Object.assign(copia.style, { position: 'fixed', top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, margin: '0', zIndex: '1000', transform: 'none' })
          raiz.appendChild(copia)
        } else {
          const depois = m.nextSibling && m.nextSibling.parentNode === m.target ? m.nextSibling : null
          m.target.insertBefore(copia, depois)
        }
        setTimeout(() => copia.remove(), 200)
      })
    }
    medir()
  })
  observador.observe(raiz, { childList: true, subtree: true })
  // O menu pode mudar de lugar depois de abrir (rolagem, posicionamento): mede de novo quando o mouse anda.
  raiz.addEventListener('pointermove', medir, { passive: true })
  return () => { observador.disconnect(); raiz.removeEventListener('pointermove', medir) }
}
