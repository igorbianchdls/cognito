import { readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,lstatSync,rmSync } from 'node:fs';
import { resolve,dirname,relative,sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePackageZip } from './chatgptplugin-package.mjs';

// Pacote do plugin do Claude: manifesto em .claude-plugin/plugin.json, conector remoto em .mcp.json,
// skills e README. Gerado por lista explícita: nunca leva .env, credenciais ou código do servidor.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=resolve(root,'src/products/claudeplugin/plugin');
export const SOURCE_FILES=['.claude-plugin/plugin.json','README.md','skills/usar-erp/SKILL.md','skills/get-started/SKILL.md'];
export const PACKAGE_FILES=[...SOURCE_FILES,'.mcp.json'].sort();
export const MCP_PATH='/api/claude/mcp';

function fail(message){throw new Error(message)}
function words(markdown){return markdown.replace(/```[\s\S]*?```/g,' ').split(/\s+/).filter(word=>/[\p{L}\p{N}]/u.test(word)).length}
function frontmatter(text){const match=/^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);if(!match)return null;
  return Object.fromEntries(match[1].split(/\r?\n/).map(line=>/^([a-z_-]+):\s*(.*)$/.exec(line)).filter(Boolean).map(m=>[m[1],m[2].trim()]))}

// Confere o conteúdo do pacote (mapa caminho → Buffer) contra as regras de plugins do Claude.
export function validateEntries(entries){
  const names=[...entries.keys()].sort();
  for(const name of names){
    if(name.includes('\\')||name.startsWith('/')||name.split('/').includes('..'))fail(`Caminho inválido: ${name}`);
    if(name.split('/')[0]==='bin')fail('Pasta bin/ impede a instalação no claude.ai e no Cowork.');
    if(/(^|\/)\.env/.test(name))fail('O pacote não pode conter arquivos .env.');
  }
  if(JSON.stringify(names)!==JSON.stringify(PACKAGE_FILES))fail(`Arquivos do pacote diferentes do esperado: ${names.join(', ')}`);
  const text=name=>entries.get(name).toString('utf8');
  for(const name of names)if(/sk_(live|test)_|whsec_|CLERK_SECRET|SUPABASE_DB_URL|-----BEGIN|authorization/i.test(text(name)))fail(`Possível segredo em ${name}.`);
  let manifest;try{manifest=JSON.parse(text('.claude-plugin/plugin.json'))}catch{fail('plugin.json inválido.')}
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name||''))fail('name deve ter letras minúsculas e hífens.');
  if(!/^\d+\.\d+\.\d+$/.test(manifest.version||''))fail('version deve seguir x.y.z.');
  if(typeof manifest.description!=='string'||manifest.description.length<20)fail('description obrigatória.');
  if(!manifest.author||typeof manifest.author.name!=='string'||!manifest.author.name)fail('author.name obrigatório.');
  if(typeof manifest.license!=='string'||!manifest.license)fail('license obrigatória para publicar no diretório.');
  if(words(text('README.md'))<40)fail('README precisa de pelo menos 40 palavras.');
  let mcp;try{mcp=JSON.parse(text('.mcp.json'))}catch{fail('.mcp.json inválido.')}
  const servers=Object.entries(mcp.mcpServers||{});
  if(servers.length!==1)fail('.mcp.json deve declarar um servidor.');
  const [,server]=servers[0];
  if(server.type!=='http'||Object.keys(server).some(key=>!['type','url'].includes(key)))fail('O conector deve ser remoto: apenas type http e url.');
  const url=new URL(server.url);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!==MCP_PATH)fail(`A URL do conector deve ser HTTPS e terminar em ${MCP_PATH}.`);
  const skills=names.filter(name=>/^skills\/[^/]+\/SKILL\.md$/.test(name));
  if(!skills.length)fail('Nenhuma skill encontrada.');
  for(const name of skills){
    const folder=name.split('/')[1],meta=frontmatter(text(name));
    if(!meta)fail(`${name} sem frontmatter.`);
    if(meta.name!==folder||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.name)||meta.name.length>64)fail(`${name}: name deve ser igual à pasta (${folder}).`);
    if(!meta.description||meta.description.length>1024)fail(`${name}: description obrigatória, até 1024 caracteres.`);
  }
  return {name:manifest.name,version:manifest.version,mcp:server.url,skills:skills.length,files:names.length};
}
// Lê um ZIP sem compressão (como o gerado aqui) e devolve o mapa de entradas.
export function readStoredZip(buffer){
  const end=buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));if(end<0)fail('ZIP sem diretório central.');
  const count=buffer.readUInt16LE(end+10);let offset=buffer.readUInt32LE(end+16);const entries=new Map();
  for(let i=0;i<count;i++){
    if(buffer.readUInt32LE(offset)!==0x02014b50)fail('ZIP corrompido.');
    const method=buffer.readUInt16LE(offset+10),size=buffer.readUInt32LE(offset+20),nameLength=buffer.readUInt16LE(offset+28),extra=buffer.readUInt16LE(offset+30),comment=buffer.readUInt16LE(offset+32),local=buffer.readUInt32LE(offset+42);
    const name=buffer.subarray(offset+46,offset+46+nameLength).toString('utf8');if(method!==0)fail('ZIP com compressão não suportada na validação.');
    const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28);entries.set(name,buffer.subarray(start,start+size));
    offset+=46+nameLength+extra+comment;
  }
  return entries;
}
function collect(directory){const entries=new Map();
  (function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);
    if(entry.isSymbolicLink())fail('O pacote não aceita links.');if(entry.isDirectory())walk(path);else entries.set(relative(directory,path).split(sep).join('/'),readFileSync(path))}})(directory);
  return entries}
export function validateClaudePackage(directory,archive){
  const fromFolder=validateEntries(collect(directory));
  if(archive){const zipped=readStoredZip(readFileSync(archive));validateEntries(zipped);
    for(const [name,data] of collect(directory))if(!zipped.get(name)?.equals(data))fail(`ZIP diferente da pasta em ${name}.`)}
  return {...fromFolder,zip:Boolean(archive)};
}
export function buildClaudePackage(baseUrl,output=resolve(root,'dist/claudeplugin')){
  const url=new URL(baseUrl);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')fail('Informe a origem HTTPS pública do servidor, sem caminho ou credenciais.');
  const target=resolve(output),dist=resolve(root,'dist');
  if(!target.startsWith(dist+sep))fail('O pacote deve ficar dentro de dist.');
  if(existsSync(target)){if(lstatSync(target).isSymbolicLink())fail('A pasta de saída deve ser local ao projeto.');rmSync(target,{recursive:true})}
  const entries=new Map(SOURCE_FILES.map(file=>{const input=resolve(source,file);if(!lstatSync(input).isFile())fail(`Arquivo de origem inválido: ${file}`);return [file,readFileSync(input)]}));
  entries.set('.mcp.json',Buffer.from(JSON.stringify({mcpServers:{'cognito-erp':{type:'http',url:url.origin+MCP_PATH}}},null,2)+'\n'));
  validateEntries(entries);
  for(const [file,data] of entries){const destination=resolve(target,file);mkdirSync(dirname(destination),{recursive:true});writeFileSync(destination,data)}
  // ZIP com o conteúdo da pasta na raiz: .claude-plugin/plugin.json fica no primeiro nível, como pede o upload.
  const archive=target+'.zip';
  writeFileSync(archive,encodePackageZip([...entries].sort(([a],[b])=>a.localeCompare(b)).map(([name,data])=>({name,data}))));
  return {directory:target,archive,...validateClaudePackage(target,archive)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const index=process.argv.indexOf('--url');
    const base=index>=0?process.argv[index+1]:process.env.CLAUDEPLUGIN_BASE_URL;
    if(!base)fail('Configure CLAUDEPLUGIN_BASE_URL ou informe --url com o domínio HTTPS do servidor.');
    console.log(JSON.stringify(buildClaudePackage(base),null,2));
  }catch(error){console.error(error.message);process.exitCode=1}
}
