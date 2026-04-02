import type { Sandbox } from '@vercel/sandbox'

import { detectArtifactFromDsl } from '@/products/chat/backend/features/artifacts/dslArtifactDetection'
import { upsertArtifact } from '@/products/chat/backend/features/artifacts/artifactStore'

type SandboxDslEntry = {
  path: string
  content: string
}

async function readDslEntriesFromSandbox(sandbox: Sandbox): Promise<SandboxDslEntry[]> {
  const script = `
const fs = require('fs');
const path = require('path');
const roots = ['/vercel/sandbox/dashboard', '/vercel/sandbox/report', '/vercel/sandbox/slide'];
const out = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs);
    else if (entry.isFile() && (abs.endsWith('.dsl') || abs.endsWith('.tsx'))) {
      try {
        out.push({ path: abs, content: fs.readFileSync(abs, 'utf8') });
      } catch {}
    }
  }
}
for (const root of roots) walk(root);
process.stdout.write(JSON.stringify(out));
`
  const run = await sandbox.runCommand({ cmd: 'node', args: ['-e', script] })
  const stdout = await run.stdout().catch(() => '')
  if (run.exitCode !== 0) return []
  try {
    const parsed = JSON.parse(stdout || '[]')
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item.path === 'string' && typeof item.content === 'string')
      : []
  } catch {
    return []
  }
}

export async function registerArtifactsFromSnapshot(params: {
  chatId: string
  snapshotId: string
  sandbox: Sandbox
}): Promise<void> {
  const { chatId, snapshotId, sandbox } = params
  const entries = await readDslEntriesFromSandbox(sandbox)
  for (const entry of entries) {
    const detected = detectArtifactFromDsl(entry.path, entry.content)
    if (!detected) continue
    await upsertArtifact({
      type: detected.type,
      title: detected.title,
      chatId,
      snapshotId,
      filePath: detected.filePath,
      metadata: {
        ...detected.metadata,
        byteLength: entry.content.length,
      },
    })
  }
}
