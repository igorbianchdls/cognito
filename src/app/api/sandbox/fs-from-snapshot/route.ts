import { Sandbox } from '@vercel/sandbox'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { snapshotId, path } = await req.json().catch(() => ({})) as { snapshotId?: string; path?: string }
    if (!snapshotId) return NextResponse.json({ ok: false, error: 'snapshotId obrigatório' }, { status: 400 })
    const target = (path || '/vercel/sandbox').toString()
    const t0 = Date.now()
    const sandbox = await Sandbox.create({ source: { type: 'snapshot', snapshotId } })
    const tCreate = Date.now() - t0
    const script = `
const fs = require('fs');
const p = process.env.TARGET_PATH;
function list(dir){
  try{
    const out = [];
    const ents = fs.readdirSync(dir, { withFileTypes: true });
    for (const d of ents){
      if (d.name === 'node_modules' || d.name === '.cache') continue;
      const obj = { name: d.name, type: d.isDirectory()?'dir':'file' };
      out.push(obj);
    }
    return out;
  }catch(e){ return { error: String(e?.message||e) } }
}
console.log(JSON.stringify(list(p)));
`
    const run = await sandbox.runCommand({ cmd: 'node', args: ['-e', script], env: { TARGET_PATH: target } })
    const [out, err] = await Promise.all([run.stdout().catch(()=>''), run.stderr().catch(()=> '')])
    try { await sandbox.stop() } catch {}
    if (run.exitCode !== 0) return NextResponse.json({ ok: false, error: err || out || 'falha ao listar' }, { status: 500 })
    let entries: Array<{ name: string; type: 'dir'|'file' }> = []
    try { entries = JSON.parse(out) } catch { entries = [] }
    return NextResponse.json({ ok: true, createMs: tCreate, path: target, entries })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

