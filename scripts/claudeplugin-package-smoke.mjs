import assert from 'node:assert/strict';
import { readFileSync,rmSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildClaudePackage,validateEntries,readStoredZip,PACKAGE_FILES } from './claudeplugin-package.mjs';

// Pacote do plugin do Claude gerado e validado offline (sem claude.ai nem Claude Code).
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=resolve(root,'dist/claudeplugin-package-test');
let negatives=0;
function rejects(entries,pattern){assert.throws(()=>validateEntries(entries),pattern);negatives++}
try{
  const result=buildClaudePackage('https://erp.example.com',output);
  assert.equal(result.name,'cognito-erp');assert.equal(result.mcp,'https://erp.example.com/api/claude/mcp');assert.equal(result.skills,2);assert.equal(result.zip,true);
  const zipped=readStoredZip(readFileSync(output+'.zip'));
  assert.deepEqual([...zipped.keys()].sort(),PACKAGE_FILES);assert(zipped.has('.claude-plugin/plugin.json'),'manifesto na raiz do ZIP');
  assert.deepEqual(JSON.parse(zipped.get('.mcp.json').toString()),{mcpServers:{'cognito-erp':{type:'http',url:'https://erp.example.com/api/claude/mcp'}}});
  const manifest=JSON.parse(zipped.get('.claude-plugin/plugin.json').toString());
  assert.equal(manifest.displayName,'Cognito ERP');assert(!JSON.stringify(manifest).includes('com.openai'),'sem extensões da OpenAI');
  for(const skill of ['usar-erp','get-started']){const text=zipped.get(`skills/${skill}/SKILL.md`).toString();
    assert(!/ChatGPT|abrir_painel|configurações do plugin/.test(text),`${skill} sem referências do ChatGPT`)}
  // Origem inválida.
  for(const url of ['http://erp.example.com','https://erp.example.com/api','https://user:pass@erp.example.com','https://erp.example.com/?x=1']){assert.throws(()=>buildClaudePackage(url,output));negatives++}
  assert.throws(()=>buildClaudePackage('https://erp.example.com',resolve(root,'outside')));negatives++
  // Conteúdo inválido.
  const base=()=>new Map(zipped);
  const change=(name,fn)=>{const entries=base();entries.set(name,Buffer.from(fn(entries.get(name).toString())));return entries};
  rejects(new Map([...base(),['bin/run.sh',Buffer.from('echo')]]),/bin\//);
  rejects(new Map([...base(),['.env',Buffer.from('X=1')]]),/\.env/);
  rejects(new Map([...base(),['extra.md',Buffer.from('x')]]),/diferentes/);
  rejects(change('.claude-plugin/plugin.json',t=>t.replace('"cognito-erp"','"Cognito ERP"')),/name/);
  rejects(change('.claude-plugin/plugin.json',t=>t.replace(/"license": "[^"]+"/,'"license": ""')),/license/);
  rejects(change('README.md',()=>'# Curto\n\nPoucas palavras.'),/40 palavras/);
  rejects(change('.mcp.json',()=>JSON.stringify({mcpServers:{x:{type:'http',url:'http://erp.example.com/api/claude/mcp'}}})),/HTTPS/);
  rejects(change('.mcp.json',()=>JSON.stringify({mcpServers:{x:{type:'http',url:'https://erp.example.com/api/mcp'}}})),/api\/claude\/mcp/);
  rejects(change('.mcp.json',()=>JSON.stringify({mcpServers:{x:{type:'http',url:'https://erp.example.com/api/claude/mcp',headers:{Authorization:'Bearer x'}}}})),/segredo|type http/);
  rejects(change('.mcp.json',()=>JSON.stringify({mcpServers:{x:{command:'node',args:['server.js']}}})),/remoto/);
  rejects(change('skills/usar-erp/SKILL.md',t=>t.replace('name: usar-erp','name: outra')),/igual à pasta/);
  rejects(change('skills/get-started/SKILL.md',t=>t.replace(/^---[\s\S]*?---\n/,'')),/frontmatter/);
  rejects(change('README.md',t=>t+'\nchave sk_live_123'),/segredo/);
  console.log(JSON.stringify({status:'passed',package:result.name,version:result.version,files:PACKAGE_FILES.length,skills:result.skills,negativeChecks:negatives,installed:false,directorySubmission:false}));
} finally {rmSync(output,{recursive:true,force:true});rmSync(output+'.zip',{force:true})}
