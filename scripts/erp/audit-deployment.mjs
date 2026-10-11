import assert from 'node:assert/strict';import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';import dotenv from 'dotenv';
const folder='.cache/erp-audit/deployment/',json=p=>JSON.parse(readFileSync(p)),staged=json(folder+'deployment.json'),cfg=dotenv.parse(readFileSync('.env.local')),headers={Authorization:'Bearer '+cfg.VERCEL_TOKEN,'Content-Type':'application/json'},team='team_fI5lF5U1UZOCEfHWdB4QNpua',project='prj_mXGm0J5InfGNAR2lO4cHGLCrgoex';
async function get(id){const r=await fetch(`https://api.vercel.com/v13/deployments/${id}?teamId=${team}`,{headers,signal:AbortSignal.timeout(25000)});assert(r.ok);const d=await r.json();assert.equal(d.projectId,project);return d}
const mode=process.argv[2]||'status';assert(['status','promote'].includes(mode));const deployment=await get(staged.id);
if(mode==='status'){console.log(JSON.stringify({id:deployment.id,state:deployment.readyState}));}
else{
 assert.equal(deployment.readyState,'READY');assert.equal(deployment.target,'production');
 const manifest=json(folder+'deploy-manifest.json');assert.equal(manifest.sourceDigest,staged.sourceDigest);assert.equal(deployment.meta.sharedSourceDigest,staged.sourceDigest);
 // Operational test scripts can gain new cases after the build; all application assets and configuration must match exactly.
 for(const file of manifest.files.filter(f=>!f.file.startsWith('scripts/')))assert.equal(createHash('sha1').update(readFileSync(file.file)).digest('hex'),file.sha,file.file);
 const migration='supabase/migrations/20261011150000_erp_audit_corrections.sql';assert.equal(createHash('sha256').update(readFileSync(migration)).digest('hex'),staged.migrationDigest);
 assert.equal(json('.cache/erp-audit/corrections/applied.json').status,'applied');
 for(const p of ['corrections-regression.json','credit-pagination-regression.json','portal-history-check.json'])assert.equal(json('.cache/erp-audit/'+p).status,'passed');
 assert.equal(json('.cache/dashboards/read-smoke.json').status,'passed');
 const fiscal=json('.cache/fiscal-pdf-storage/smoke.json');assert.equal(fiscal.status,'passed');assert.equal(fiscal.originalPdfsPreserved,true);
 const documents=json('.cache/commercial-documents/report.json');assert.equal(documents.originalRowsUnchanged,true);assert(documents.checks.every(c=>c.status==='passed'));
 const http=json(folder+'staged-http.json');assert.equal(http.status,'passed');assert.equal(http.deploymentId,staged.id);assert(Date.now()-Date.parse(http.generatedAt)<3600000);
 const previous=json(folder+'previous-production.json'),live=await get('cognito-seven.vercel.app');assert.equal(live.id,previous.id,'Production changed since this rollout started');
 const r=await fetch(`https://api.vercel.com/v10/projects/${project}/promote/${staged.id}?teamId=${team}`,{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(30000)});assert(r.ok,'Promotion HTTP '+r.status);
 const report={status:'promotion_requested',deploymentId:staged.id,previous:live.id,http:r.status,generatedAt:new Date().toISOString()};writeFileSync(folder+'promotion.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
