import { readFileSync,readdirSync,lstatSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import yaml from 'js-yaml';
import { XMLValidator,XMLParser } from 'fast-xml-parser';
import pluginSchema from './chatgptplugin-plugin-schema.mjs';
import mcpSchema from './chatgptplugin-mcp-schema.mjs';

// Offline validation of this product's portable package. Published schemas are
// pinned alongside this file. OpenAI semantic checks: submission-errors docs.
export const PACKAGE_FILES=['plugin.json','assets/icon.svg','skills/usar-erp/SKILL.md','skills/usar-erp/agents/openai.yaml','skills/get-started/SKILL.md','skills/get-started/agents/openai.yaml','mcp.json','README.md'];
const MiB=1024*1024,decoder=new TextDecoder('utf-8',{fatal:true});
const ajv=new Ajv2020({allErrors:true,strict:true});
const manifestValidator=ajv.compile(pluginSchema),mcpValidator=ajv.compile(mcpSchema);
function demand(condition,message){if(!condition)throw new Error(message);}
function object(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function text(value,label,max=1024,multiline=false){
  demand(typeof value==='string'&&value.trim().length>0&&[...value].length<=max,label+': texto vazio, inválido ou longo demais.');
  demand(!/[\p{Cc}\p{Cf}]/u.test(multiline?value.replace(/[\r\n\t]/g,''):value),label+': caracteres de controle não permitidos.');
}
function https(value,label,max=2048){
  text(value,label,max);let url;try{url=new URL(value)}catch{throw new Error(label+': URL inválida.');}
  demand(url.protocol==='https:'&&url.hostname&&!url.username&&!url.password,label+': use HTTPS sem credenciais.');return url;
}
function filename(name){
  demand(typeof name==='string'&&name.length>0&&!/[\\\p{Cc}\p{Cf}:]/u.test(name)&&!name.startsWith('/')&&name.split('/').length<=20&&name.split('/').every(p=>p&&p!=='.'&&p!=='..'),'Caminho inválido no pacote.');
  return name.normalize('NFC').toLowerCase();
}
export function crc32(data){let crc=0xffffffff;for(const byte of data){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
export function readPackageZip(buffer){
  demand(Buffer.isBuffer(buffer)&&buffer.length>=22&&buffer.length<=100*MiB,'ZIP ausente, truncado ou maior que 100 MiB.');
  const end=buffer.length-22;demand(buffer.readUInt32LE(end)===0x06054b50,'ZIP sem diretório final válido.');
  demand(buffer.readUInt16LE(end+4)===0&&buffer.readUInt16LE(end+6)===0&&buffer.readUInt16LE(end+20)===0,'ZIP deve usar um volume sem comentário.');
  const count=buffer.readUInt16LE(end+10),centralSize=buffer.readUInt32LE(end+12),centralStart=buffer.readUInt32LE(end+16);
  demand(count>0&&count<=5000&&count===buffer.readUInt16LE(end+8)&&centralStart+centralSize===end,'Diretório ZIP inconsistente.');
  let position=centralStart,localEnd=0,total=0;const entries=new Map(),names=new Set();
  for(let index=0;index<count;index++){
    demand(position+46<=end&&buffer.readUInt32LE(position)===0x02014b50,'Entrada ZIP inválida.');
    const flags=buffer.readUInt16LE(position+8),method=buffer.readUInt16LE(position+10),crc=buffer.readUInt32LE(position+16),compressed=buffer.readUInt32LE(position+20),size=buffer.readUInt32LE(position+24),length=buffer.readUInt16LE(position+28),extra=buffer.readUInt16LE(position+30),comment=buffer.readUInt16LE(position+32),offset=buffer.readUInt32LE(position+42);
    demand(flags===0x800&&method===0&&compressed===size&&extra===0&&comment===0&&buffer.readUInt16LE(position+34)===0&&buffer.readUInt32LE(position+38)===0,'Formato ZIP diferente do exportador (arquivos regulares, UTF-8, sem criptografia, método stored).');
    demand(position+46+length<=end&&offset===localEnd&&offset+30<=centralStart&&size<=100*MiB,'Tamanho ou posição ZIP inválida.');
    const name=decoder.decode(buffer.subarray(position+46,position+46+length)),normalized=filename(name);
    demand(!names.has(normalized),'Arquivo ZIP duplicado após normalização.');names.add(normalized);
    const start=offset+30+length,next=start+size;
    demand(next<=centralStart&&buffer.readUInt32LE(offset)===0x04034b50&&buffer.readUInt16LE(offset+6)===flags&&buffer.readUInt16LE(offset+8)===method&&buffer.readUInt32LE(offset+14)===crc&&buffer.readUInt32LE(offset+18)===compressed&&buffer.readUInt32LE(offset+22)===size&&buffer.readUInt16LE(offset+26)===length&&buffer.readUInt16LE(offset+28)===0&&buffer.subarray(offset+30,start).equals(buffer.subarray(position+46,position+46+length)),'Cabeçalhos ZIP divergentes.');
    const data=buffer.subarray(start,next);demand(crc32(data)===crc,'CRC inválido: arquivo ZIP corrompido.');
    total+=size;demand(total<=512*MiB,'Pacote descompactado maior que 512 MiB.');entries.set(name,data);localEnd=next;position+=46+length;
  }
  demand(position===end&&localEnd===centralStart,'ZIP contém regiões extras ou truncadas.');return entries;
}
function colorContrast(color,background){
  const luminance=hex=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;};
  const a=luminance(color),b=luminance(background);return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
}
function json(entries,name){const raw=entries.get(name);demand(raw,name+': arquivo ausente.');let value;try{value=JSON.parse(decoder.decode(raw))}catch{throw new Error(name+': JSON UTF-8 inválido.');}demand(object(value),name+': deve conter um objeto JSON.');return value;}
export function validatePackageEntries(entries,{requirePublication=false}={}){
  demand(entries instanceof Map,'Forneça arquivos do pacote.');
  const normalized=new Set();for(const [name,data] of entries){const value=filename(name);demand(!normalized.has(value),'Nome duplicado após normalização.');normalized.add(value);demand(Buffer.isBuffer(data)&&data.length<=100*MiB,'Arquivo inválido ou muito grande.');}
  demand(entries.size===PACKAGE_FILES.length&&PACKAGE_FILES.every(name=>entries.has(name)),'O pacote deve conter exatamente os arquivos previstos; extras podem conter segredos.');
  const manifest=json(entries,'plugin.json'),mcp=json(entries,'mcp.json');
  demand(manifestValidator(manifest),'plugin.json não segue Agent Plugins 1.0.0: '+ajv.errorsText(manifestValidator.errors));
  demand(mcpValidator(mcp),'mcp.json não segue Agent Plugins 1.0.0: '+ajv.errorsText(mcpValidator.errors));
  demand(manifest.name==='chatgptplugin','Nome do produto inválido.');
  text(manifest.version,'version',64);demand(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(manifest.version),'Use uma versão SemVer.');
  const prerelease=manifest.version.split('+')[0].split('-').slice(1).join('-');
  demand(prerelease.split('.').every(part=>!/^0\d+$/.test(part)),'SemVer não aceita identificador numérico de pré-versão com zero inicial.');
  text(manifest.description,'description',1024,true);text(manifest.author?.name,'author.name',120);
  if(manifest.author.email!==undefined)text(manifest.author.email,'author.email',320);
  if(manifest.author.url!==undefined)https(manifest.author.url,'author.url');
  for(const field of ['homepage','repository'])if(manifest[field]!==undefined)https(manifest[field],field);
  for(const keyword of manifest.keywords||[])text(keyword,'keyword',120);
  const extension=manifest.extensions?.['com.openai'];demand(object(extension),'Extensão com.openai ausente.');
  demand(Object.keys(extension).every(k=>['interface','onboardingSkill'].includes(k)),'Extensão ainda não suportada por este perfil de pacote.');
  const ui=extension.interface;demand(object(ui),'interface deve ser objeto.');
  demand(Object.keys(ui).every(k=>['displayName','shortDescription','longDescription','developerName','category','capabilities','defaultPrompt','brandColor','logo','composerIcon','websiteURL','privacyPolicyURL','termsOfServiceURL','supportURL'].includes(k)),'Campo de interface desconhecido.');
  text(ui.displayName,'displayName',30);text(ui.shortDescription,'shortDescription',30);text(ui.longDescription,'longDescription',4000,true);text(ui.developerName,'developerName',80);
  demand(['Productivity','Creativity','Developer Tools','Business & Operations','Data & Analytics','Communication','Education & Research','Security','Finance','Healthcare','Travel','Entertainment','Other'].includes(ui.category),'Categoria inválida.');
  demand(Array.isArray(ui.capabilities)&&ui.capabilities.length<=20,'Capacidades inválidas.');for(const cap of ui.capabilities)text(cap,'capability',120);
  const prompts=typeof ui.defaultPrompt==='string'?[ui.defaultPrompt]:ui.defaultPrompt;demand(Array.isArray(prompts)&&prompts.length>0&&prompts.length<=3,'Prompts inválidos.');for(const prompt of prompts)text(prompt,'defaultPrompt',128);
  demand(/^#[0-9A-Fa-f]{6}$/.test(ui.brandColor)&&colorContrast(ui.brandColor,'#FFFFFF')>=2,'Cor da marca inválida ou sem contraste.');
  const pending=[];for(const field of ['websiteURL','privacyPolicyURL','termsOfServiceURL','supportURL']){if(ui[field]===undefined)pending.push(field);else https(ui[field],field,1024);}
  for(const field of ['logo','composerIcon']){const path=ui[field];demand(typeof path==='string'&&path.startsWith('./'),'Ícone deve usar caminho relativo ./');filename(path.slice(2));demand(path==='./assets/icon.svg'&&entries.has(path.slice(2)),'Ícone ausente ou fora de assets.');}
  const svg=decoder.decode(entries.get('assets/icon.svg'));
  demand(XMLValidator.validate(svg)===true&&!/<!DOCTYPE|<!ENTITY|<(?:script|foreignObject|iframe)\b|\bon\w+\s*=|(?:href|src)\s*=|url\s*\(/i.test(svg),'Ícone SVG inválido ou com conteúdo ativo/externo.');
  const image=new XMLParser({ignoreAttributes:false}).parse(svg).svg;demand(image?.['@_viewBox']==='0 0 128 128'&&String(image['@_width'])==='128'&&String(image['@_height'])==='128','Ícone precisa ser quadrado 128×128.');
  const skills=new Set();
  for(const folder of ['usar-erp','get-started']){
    const name=`skills/${folder}/SKILL.md`,contents=decoder.decode(entries.get(name)),front=/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(contents);
    demand(front,'Skill sem cabeçalho YAML ou instruções.');const metadata=yaml.load(front[1],{schema:yaml.JSON_SCHEMA});demand(object(metadata),'Skill deve conter mapeamento YAML.');
    text(metadata.name,'skill.name',64);demand(metadata.name===folder&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name)&&`${manifest.name}:${metadata.name}`.length<=64&&!skills.has(metadata.name),'Nome ou identidade da skill inválido.');skills.add(metadata.name);text(metadata.description,'skill.description',1024,true);demand(front[2].trim(),'Skill sem instruções.');
    const agent=yaml.load(decoder.decode(entries.get(`skills/${folder}/agents/openai.yaml`)),{schema:yaml.JSON_SCHEMA});demand(object(agent?.interface),'Apresentação da skill inválida.');text(agent.interface.display_name,'skill.display_name',80);text(agent.interface.short_description,'skill.short_description',240);text(agent.interface.default_prompt,'skill.default_prompt',512);demand(agent.interface.default_prompt.includes('$'+folder),'Prompt da skill deve citar seu nome.');
  }
  demand(extension.onboardingSkill==='./skills/get-started/SKILL.md'&&entries.has(extension.onboardingSkill.slice(2)),'Onboarding aponta para skill ausente ou inválida.');
  demand(Object.keys(mcp.mcpServers).length===1&&mcp.mcpServers.chatgptplugin?.type==='streamable-http','Declare somente o servidor chatgptplugin por HTTP.');
  const server=mcp.mcpServers.chatgptplugin,url=https(server.url,'MCP URL');demand(url.pathname==='/api/mcp'&&!url.search&&!url.hash&&!server.headers,'MCP deve usar /api/mcp sem parâmetros ou cabeçalhos secretos.');
  if(url.hostname.endsWith('.invalid')||['localhost','127.0.0.1','[::1]'].includes(url.hostname))pending.push('domínio HTTPS real');
  // A real registered MCP ID and account eligibility cannot be verified offline.
  pending.push('registro e elegibilidade do MCP no ChatGPT','instalação e teste na conta real');
  if(requirePublication)throw new Error('Publicação ainda depende de: '+pending.join(', ')+'.');
  return {status:'passed',profile:'portable-development',name:manifest.name,version:manifest.version,files:entries.size,skills:skills.size,schemas:'Agent Plugins 1.0.0',publicationReady:false,pending};
}
function directoryEntries(directory){
  const base=resolve(directory),entries=new Map();let ancestor=base;
  while(ancestor!==dirname(ancestor)){demand(!lstatSync(ancestor).isSymbolicLink(),'Pacote não aceita links simbólicos.');ancestor=dirname(ancestor);}
  function visit(current,prefix=''){for(const item of readdirSync(current,{withFileTypes:true})){const path=resolve(current,item.name),name=prefix+item.name;demand(!lstatSync(path).isSymbolicLink(),'Pacote não aceita links simbólicos.');if(item.isDirectory())visit(path,name+'/');else{demand(item.isFile(),'Pacote só aceita arquivos regulares.');entries.set(name,readFileSync(path));}}}visit(base);return entries;
}
export function validatePluginPackage(directory,archive=resolve(directory)+'.zip',options={}){
  const folder=directoryEntries(directory),report=validatePackageEntries(folder,options);demand(!lstatSync(archive).isSymbolicLink(),'ZIP não aceita link simbólico.');
  const zipped=readPackageZip(readFileSync(archive));validatePackageEntries(zipped,options);
  demand(folder.size===zipped.size&&[...folder].every(([name,data])=>zipped.get(name)?.equals(data)),'O ZIP não corresponde à pasta validada.');return {...report,zipIntegrity:true,archive:resolve(archive)};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const directory=process.argv[2];demand(directory,'Informe a pasta do pacote.');console.log(JSON.stringify(validatePluginPackage(directory,resolve(directory)+'.zip',{requirePublication:process.argv.includes('--require-publication')}),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
