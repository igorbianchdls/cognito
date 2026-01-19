import http from 'node:http'

const port = Number(process.env.PORT || 8787)

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)

    // Basic CORS for local testing
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      return res.end()
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.end(JSON.stringify({ status: 'ok' }))
    }

    if (req.method === 'GET' && url.pathname === '/hello') {
      const name = url.searchParams.get('name') || 'world'
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      return res.end(`Hello, ${name}!`)
    }

    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: 'Not Found' }))
  } catch (err) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }))
  }
})

server.listen(port, () => {
  console.log(`Hello service listening on http://localhost:${port}`)
  console.log('• GET /health  -> {"status":"ok"}')
  console.log('• GET /hello?name=Joao  -> Hello, Joao!')
})

