'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'

export type CodeLanguage = 'html' | 'css' | 'js' | 'json'
export const languageOf = (path: string): CodeLanguage => path.endsWith('.css') ? 'css' : path.endsWith('.js') ? 'js' : path.endsWith('.json') ? 'json' : 'html'
const LANGUAGE_NAMES: Record<CodeLanguage, string> = { html: 'HTML', css: 'CSS', js: 'JavaScript', json: 'JSON' }
const INDENT = '  '
// Highlighting very large files on every keystroke would make typing slow.
const HIGHLIGHT_LIMIT = 200_000

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const span = (kind: string, text: string) => kind ? `<span class="ce-${kind}">${escape(text)}</span>` : escape(text)

type Rule = [kind: string, pattern: string]
function tokenizer(rules: Rule[]) {
  const pattern = new RegExp(rules.map(([, p]) => `(${p})`).join('|'), 'g')
  return (code: string) => {
    let html = '', last = 0
    for (const match of code.matchAll(pattern)) {
      const index = match.index ?? 0
      if (!match[0]) continue
      html += escape(code.slice(last, index))
      const group = match.findIndex((value, i) => i > 0 && value !== undefined)
      html += span(rules[group - 1][0], match[0])
      last = index + match[0].length
    }
    return html + escape(code.slice(last))
  }
}

const STRING = `'(?:\\\\.|[^'\\\\\\n])*'?|"(?:\\\\.|[^"\\\\\\n])*"?`
const highlightJs = tokenizer([
  ['comment', '\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?(?:\\*\\/|$)'],
  ['string', STRING + '|`(?:\\\\[\\s\\S]|[^`\\\\])*`?'],
  ['keyword', '\\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|try|catch|finally|throw|async|await|of|in|typeof|instanceof|delete|void|yield|default|this|super)\\b'],
  ['literal', '\\b(?:true|false|null|undefined|NaN|Infinity)\\b'],
  ['number', '\\b(?:0x[\\da-fA-F]+|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b'],
  ['function', '\\b[A-Za-z_$][\\w$]*(?=\\s*\\()'],
])
const highlightJson = tokenizer([
  ['property', '"(?:\\\\.|[^"\\\\\\n])*"(?=\\s*:)'],
  ['string', '"(?:\\\\.|[^"\\\\\\n])*"?'],
  ['literal', '\\b(?:true|false|null)\\b'],
  ['number', '-?\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b'],
])

function highlightCss(code: string) {
  // Names before "{" are selectors; inside a block, names before ":" are properties.
  let html = '', depth = 0, last = 0
  const pattern = /(\/\*[\s\S]*?(?:\*\/|$))|('(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?)|(@[\w-]+)|([{}])|(#[\da-fA-F]{3,8}\b|-?\d*\.?\d+(?:[a-z%]+)?)|([\w-]+)(?=\s*:)|([^\s{};:,]+)/g
  for (const m of code.matchAll(pattern)) {
    html += escape(code.slice(last, m.index)); last = (m.index ?? 0) + m[0].length
    if (m[1]) html += span('comment', m[0])
    else if (m[2]) html += span('string', m[0])
    else if (m[3]) html += span('keyword', m[0])
    else if (m[4]) { depth = Math.max(0, depth + (m[0] === '{' ? 1 : -1)); html += escape(m[0]) }
    else if (m[5] && depth > 0) html += span('number', m[0])
    else if (m[6] && depth > 0) html += span('property', m[0])
    else html += depth > 0 ? escape(m[0]) : span('selector', m[0])
  }
  return html + escape(code.slice(last))
}

function highlightHtml(code: string): string {
  let html = '', index = 0
  const tag = /<!--[\s\S]*?(?:-->|$)|<\/?([A-Za-z][\w-]*)([^>]*)>?/g
  for (const m of code.matchAll(tag)) {
    const start = m.index ?? 0
    if (start < index) continue
    html += escape(code.slice(index, start))
    index = start + m[0].length
    if (m[0].startsWith('<!--')) { html += span('comment', m[0]); continue }
    const closing = m[0].startsWith('</')
    html += escape(closing ? '</' : '<') + span('tag', m[1])
    html += (m[2] ?? '').replace(/([^\s"'=/>]+)|("[^"]*"?|'[^']*'?)|([^"'\w]+)/g, (part, attr, value) => attr ? span('attribute', part) : value ? span('string', part) : escape(part))
    if (m[0].endsWith('>')) html += escape('>')
    // Script and style bodies use their own highlighting.
    const name = m[1].toLowerCase()
    if (!closing && (name === 'script' || name === 'style')) {
      const end = code.toLowerCase().indexOf(`</${name}`, index)
      const body = code.slice(index, end < 0 ? code.length : end)
      html += name === 'script' ? highlightJs(body) : highlightCss(body)
      index += body.length
    }
  }
  return html + escape(code.slice(index))
}

const HIGHLIGHTERS: Record<CodeLanguage, (code: string) => string> = { html: highlightHtml, css: highlightCss, js: highlightJs, json: highlightJson }

const AsyncFunction = Object.getPrototypeOf(async function () { /* constructor only */ }).constructor as new (code: string) => unknown

function syntaxProblem(language: CodeLanguage, code: string): string | null {
  if (language === 'json') { try { JSON.parse(code); return null } catch (e) { return e instanceof Error ? e.message : 'JSON inválido.' } }
  if (language === 'js') {
    // Compiles only, as an async function so top-level await is accepted; nothing runs.
    try { new AsyncFunction(code); return null }
    catch (e) { return e instanceof SyntaxError ? e.message : null }
  }
  return null
}

/** Replaces a range keeping the browser undo history (Ctrl+Z) when possible. */
function replaceRange(area: HTMLTextAreaElement, start: number, end: number, text: string, caret?: [number, number]) {
  area.focus(); area.setSelectionRange(start, end)
  if (!document.execCommand?.('insertText', false, text)) {
    area.setRangeText(text, start, end, 'end')
    area.dispatchEvent(new Event('input', { bubbles: true }))
  }
  if (caret) area.setSelectionRange(caret[0], caret[1])
}

export function CodeEditor({ value, onChange, language, label, onSave }: { value: string; onChange: (value: string) => void; language: CodeLanguage; label: string; onSave?: () => void }) {
  const areaRef = useRef<HTMLTextAreaElement>(null), preRef = useRef<HTMLPreElement>(null), gutterRef = useRef<HTMLDivElement>(null)
  const leaveWithTab = useRef(false), problemId = useId()
  const [cursor, setCursor] = useState({ line: 1, column: 1 }), [problem, setProblem] = useState<string | null>(null)
  const highlighted = useMemo(() => value.length > HIGHLIGHT_LIMIT ? escape(value) : HIGHLIGHTERS[language](value), [value, language])
  const lines = useMemo(() => Array.from({ length: value.split('\n').length }, (_, i) => i + 1).join('\n'), [value])
  useEffect(() => { const timer = setTimeout(() => setProblem(syntaxProblem(language, value)), 500); return () => clearTimeout(timer) }, [language, value])

  function syncScroll() {
    const area = areaRef.current; if (!area) return
    if (preRef.current) { preRef.current.scrollTop = area.scrollTop; preRef.current.scrollLeft = area.scrollLeft }
    if (gutterRef.current) gutterRef.current.scrollTop = area.scrollTop
  }
  function trackCursor() {
    const area = areaRef.current; if (!area) return
    const before = area.value.slice(0, area.selectionStart)
    setCursor({ line: before.split('\n').length, column: before.length - before.lastIndexOf('\n') })
  }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const area = event.currentTarget, { selectionStart: start, selectionEnd: end } = area, text = area.value
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); onSave?.(); return }
    if (event.key === 'Escape') { leaveWithTab.current = true; return }
    if (event.key === 'Tab' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      // Esc then Tab leaves the editor, so keyboard users are never trapped.
      if (leaveWithTab.current) { leaveWithTab.current = false; return }
      event.preventDefault()
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      if (start === end && !event.shiftKey) return replaceRange(area, start, end, INDENT)
      const block = text.slice(lineStart, end)
      const changed = block.split('\n').map(line => event.shiftKey ? line.replace(/^ {1,2}|^\t/, '') : INDENT + line).join('\n')
      return replaceRange(area, lineStart, end, changed, [lineStart, lineStart + changed.length])
    }
    if (event.key !== 'Shift') leaveWithTab.current = false
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      const indent = /^[ \t]*/.exec(text.slice(lineStart, start))?.[0] ?? ''
      const before = text.slice(lineStart, start).trimEnd(), after = text[end] ?? ''
      const opens = /[{[(]$/.test(before) || language === 'html' && /<([a-zA-Z][\w-]*)(?:\s[^<>]*)?>$/.test(before) && !/^<(?:br|hr|img|input|meta|link|area|base|col|source|wbr)\b/i.test(before.slice(before.lastIndexOf('<')))
      const closes = /[}\])]/.test(after) || language === 'html' && text.slice(end, end + 2) === '</'
      if (opens && closes) {
        const inner = '\n' + indent + INDENT
        return replaceRange(area, start, end, inner + '\n' + indent, [start + inner.length, start + inner.length])
      }
      return replaceRange(area, start, end, '\n' + indent + (opens ? INDENT : ''))
    }
  }

  return <div className="ce">
    <div className="ce-body">
      <div ref={gutterRef} className="ce-gutter" aria-hidden="true">{lines}</div>
      <div className="ce-area">
        <pre ref={preRef} aria-hidden="true" dangerouslySetInnerHTML={{ __html: highlighted + '\n ' }} />
        <textarea ref={areaRef} aria-label={label} spellCheck={false} autoCapitalize="off" autoComplete="off" autoCorrect="off" wrap="off" value={value} onChange={e => onChange(e.target.value)} onScroll={syncScroll} onKeyDown={onKeyDown} onKeyUp={trackCursor} onClick={trackCursor} onSelect={trackCursor} aria-describedby={problem ? problemId : undefined} />
      </div>
    </div>
    <div className="ce-status">
      <span>Linha {cursor.line}, coluna {cursor.column}</span><span>{LANGUAGE_NAMES[language]}</span>
      {problem ? <span id={problemId} className="ce-problem" role="status">Possível erro: {problem}</span> : (language === 'js' || language === 'json') && <span className="ce-ok">Sem erros de sintaxe</span>}
      <span className="ce-keys">Ctrl+S salva · Tab indenta · Esc, Tab sai do editor</span>
    </div>
  </div>
}
