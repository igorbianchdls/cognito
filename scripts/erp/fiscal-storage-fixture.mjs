import assert from 'node:assert/strict'

/** Test process only: keep rollback suites from leaving private objects in production Storage. */
export function installFiscalStorageFixture(){
 const originalFetch=globalThis.fetch,original={url:process.env.ERP_FISCAL_SUPABASE_URL,key:process.env.ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY,database:process.env.SUPABASE_DB_URL}
 const ref=original.database?decodeURIComponent(new URL(original.database).username).split('.')[1]:'mtadnxqoqxzbdksktwdr'
 assert(/^[a-z0-9]{20}$/.test(ref));const origin=`https://${ref}.supabase.co`,objects=new Map();let calls=0
 process.env.ERP_FISCAL_SUPABASE_URL=origin;process.env.ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY='sb_secret_fiscal_test_fixture'
 if(!original.database)process.env.SUPABASE_DB_URL=`postgresql://postgres.${ref}:fixture@localhost/postgres`
 globalThis.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url)
  if(!url.pathname.startsWith('/storage/v1/object/')||!url.pathname.includes('/erp-fiscal/'))return originalFetch(input,init)
  assert.equal(url.origin,origin,'Storage request outside the ERP project');calls++
  assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer sb_secret_fiscal_test_fixture')
  const path=url.pathname.replace(/^\/storage\/v1\/object\/(?:authenticated\/)?/,'')
  if(init?.method==='POST'){assert.equal(new Headers(init.headers).get('x-upsert'),'false');if(objects.has(path))return Response.json({error:'exists'},{status:400});objects.set(path,Buffer.from(init.body));return Response.json({Key:path})}
  const bytes=objects.get(path);return bytes?new Response(new Uint8Array(bytes),{headers:{'Content-Length':String(bytes.length),'Content-Type':'application/pdf'}}):new Response(null,{status:404})
 }
 return {report:()=>({realStorage:false,externalStorageRequests:0,fixtureRequests:calls,fixtureObjects:objects.size}),restore(){globalThis.fetch=originalFetch;for(const [key,value] of [['ERP_FISCAL_SUPABASE_URL',original.url],['ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY',original.key],['SUPABASE_DB_URL',original.database]])if(value===undefined)delete process.env[key];else process.env[key]=value}}
}
