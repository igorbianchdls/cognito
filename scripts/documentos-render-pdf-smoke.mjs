#!/usr/bin/env node

function parseArgs(argv) {
  const out = {
    base: process.env.BASE_URL || 'http://localhost:3000',
    expectEngine: process.env.EXPECT_ENGINE || '',
    timeoutMs: Number(process.env.TIMEOUT_MS || 60000),
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--base' && argv[i + 1]) {
      out.base = argv[++i]
      continue
    }
    if (arg.startsWith('--base=')) {
      out.base = arg.slice('--base='.length)
      continue
    }
    if (arg === '--expect-engine' && argv[i + 1]) {
      out.expectEngine = argv[++i]
      continue
    }
    if (arg.startsWith('--expect-engine=')) {
      out.expectEngine = arg.slice('--expect-engine='.length)
      continue
    }
    if (arg === '--timeout-ms' && argv[i + 1]) {
      out.timeoutMs = Number(argv[++i]) || out.timeoutMs
      continue
    }
    if (arg.startsWith('--timeout-ms=')) {
      out.timeoutMs = Number(arg.slice('--timeout-ms='.length)) || out.timeoutMs
      continue
    }
  }
  out.base = String(out.base || '').replace(/\/+$/, '')
  return out
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function sampleTemplateJson() {
  return {
    kind: 'document-preview',
    title: 'Proposta Comercial',
    blocks: [
      { type: 'heading', text: 'Proposta Comercial' },
      { type: 'text', text: 'Cliente: {{cliente.nome}}' },
      { type: 'text', text: 'Validade: {{validade}}' },
      { type: 'table', columns: ['descricao', 'qtd', 'valor'], rows: '{{itens}}' },
    ],
  }
}

function sampleData() {
  return {
    cliente: { nome: 'Cliente Smoke Test' },
    validade: '2026-03-31',
    itens: [
      { descricao: 'Servico de implantacao', qtd: 1, valor: 4900 },
      { descricao: 'Mensalidade', qtd: 1, valor: 990 },
    ],
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), args.timeoutMs)

  const url = `${args.base}/api/documentos/render-pdf`
  const startedAt = Date.now()
  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        template_json: sampleTemplateJson(),
        sample_data: sampleData(),
        filename: 'smoke-proposta.pdf',
        title: 'Smoke Test PDF',
      }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }

  const elapsedMs = Date.now() - startedAt
  const contentType = String(res.headers.get('content-type') || '')
  const engine = String(res.headers.get('x-documentos-pdf-engine') || '')
  const buf = Buffer.from(await res.arrayBuffer())

  assert(res.ok, `HTTP ${res.status} em ${url}`)
  assert(contentType.toLowerCase().includes('application/pdf'), `content-type inválido: ${contentType || '(vazio)'}`)
  assert(engine.length > 0, 'header x-documentos-pdf-engine ausente')
  if (args.expectEngine) {
    assert(engine === args.expectEngine, `engine inesperada: esperado=${args.expectEngine} recebido=${engine}`)
  }
  assert(buf.length > 200, `PDF muito pequeno (${buf.length} bytes)`)
  assert(buf.subarray(0, 4).toString('latin1') === '%PDF', 'payload não parece PDF válido (prefixo %PDF ausente)')

  const out = {
    ok: true,
    url,
    status: res.status,
    elapsed_ms: elapsedMs,
    headers: {
      content_type: contentType,
      x_documentos_pdf_engine: engine,
      content_disposition: res.headers.get('content-disposition') || null,
    },
    pdf: {
      size_bytes: buf.length,
      pdf_prefix: buf.subarray(0, 8).toString('latin1'),
    },
  }
  console.log(JSON.stringify(out, null, 2))
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2))
  process.exit(1)
})

