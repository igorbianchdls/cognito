import { readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,existsSync,lstatSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export function buildPluginPackage(baseUrl,output=resolve(root,'dist/chatgptplugin')) {
  const url=new URL(baseUrl);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Informe a origem HTTPS publica do MCP, sem caminho ou credenciais.');
  const target=resolve(output),dist=resolve(root,'dist');
  if(!target.startsWith(dist+'\\')&&!target.startsWith(dist+'/'))throw new Error('O pacote deve ficar dentro de dist.');
  const source=resolve(root,'src/products/chatgptplugin/plugin');
  const files=['plugin.json','skills/usar-erp/SKILL.md','skills/usar-erp/agents/openai.yaml'];
  const allowed=new Set([...files,'mcp.json','README.md']);
  function inspect(directory,prefix='') {
    for(const entry of readdirSync(directory,{withFileTypes:true})) {
      const path=prefix+entry.name;
      if(entry.isSymbolicLink())throw new Error('O pacote nao aceita links para outros arquivos.');
      if(entry.isDirectory())inspect(resolve(directory,entry.name),path+'/');
      else if(!allowed.has(path))throw new Error('A pasta de saida contem arquivos que nao pertencem ao pacote.');
    }
  }
  if(existsSync(dist)&&lstatSync(dist).isSymbolicLink())throw new Error('A pasta dist deve ser local ao projeto.');
  if(existsSync(target)){if(lstatSync(target).isSymbolicLink())throw new Error('A pasta de saida deve ser local ao projeto.');inspect(target);}
  mkdirSync(target,{recursive:true});
  for(const file of files){const destination=resolve(target,file);mkdirSync(dirname(destination),{recursive:true});copyFileSync(resolve(source,file),destination);}
  const config={$schema:'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',mcpServers:{chatgptplugin:{type:'streamable-http',url:url.origin+'/api/mcp'}}};
  writeFileSync(resolve(target,'mcp.json'),JSON.stringify(config,null,2)+'\n');
  writeFileSync(resolve(target,'README.md'),`# Cognito ERP — ChatGPT Plugin\n\nPacote privado de desenvolvimento. MCP: ${config.mcpServers.chatgptplugin.url}\n\nConecte o MCP no ChatGPT em modo de desenvolvimento e autorize sua conta Clerk. Consultas exigem erp:read; propostas exigem tambem erp:write e as permissoes do ERP. Salvar exige revisao no ERP.\n\nPara publicacao, complete a identidade do desenvolvedor, icone, URLs de privacidade/suporte e o registro real do MCP no painel de desenvolvedor. Este pacote nao representa publicacao ou instalacao concluida.\n`);
  // Exportacao por lista explicita: nunca inclui .env, credenciais, banco ou codigo do servidor.
  const manifest=JSON.parse(readFileSync(resolve(target,'plugin.json'),'utf8'));
  if(manifest.name!=='chatgptplugin'||readdirSync(target).some(file=>file.startsWith('.env')))throw new Error('Pacote invalido.');
  return {directory:target,name:manifest.name,version:manifest.version,mcp:config.mcpServers.chatgptplugin.url};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const index=process.argv.indexOf('--url');
    const base=index>=0?process.argv[index+1]:process.env.CHATGPTPLUGIN_BASE_URL;
    if(!base)throw new Error('Configure CHATGPTPLUGIN_BASE_URL ou informe --url com o dominio HTTPS do MCP.');
    console.log(JSON.stringify(buildPluginPackage(base),null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
