#!/usr/bin/env node
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })
config({ quiet: true })

function option(name: string) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function print(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

async function main() {
  const [{ executeAiTool }, { resolveInternalCliPrincipal }, { listAiTools, getAiTool }, { closePool }] = await Promise.all([
    import('@/products/ai-platform/application/executeAiTool'),
    import('@/products/ai-platform/auth/resolveErpPrincipal'),
    import('@/products/ai-platform/tools/toolRegistry'),
    import('@/lib/postgres'),
  ])
  const [group, command, positional] = process.argv.slice(2).filter((value) => !value.startsWith('--'))
  try {
    if (group !== 'tools') throw new Error('Use: pnpm otto tools <list|describe|call>.')
    if (command === 'list') {
      print(listAiTools().map((tool) => ({ name: tool.name, title: tool.title, risk: tool.risk, capability: tool.capability })))
      return
    }
    if (command === 'describe') {
      const tool = getAiTool(positional)
      if (!tool) throw new Error('Ferramenta nao encontrada.')
      print({ name: tool.name, title: tool.title, description: tool.description, risk: tool.risk, capability: tool.capability })
      return
    }
    if (command !== 'call' || !positional) throw new Error('Use: pnpm otto tools call <tool> --args "{...}".')
    const email = option('user') || process.env.AI_CLI_USER_EMAIL
    const organizationSlug = option('organization') || process.env.AI_CLI_ORGANIZATION_SLUG
    if (!email || !organizationSlug) throw new Error('Informe --user e --organization (slug).')
    const principal = await resolveInternalCliPrincipal({ email, organizationSlug })
    if (!principal) throw new Error('Usuario nao possui acesso ativo a esta empresa.')
    let args: unknown
    try {
      const encodedArgs = option('args-base64')
      const rawArgs = encodedArgs ? Buffer.from(encodedArgs, 'base64').toString('utf8') : option('args') || '{}'
      args = JSON.parse(rawArgs)
    } catch { throw new Error('--args precisa ser JSON valido. No PowerShell, prefira --args-base64.') }
    print(await executeAiTool({ principal, source: 'cli', toolName: positional, args }))
  } finally {
    await closePool()
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
