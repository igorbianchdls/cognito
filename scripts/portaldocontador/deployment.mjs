import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import dotenv from 'dotenv'
const cfg=dotenv.parse(readFileSync('.env.local')),headers={Authorization:'Bearer '+cfg.VERCEL_TOKEN,'Content-Type':'application/json'},project='prj_mXGm0J5InfGNAR2lO4cHGLCrgoex',team='team_fI5lF5U1UZOCEfHWdB4QNpua'
const json=file=>JSON.parse(readFileSync(file)),staged=json('.cache/shared/deployment.json'),mode=process.argv[2];assert(['status','promote'].includes(mode))
async function get(id){const response=await fetch(`https://api.vercel.com/v13/deployments/${id}?teamId=${team}`,{headers,signal:AbortSignal.timeout(25000)});assert(response.ok);const value=await response.json();assert.equal(value.projectId,project);return value}
const current=await get(staged.id)
if(mode==='status'){console.log(JSON.stringify({id:current.id,state:current.readyState,url:current.url}));if(current.readyState==='ERROR')process.exitCode=1}
else{
 assert.equal(current.readyState,'READY');assert.equal(current.target,'production')
 for(const file of ['.cache/shared/smoke.json','.cache/portaldocontador/smoke.json','.cache/portaldocontador/typecheck.json'])assert.equal(json(file).status,'passed',file)
 const database=json('.cache/portaldocontador/database-applied.json');assert.equal(database.applied,true);assert.equal(database.digest,createHash('sha256').update(readFileSync('supabase/migrations/'+database.migration)).digest('hex'))
 const http=json('.cache/portaldocontador/staged-http.json');assert.equal(http.status,'passed');assert.equal(http.deploymentId,staged.id);assert.equal(http.realEmailsSent,0)
 const manifest=json('.cache/shared/deploy-manifest.json');assert.equal(manifest.sourceDigest,staged.sourceDigest);assert.equal(current.meta.sharedSourceDigest,staged.sourceDigest)
 for(const file of manifest.files)assert.equal(createHash('sha1').update(readFileSync(file.file)).digest('hex'),file.sha,'Staged source changed: '+file.file)
 const live=await get('cognito-seven.vercel.app');assert.equal(live.id,json('.cache/workspace-ui/previous-production.json').id,'Production changed during validation')
 const response=await fetch(`https://api.vercel.com/v10/projects/${project}/promote/${staged.id}?teamId=${team}`,{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(30000)});assert(response.ok,'Promotion HTTP '+response.status)
 const proof={status:'published',previous:live.id,deploymentId:staged.id,http:response.status,at:new Date().toISOString()};writeFileSync('.cache/portaldocontador/promotion.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof))
}
