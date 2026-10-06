import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import dotenv from 'dotenv'
const cfg=dotenv.parse(readFileSync('.env.local')),staged=JSON.parse(readFileSync('.cache/shared/deployment.json')),manifest=JSON.parse(readFileSync('.cache/shared/deploy-manifest.json')),team='team_fI5lF5U1UZOCEfHWdB4QNpua',project='prj_mXGm0J5InfGNAR2lO4cHGLCrgoex',headers={Authorization:'Bearer '+cfg.VERCEL_TOKEN,'Content-Type':'application/json'}
for(const path of ['application','repository-smoke','staged-http'])assert.equal(JSON.parse(readFileSync('.cache/entity-categories/'+path+'.json')).status,'passed')
assert.equal(JSON.parse(readFileSync('.cache/entity-categories/staged-http.json')).deploymentId,staged.id)
assert.equal(staged.project,project);assert.equal(staged.sourceDigest,manifest.sourceDigest)
for(const file of manifest.files)assert.equal(createHash('sha1').update(readFileSync(file.file)).digest('hex'),file.sha,'Staged source changed')
async function deployment(id){const response=await fetch('https://api.vercel.com/v13/deployments/'+id+'?teamId='+team,{headers,signal:AbortSignal.timeout(25000)});assert(response.ok);return response.json()}
const target=await deployment(staged.id);assert.equal(target.projectId,project);assert.equal(target.readyState,'READY');assert.equal(target.target,'production');assert.equal(target.meta.sharedSourceDigest,staged.sourceDigest)
const previous=await deployment('cognito-seven.vercel.app');assert.equal(previous.projectId,project);assert.equal(previous.id,'dpl_Chh7WmKeaNMkdcQgRV2v1JsYnH5U','Production changed during validation')
const response=await fetch('https://api.vercel.com/v10/projects/'+project+'/promote/'+staged.id+'?teamId='+team,{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(30000)});assert(response.ok,'Promotion HTTP '+response.status)
const report={status:'published',previous:previous.id,deploymentId:staged.id,http:response.status};writeFileSync('.cache/entity-categories/promotion.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
