import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import dotenv from 'dotenv';
import {connection} from './evolution-db.mjs';
const cfg=dotenv.parse(readFileSync('.env.local')),db=connection(),report={at:new Date().toISOString(),readOnly:true};
async function vercel(path){const r=await fetch('https://api.vercel.com'+path+(path.includes('?')?'&':'?')+'teamId=team_fI5lF5U1UZOCEfHWdB4QNpua',{headers:{Authorization:'Bearer '+cfg.VERCEL_TOKEN},signal:AbortSignal.timeout(20000)});assert(r.ok,'Vercel '+r.status);return r.json()}
try{
 const meta=await vercel('/v13/deployments/cognito-seven.vercel.app');report.deployment={id:meta.id,ready:meta.readyState,crons:meta.crons??meta.config?.crons??null,createdAt:meta.createdAt};
 const project=await vercel('/v9/projects/prj_mXGm0J5InfGNAR2lO4cHGLCrgoex');report.projectCrons=project.crons??null;
 const envs=await vercel('/v10/projects/prj_mXGm0J5InfGNAR2lO4cHGLCrgoex/env');report.productionCronSecretConfigured=envs.envs.some(e=>e.key==='CRON_SECRET'&&e.target?.includes('production'));
 await db.connect();await db.query('BEGIN READ ONLY');
 report.executions=(await db.query("SELECT tipo,status,competencia::text,tentativas,iniciado_em,finalizado_em,left(erro,300) erro FROM erp.execucoes_automacao WHERE empresa_id=2 ORDER BY iniciado_em DESC NULLS LAST LIMIT 25")).rows;
 report.health=(await db.query("SELECT tipo,count(*)::int executions,max(finalizado_em) FILTER(WHERE status='concluida') last_completed FROM erp.execucoes_automacao WHERE empresa_id=2 GROUP BY tipo ORDER BY tipo")).rows;
 report.actorEligibility=(await db.query("SELECT m.usuario_id,m.role,m.suspenso_localmente,u.status user_status FROM shared.usuarios_empresas m JOIN shared.empresas e ON e.id=m.empresa_id AND e.status='active' JOIN shared.usuarios u ON u.id=m.usuario_id AND u.clerk_user_id IS NOT NULL WHERE m.empresa_id=2 AND m.status='active' AND m.role IN ('owner','admin') ORDER BY m.usuario_id")).rows;
 await db.query('ROLLBACK');
 report.http=[];for(const path of ['/api/erp/internal/automacoes','/api/chatgptplugin/internal/maintenance'])for(const wrong of [false,true]){const r=await fetch('https://cognito-seven.vercel.app'+path,{headers:wrong?{Authorization:'Bearer QA-OTTO-INVALID'}:{},redirect:'manual',signal:AbortSignal.timeout(20000)});assert.equal(r.status,401);report.http.push({path,invalidToken:wrong,status:r.status})}
 mkdirSync('.cache/erp-scheduler',{recursive:true});writeFileSync('.cache/erp-scheduler/production-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await db.end()}
