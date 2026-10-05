import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const manifest=JSON.parse(readFileSync('package.json','utf8'))
let text=Object.values(manifest.scripts).join('\n')
function readTree(folder) {
  for(const entry of readdirSync(folder,{withFileTypes:true})) {
    const path=join(folder,entry.name)
    if(entry.isDirectory()) readTree(path)
    else if(/\.(?:[cm]?js|tsx?|json|css|scss)$/.test(path)) text+='\n'+readFileSync(path,'utf8')
  }
}
for(const folder of ['src','scripts','services','templates']) readTree(folder)
for(const entry of readdirSync('.')) if(/(?:config\.[cm]?js|config\.ts)$/.test(entry)) text+='\n'+readFileSync(entry,'utf8')
// CLI commands and build plugins can be used without an import.
const keep=new Set(['@remotion/cli','autoprefixer','tailwindcss-animate','tailwind-scrollbar-hide','@types/papaparse','@supabase/supabase-js'])
const unused=Object.keys(manifest.dependencies).filter(name=>!keep.has(name)&&!text.includes(name))
mkdirSync('.cache/erp-audit',{recursive:true})
writeFileSync('.cache/erp-audit/unused-dependencies.json',JSON.stringify({scan:['src','scripts','services','templates','root configs','package scripts'],unused},null,2))
if(process.argv.includes('--apply')) {
  for(const name of unused) delete manifest.dependencies[name]
  writeFileSync('package.json',JSON.stringify(manifest,null,2)+'\n')
}
console.log(JSON.stringify({removed:process.argv.includes('--apply')?unused:[],candidates:unused.length}))
