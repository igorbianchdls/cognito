/** RFC 4180 with the separator guessed from the header line (";" from Excel in Brazil, "," or tab). */
export function parseCsv(text: string) {
  const source = text.replace(/^﻿/, ''), first = source.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = [';', ',', '\t'].map(d => [d, first.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0]
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  for (let i = 0; i < source.length; i++) {
    const c = source[i]
    if (quoted) { if (c === '"' && source[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') quoted = false; else cell += c; continue }
    if (c === '"' && !cell) quoted = true
    else if (c === delimiter) { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && source[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.some(v => v.trim()))
}
