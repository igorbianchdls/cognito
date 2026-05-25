import { createControlApiServer } from '@/products/integracoes/cloud/src/control-api/server'

export async function main() {
  const server = createControlApiServer()
  return server
}

void main()
