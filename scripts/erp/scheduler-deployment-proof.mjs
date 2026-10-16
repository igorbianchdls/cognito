import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { assertDeploymentSchedules, deploymentSchedules } from './deployment-schedules.mjs'
const cfg=dotenv.parse(readFileSync('.env.local'))
const staged=JSON.parse(readFileSync('.cache/registration-fixes/deployment/deployment.json'))
const production=process.argv.includes('--production')
const target=production?'cognito-seven.vercel.app':staged.id
async function get(path){const r=await fetch('https://api.vercel.com'+path+'?teamId=team_fI5lF5U1UZOCEfHWdB4QNpua',{headers:{Authorization:'Bearer '+cfg.VERCEL_TOKEN},signal:AbortSignal.timeout(20000)});assert(r.ok,'Vercel HTTP '+r.status);return r.json()}
const d=await get('/v13/deployments/'+target)
assert.equal(d.projectId,'prj_mXGm0J5InfGNAR2lO4cHGLCrgoex')
if(d.readyState!=='READY'){console.log(JSON.stringify({id:d.id,state:d.readyState,crons:d.crons}));process.exit(0)}
assertDeploymentSchedules(d)
assert.equal(d.id,staged.id)
const proof={at:new Date().toISOString(),deploymentId:d.id,state:d.readyState,crons:d.crons,production,physicalClockTriggerVerified:false}
if(production){const p=await get('/v9/projects/'+d.projectId);assert.equal(p.crons.deploymentId,d.id);assert(!p.crons.disabledAt);assertDeploymentSchedules({crons:p.crons.definitions});proof.projectCrons=p.crons}
assert.equal(d.crons.length,deploymentSchedules().crons.length)
writeFileSync('.cache/erp-scheduler/'+(production?'production-fixed':'candidate')+'.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof))
