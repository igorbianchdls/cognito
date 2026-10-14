import {readFileSync,existsSync} from 'node:fs'
import {resolve,dirname} from 'node:path'
import {createRequire} from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
const require=createRequire(import.meta.url)
export function sourceLoader(overrides={}){
 const cache=new Map()
 function load(name,parent=resolve('entry.ts')){
  if(name in overrides)return overrides[name]
  if(!name.startsWith('.')&&!name.startsWith('@/')&&!name.startsWith(resolve('.')))return require(name)
  let file=name.startsWith('@/')?resolve('src',name.slice(2)):resolve(dirname(parent),name)
  if(!existsSync(file))file=['.ts','.tsx','/index.ts'].map(s=>file+s).find(existsSync)
  if(!file)throw Error('Missing module '+name)
  if(cache.has(file))return cache.get(file).exports
  const record={exports:{}};cache.set(file,record)
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(n=>load(n,file),record,record.exports)
  return record.exports
 }
 return load
}
