import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import dotenv from 'dotenv'
import {migrationFile} from './schema-contract.mjs'

// Build before changing the schema or alias. --production uses production env
// with domain assignment disabled, the API equivalent of --prod --skip-domain.
const project='prj_mXGm0J5InfGNAR2lO4cHGLCrgoex'
const config=dotenv.parse(readFileSync('.env.local')),headers={Authorization:'Bearer '+config.VERCEL_TOKEN}
const paths=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean)
const included=paths.filter(path=>existsSync(path)&&(path.startsWith('src/')||path.startsWith('public/')||path.startsWith('certificates/')||(!path.includes('/')&&!path.startsWith('.env'))))
assert(included.includes('package.json'));assert(included.includes('pnpm-lock.yaml'))
const files=included.map(file=>{const bytes=readFileSync(file);return {file,sha:createHash('sha1').update(bytes).digest('hex'),size:bytes.length}})
const sourceDigest=createHash('sha256').update(JSON.stringify(files)).digest('hex')
const fiscalStorage=process.argv.includes('--fiscal-storage')
const selectedMigration=fiscalStorage?'20261010110000_fiscal_pdf_storage_prepare.sql':migrationFile
const migrationDigest=createHash('sha256').update(readFileSync('supabase/migrations/'+selectedMigration)).digest('hex')
const production=process.argv.includes('--production')
const request={name:'cognito',project,files,...(production?{target:'production',autoAssignCustomDomains:false}:{}),meta:{sharedMigrationDigest:migrationDigest,sharedMigrationVersion:selectedMigration.slice(0,14),sharedSourceDigest:sourceDigest,...(fiscalStorage?{fiscalPdfStorageVersion:'1'}:{})}}
mkdirSync('.cache/shared',{recursive:true})
writeFileSync('.cache/shared/deploy-manifest.json',JSON.stringify({project,migrationDigest,sourceDigest,files},null,2))
async function create(){const response=await fetch('https://api.vercel.com/v13/deployments',{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(60000)});return {status:response.status,data:await response.json()}}
try{
 let result=await create()
 if(result.data.error?.code==='missing_files'){
  const missing=new Set(result.data.error.missing || result.data.error.missingFiles || [])
  assert(missing.size,'Missing files response requires an explicit digest list')
  const queue=files.filter(file=>missing.has(file.sha))
  console.log(JSON.stringify({stage:'upload',files:queue.length,bytes:queue.reduce((sum,file)=>sum+file.size,0)}))
  let next=0,complete=0
  await Promise.all(Array.from({length:3},async()=>{while(next<queue.length){
   const file=queue[next++],response=await fetch('https://api.vercel.com/v2/files',{method:'POST',headers:{...headers,'content-type':'application/octet-stream','x-vercel-digest':file.sha,'x-vercel-size':String(file.size)},body:readFileSync(file.file),signal:AbortSignal.timeout(120000)})
   if(!response.ok)throw new Error('FILE_UPLOAD_HTTP_'+response.status)
   complete++;if(complete%100===0)console.log(JSON.stringify({uploaded:complete,total:queue.length}))
  }}))
  result=await create()
 }
 if(result.status>=400){writeFileSync('.cache/shared/deployment-error.json',JSON.stringify(result.data));throw new Error('DEPLOYMENT_HTTP_'+result.status+'_'+String(result.data.error?.code))}
 const deployment={id:result.data.id,url:result.data.url,project,state:result.data.readyState,migrationDigest,sourceDigest}
 assert(deployment.id && deployment.url)
 writeFileSync('.cache/shared/deployment.json',JSON.stringify(deployment,null,2));console.log(JSON.stringify(deployment))
}catch(error){console.error(JSON.stringify({stage:'failed',message:error.message}));process.exitCode=1}
