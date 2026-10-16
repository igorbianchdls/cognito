import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import dotenv from 'dotenv'
import {assertDeploymentSchedules} from '../erp/deployment-schedules.mjs'
const folder='.cache/tables-mcp/deployment/',s=JSON.parse(readFileSync(folder+'deployment.json')),env=dotenv.parse(readFileSync('.env.local'))
const r=await fetch('https://api.vercel.com/v13/deployments/cognito-seven.vercel.app?teamId=team_fI5lF5U1UZOCEfHWdB4QNpua',{headers:{Authorization:'Bearer '+env.VERCEL_TOKEN}});assert(r.ok)
const live=await r.json();assert.equal(live.id,s.id);assert.equal(live.readyState,'READY');assert.equal(live.meta.tablesMcpSourceDigest,s.sourceDigest);assertDeploymentSchedules(live)
const http=JSON.parse(readFileSync(folder+'production-http.json'));assert.equal(http.status,'passed');assert.equal(http.deploymentId,s.id)
const report={status:'published_and_verified',deploymentId:s.id,sourceDigest:s.sourceDigest,url:'https://cognito-seven.vercel.app/tables',tools:31,serverVersions:{chatgpt:'2.2.0',claude:'1.2.0'},generatedAt:new Date().toISOString()}
writeFileSync(folder+'published.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
