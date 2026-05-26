import { createServer, type IncomingMessage } from 'node:http'

import { createControlApiServer } from '@/products/integracoes/cloud/src/control-api/server'

function readRequestBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8').trim()
      if (!rawBody) {
        resolve(undefined)
        return
      }

      try {
        resolve(JSON.parse(rawBody) as unknown)
      } catch {
        resolve(rawBody)
      }
    })
    request.on('error', () => resolve(undefined))
  })
}

export function main() {
  const controlApi = createControlApiServer()
  const port = Number(process.env.PORT || 8080)

  const httpServer = createServer(async (request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
    const result = await controlApi.handle({
      method: request.method || 'GET',
      path: url.pathname,
      headers: request.headers,
      body: await readRequestBody(request),
    })

    response.writeHead(result.status, { 'content-type': 'application/json; charset=utf-8' })
    response.end(JSON.stringify(result.body))
  })

  httpServer.listen(port, '0.0.0.0')
  return httpServer
}

void main()
