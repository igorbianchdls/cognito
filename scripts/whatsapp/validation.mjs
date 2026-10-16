import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync,mkdirSync,writeFileSync } from 'node:fs'
const commands=[
 ['types',['node_modules/typescript/bin/tsc','-p','tsconfig.whatsapp.json','--pretty','false']],
 ['lint',['node_modules/eslint/bin/eslint.js','src/products/mcpcore/domains/whatsapp','src/products/mcpcore/mcp/registerWhatsApp.ts','src/app/whatsapp','src/app/api/whatsapp','scripts/whatsapp']],
 ['whatsapp',['--import','tsx','scripts/whatsapp/smoke.ts']],
 ['interface',['--import','tsx','scripts/whatsapp/ui-smoke.mjs']],
 ['chatgpt-package',['scripts/chatgptplugin-package-smoke.mjs']],
 ['claude-package',['scripts/claudeplugin-package-smoke.mjs']]
]
mkdirSync('.cache/whatsapp',{recursive:true});const checks=[]
try{for(const [name,args]of commands){console.log('Checking '+name);const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:8*1024*1024});if(r.status!==0){console.error(r.stdout);console.error(r.stderr);throw Error(name+' failed')}checks.push(name);console.log('Passed '+name)}const shared=JSON.parse(readFileSync('.cache/tables-mcp/regression.json'));assert.equal(shared.status,'passed');assert.equal(shared.checks.length,8);const report={status:'passed',checks,sharedRegression:shared,realMeta:false,generatedAt:new Date().toISOString()};writeFileSync('.cache/whatsapp/regression.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))}catch(e){writeFileSync('.cache/whatsapp/regression.json',JSON.stringify({status:'failed',checks,error:e.message}));process.exitCode=1}
