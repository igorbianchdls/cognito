import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import dotenv from 'dotenv'
const cache='.cache/service-invoice/',json=path=>JSON.parse(readFileSync(path)),cfg=dotenv.parse(readFileSync('.env.local'))
const headers={Authorization:'Bearer '+cfg.VERCEL_TOKEN,'Content-Type':'application/json'},team='team_fI5lF5U1UZOCEfHWdB4QNpua',project='prj_mXGm0J5InfGNAR2lO4cHGLCrgoex'
async function get(target){const response=await fetch('https://api.vercel.com/v13/deployments/'+target+'?teamId='+team,{headers,signal:AbortSignal.timeout(20000)});assert(response.ok);const data=await response.json();assert.equal(data.projectId,project);return data}
const mode=process.argv[2];assert(['snapshot','status','promote'].includes(mode));mkdirSync(cache,{recursive:true})
if(mode==='snapshot'){const live=await get('cognito-seven.vercel.app');writeFileSync(cache+'previous-production.json',JSON.stringify({id:live.id,url:live.url}));console.log(JSON.stringify({previous:live.id}))}
else{
 const staged=json('.cache/shared/deployment.json'),meta=await get(staged.id)
 if(mode==='status'){console.log(JSON.stringify({id:meta.id,state:meta.readyState,url:meta.url}));if(meta.readyState==='ERROR'){const response=await fetch('https://api.vercel.com/v3/deployments/'+staged.id+'/events?teamId='+team,{headers});const logs=await response.json();const errors=logs.filter(l=>l.type==='stderr'||/error|failed/i.test(l.payload?.text||'')).map(l=>l.payload?.text);console.log(JSON.stringify({errors}));process.exitCode=1}}
 else{
  assert.equal(meta.readyState,'READY');assert.equal(meta.target,'production')
  const manifest=json('.cache/shared/deploy-manifest.json');assert.equal(manifest.sourceDigest,staged.sourceDigest);assert.equal(meta.meta.sharedSourceDigest,staged.sourceDigest)
  for(const file of manifest.files)assert.equal(createHash('sha1').update(readFileSync(file.file)).digest('hex'),file.sha)
  const proof=json(cache+'staged-reads.json'),application=json(cache+'application.json'),test=json(cache+'smoke.json')
  assert.equal(proof.status,'passed');assert.equal(proof.deploymentId,staged.id);assert(proof.results.length>=15);assert.equal(proof.crud,true)
  assert.equal(application.status,'applied_and_verified');assert.equal(application.digest,test.digest);assert.equal(application.deploymentId,staged.id)
  assert.equal(application.businessRecordsPreserved,true);assert.equal(application.noExternalFiscalApi,true)
  const live=await get('cognito-seven.vercel.app');assert.equal(live.id,json(cache+'previous-production.json').id,'Production changed during staging')
  const response=await fetch('https://api.vercel.com/v10/projects/'+project+'/promote/'+staged.id+'?teamId='+team,{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(30000)});assert(response.ok,'Promotion HTTP '+response.status)
  const result={previous:live.id,deploymentId:staged.id,http:response.status};writeFileSync(cache+'promotion.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result))
 }
}
