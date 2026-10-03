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
  const files=['plugin.json','assets/icon.svg','skills/usar-erp/SKILL.md','skills/usar-erp/agents/openai.yaml','skills/get-started/SKILL.md','skills/get-started/agents/openai.yaml'];
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
  let ancestor=dirname(target);
  while(ancestor!==root&&ancestor!==dirname(ancestor)){if(existsSync(ancestor)&&lstatSync(ancestor).isSymbolicLink())throw new Error('O caminho de saida deve ser local ao projeto.');ancestor=dirname(ancestor);}
  if(existsSync(target)){if(lstatSync(target).isSymbolicLink())throw new Error('A pasta de saida deve ser local ao projeto.');inspect(target);}
  mkdirSync(target,{recursive:true});
  for(const file of files){
    const input=resolve(source,file),destination=resolve(target,file);let part=input;
    while(part!==root&&part!==dirname(part)){if(lstatSync(part).isSymbolicLink())throw new Error('A origem do pacote nao aceita links para outros arquivos.');part=dirname(part);}
    if(!lstatSync(input).isFile())throw new Error('Arquivo de origem invalido.');
    mkdirSync(dirname(destination),{recursive:true});copyFileSync(input,destination);
  }
  const config={$schema:'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',mcpServers:{chatgptplugin:{type:'streamable-http',url:url.origin+'/api/mcp'}}};
  writeFileSync(resolve(target,'mcp.json'),JSON.stringify(config,null,2)+'\n');
  writeFileSync(resolve(target,'README.md'),`# Cognito ERP — ChatGPT Plugin\n\nPacote privado de desenvolvimento. MCP: ${config.mcpServers.chatgptplugin.url}\n\nConecte o MCP no ChatGPT em modo de desenvolvimento e autorize sua conta Clerk. Consultas exigem erp:read; propostas exigem tambem erp:write e as permissoes do ERP. Salvar exige revisao no ERP.\n\nPara publicacao, complete a identidade do desenvolvedor, icone, URLs de privacidade/suporte e o registro real do MCP no painel de desenvolvedor. Este pacote nao representa publicacao ou instalacao concluida.\n`);
  // Exportacao por lista explicita: nunca inclui .env, credenciais, banco ou codigo do servidor.
  const manifest=JSON.parse(readFileSync(resolve(target,'plugin.json'),'utf8'));
  if(manifest.name!=='chatgptplugin'||readdirSync(target).some(file=>file.startsWith('.env')))throw new Error('Pacote invalido.');
  const archive=target+'.zip';
  if(existsSync(archive)&&lstatSync(archive).isSymbolicLink())throw new Error('O arquivo ZIP deve ser local ao projeto.');
  writeFileSync(archive,zip([...allowed].map(file=>({name:file,data:readFileSync(resolve(target,file))}))));
  return {directory:target,archive,name:manifest.name,version:manifest.version,mcp:config.mcpServers.chatgptplugin.url};
}
function zip(files) {
  const blocks=[],directory=[];let offset=0;
  for(const {name,data} of files){
    const filename=Buffer.from(name);let crc=0xffffffff;
    for(const byte of data){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}crc=(crc^0xffffffff)>>>0;
    const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(filename.length,26);
    const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x800,8);entry.writeUInt16LE(33,14);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(data.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(filename.length,28);entry.writeUInt32LE(offset,42);
    blocks.push(header,filename,data);directory.push(entry,filename);offset+=header.length+filename.length+data.length;
  }
  const central=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...blocks,central,end]);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const index=process.argv.indexOf('--url');
    const base=index>=0?process.argv[index+1]:process.env.CHATGPTPLUGIN_BASE_URL;
    if(!base)throw new Error('Configure CHATGPTPLUGIN_BASE_URL ou informe --url com o dominio HTTPS do MCP.');
    console.log(JSON.stringify(buildPluginPackage(base),null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
