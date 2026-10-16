import {spawnSync} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
const commands=[
 ['types',['node_modules/typescript/bin/tsc','-p','tsconfig.tables-mcp.json','--pretty','false']],
 ['tables',['scripts/tables/smoke.mjs']],
 ['mcp-tables',['--import','tsx','scripts/tables/mcp-smoke.ts']],
 ['chatgpt',['--import','tsx','scripts/chatgptplugin-smoke.ts']],
 ['claude',['--import','tsx','scripts/claudeplugin-smoke.ts']],
 ['descriptions',['--import','tsx','scripts/chatgptplugin-tool-documentation-smoke.ts']],
 ['protocol',['--import','tsx','scripts/chatgptplugin-mrtr-smoke.ts']],
 ['oauth',['--import','tsx','scripts/chatgptplugin-auth-smoke.ts']],
]
const checks=[];mkdirSync('.cache/tables-mcp',{recursive:true})
for(const [name,args]of commands){console.log('Checking '+name);const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:8*1024*1024});if(r.status!==0){console.error(r.stdout);console.error(r.stderr);writeFileSync('.cache/tables-mcp/regression.json',JSON.stringify({status:'failed',checks,failed:name}));process.exit(1)}checks.push(name);console.log('Passed '+name)}
writeFileSync('.cache/tables-mcp/regression.json',JSON.stringify({status:'passed',checks,generatedAt:new Date().toISOString()},null,2));console.log(JSON.stringify({status:'passed',checks}))
