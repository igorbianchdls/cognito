# Apps

Product independente em `src/products/apps`, com frontend, APIs, serviços e contratos. As rotas Next apenas conectam o product ao aplicativo. Schema privado `apps`, nove tabelas com RLS obrigatório e papel `apps_runtime` sem login, superusuário ou bypass de RLS. Bucket privado `apps-files`.

## Uso

Em **Apps → Novo app**, escolha nome, identidade e um exemplo funcional ou arquivo inicial em branco. O editor recebe arquivos HTML/CSS/JavaScript preparados e imagens PNG/JPEG/WebP. Não há instalação de pacotes, imports, backend arbitrário ou geração por IA integrada.

Edite `index.html`, folhas CSS e scripts JavaScript. Scripts devem conectar eventos em JavaScript; atributos de eventos no HTML são removidos. Salve antes de abrir a prévia. A prévia usa dados temporários em memória, descartados ao sair, e não recebe uma sessão de dados de produção.

No manifesto, defina coleções com UUID estável, chave e campos com identificadores estáveis. Tipos iniciais: `texto`, `numero`, `booleano`, `data`. Alterar rótulos não altera a identidade dos campos. O pacote inicial demonstra a API:

```js
await otto.ready()
const { registros, total } = await otto.data.list('itens', 1)
const { registro } = await otto.data.save('itens', { dados: { titulo: 'Minha ideia' } })
await otto.data.save('itens', { id: registro.id, expectedVersion: registro.versao_concorrencia, dados: { titulo: 'Atualizada' } })
await otto.data.remove('itens', registro.id, registro.versao_concorrencia + 1)
```

Listagens têm até 50 registros por página. O SDK opera apenas nas coleções do app. O servidor valida tipos, revisões e autorização em cada pedido.

## Versões e publicação

Existe um único rascunho compartilhado por app. A revisão do app protege todo o pacote e seus metadados. Salvamentos concorrentes retornam conflito; não há sobrescrita silenciosa. Depois de selada, uma versão e seus arquivos são imutáveis, inclusive por restrição no banco.

Membros podem criar e editar. Administradores e proprietários publicam, retiram do ar e restauram versões. Viewer pode abrir apps publicados e usar favoritos pessoais; não pode editar nem gravar registros. Esses papéis são os vínculos organizacionais existentes.

Publicar valida os arquivos, sua sintaxe e suas referências locais, verifica o hash no Storage, confirma a compatibilidade dos dados, sela e troca a publicação ativa em uma transação. A chave de operação torna a repetição da publicação idempotente. Nesta entrega, os pacotes têm tamanho limitado e não exigem build externo: a validação é síncrona e a tabela `execucoes` registra as operações concluídas. Não existe fila ou worker assíncrono nesta versão.

Editar um app publicado cria outro rascunho. Restaurar uma versão não reverte os registros. A compatibilidade é conferida contra os manifestos já publicados; restaurações que removam campos/coleções ou mudem tipos são recusadas. Migrações destrutivas ficam para uma evolução explícita.

Arquivar ou mover para a lixeira retira o app do ar. Restaurar o app preserva conteúdo e dados, mas não o republica automaticamente. Duplicar copia o pacote e cria novas identidades de coleções, sem copiar os registros de uso.

## Execução e isolamento

O frontend roda em iframe com origem opaca (`sandbox="allow-scripts allow-forms"`), sem `allow-same-origin`, permissões de popups ou navegação da página principal. CSP bloqueia conexões de rede, submits, frames, workers e recursos externos. `allow-forms` permite os eventos de formulário do app; `form-action 'none'` bloqueia o envio real do formulário.

Uma negociação vinculada à janela exata e a uma sessão aleatória transfere um `MessagePort`. A ponte aceita somente operações tipadas, com limites de frequência e tamanho. A origem opaca `null` não é usada como credencial. Os tokens de dados ficam no host, sem chegar ao código do app, e são vinculados à empresa, usuário, sessão Clerk, app, versão e publicação. Expiram em 30 minutos. Publicar outra versão, retirar do ar ou excluir invalida novas operações da sessão anterior.

Limites atuais: conteúdo executável deve vir de autores da empresa autorizados a editar. O sandbox não é uma infraestrutura para executar código hostil de terceiros nem oferece limites de CPU/memória por app. A política bloqueia requisições de recursos e navegação do host, mas navegadores não garantem bloquear toda navegação do próprio iframe iniciada por JavaScript. Não disponibilizar importação de terceiros não confiáveis ou dados sensíveis a código não revisado sem evoluir esse modelo. A validação estrutural não garante que um app arbitrário funcione sem erros; a prévia deve ser usada antes da publicação.

Os cards têm capas gráficas representativas da identidade do app; não são capturas automáticas da UI executada. Captura automatizada de miniaturas, editor visual, pacotes React/TypeScript com build, distribuição pública, usuários externos, conectores e tools MCP ficam fora desta entrega.

## Configuração e operação

- `SUPABASE_DB_URL`: banco já utilizado pelo projeto.
- `APPS_SUPABASE_URL` opcional: precisa corresponder ao projeto do banco; por padrão deriva do usuário do pooler.
- `APPS_SUPABASE_SERVICE_ROLE_KEY`: credencial privada de Storage. Pode reutilizar a credencial existente `ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY` ou `TABLES_SUPABASE_SERVICE_ROLE_KEY` se pertencer ao mesmo projeto. Não expor ao navegador.
- `APPS_RUNTIME_SECRET` opcional: segredo de pelo menos 24 caracteres; por padrão usa a chave privada Clerk existente como chave HMAC com contexto próprio.

O servidor transmite os pacotes e confirma hashes. Não há uploads públicos ou URLs de execução de arquivos na origem autenticada. Uploads são imutáveis; uma falha de banco após o envio pode deixar um objeto órfão. `node scripts/apps/maintenance.mjs` mostra candidatos sem referências há mais de 24 horas; `--apply` remove esses órfãos. O operador precisa fornecer a credencial privada de Storage no ambiente. Arquivos referenciados por versões retidas, inclusive apps na lixeira, são preservados.

## Verificação e entrega

1. `node scripts/apps/validation.mjs`: tipos, lint, banco isolado, interface em navegador e regressões de Tables/WhatsApp/MCP.
2. `node scripts/apps/database.mjs --check`: executa e reverte a migração no banco configurado.
3. `node scripts/apps/database.mjs --apply`: aplica somente após a prova isolada corresponder ao hash da migração.
4. `node scripts/apps/stage.mjs --production`: cria candidata sem atribuir domínio, preservando os agendamentos existentes.
5. `node scripts/apps/deployment.mjs status`: consulta o build da candidata.
6. `node scripts/apps/live.mjs`: valida a candidata com sessão Clerk ativa, Supabase e Storage reais. O app temporário de validação é movido para a lixeira.
7. `node scripts/apps/deployment.mjs promote`: verifica as provas, a origem exata e os agendamentos antes de promover.
8. `node scripts/apps/live.mjs --production`: verifica catálogo, página e regressões de leitura após a promoção.

As provas ficam em `.cache/apps/`. Testes isolados usam identidades e respostas fictícias; a validação da candidata identifica explicitamente quais serviços foram acessados de verdade. Nenhum teste autentica na Meta, envia mensagens ou emite documentos fiscais.
