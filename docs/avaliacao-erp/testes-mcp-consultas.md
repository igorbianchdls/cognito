# Testes de consultas pelo MCP com Supabase real

## Resultado

21 verificações aprovadas em chamadas HTTP a `/api/mcp`, utilizando o handler MCP do projeto, o SDK e os repositórios reais. A consulta de contas a pagar retornou duas parcelas existentes. IDs, títulos de origem, descrições, fornecedores, valores, pagamentos, saldos, status e vencimentos foram comparados com leituras independentes no Supabase.

O teste foi executado em servidor temporário vinculado a `127.0.0.1`, encerrado ao terminar. A identidade de teste foi baseada em um vínculo existente de owner/admin. Os tokens locais aleatórios ficaram em memória. As credenciais do banco foram carregadas de `.env.local`, com verificação do projeto esperado e TLS com certificado validado.

## Cobertura

| Verificação | Resultado |
| --- | --- |
| Inicialização MCP via HTTP e descoberta das 24 ferramentas | Aprovado |
| `meu_acesso`, empresas e permissões | Correspondem aos vínculos existentes |
| `consultar_financeiro`, tipo `pagar` | Duas parcelas reais conferidas |
| Sete filtros de status | Aprovados, inclusive resultados vazios |
| Vencimento com início e fim na mesma data | Limites inclusivos aprovados |
| Busca por descrição | Registro esperado encontrado |
| Primeira página e página após o fim dos registros | Aprovadas após correção |
| Protocolo moderno, descoberta e consulta | Aprovado |
| Ausência de identidade de teste | HTTP 401 |
| Identidade de teste sem permissão financeira | `ACCESS_DENIED` |
| Empresa fora dos vínculos | `ACCESS_DENIED` |
| Período com início posterior ao fim | `INVALID_INPUT` |
| Auditoria persistida no Supabase | Sucessos e recusas registrados |

As consultas ERP executaram com contexto de empresa/usuário, papel `erp_runtime`, transação somente leitura e limite de duração. A comparação independente calculou pagamentos, créditos e renegociações a partir dos movimentos lidos do banco. Não foram expostos nomes de fornecedores, descrições, valores ou tokens no relatório do teste.

## Correção encontrada durante o teste

A primeira execução teve 20 verificações aprovadas e uma falha: uma página depois da última retornava `total: 0`, apesar de existirem duas parcelas. O total era obtido exclusivamente das linhas retornadas pela consulta, que ficam vazias nessa situação.

`listErpEntityPage`, em `src/products/erp/server/erpRepository.ts`, agora recupera os metadados pela primeira página com os mesmos filtros quando uma página posterior não tem linhas. Mantém a página solicitada vazia e preserva total e resumo financeiro. Essa situação usa uma consulta adicional, com paginação limitada e o mesmo contexto de acesso.

Após a correção, as 21 verificações HTTP passaram. A suíte local também passou com 19 grupos, incluindo regressão específica para total, resumo, filtro de status e consulta sem resultados. A correção está no código local; não foi feita publicação do aplicativo neste teste.

## Limites da validação

O OAuth, a URL pública do MCP e as credenciais Clerk não estão configurados no ambiente. Também não foi encontrado vínculo de owner/admin ativo com identificador Clerk cadastrado. Portanto, o teste **não comprova autenticação OAuth, conexão no ChatGPT ou execução do endpoint publicado**. A autenticação local do teste não foi adicionada ao produto.

Foram executadas as ferramentas `meu_acesso` e `consultar_financeiro`; as 24 foram conferidas no catálogo, mas não executadas individualmente. A comparação foi com o banco, sem abrir a tela do ERP.

Nenhum registro comercial foi criado, alterado ou excluído. A auditoria e os contadores de limite reais do plugin foram gravados, como ocorre em uma consulta MCP normal. Esses registros foram preservados; não houve limpeza ou nova migração do banco.

## Repetição

Na pasta do projeto:

```powershell
node node_modules/tsx/dist/cli.mjs scripts/chatgptplugin-live-read-smoke.ts
```

Também disponível como `pnpm chatgptplugin:live-read-smoke`.

O servidor temporário utiliza uma porta livre automaticamente. O teste não depende de um servidor Next.js em execução. A conexão é restrita ao projeto Supabase `mtadnxqoqxzbdksktwdr`; é necessário vínculo ativo e parcelas existentes para validar dados reais. Falta de dados ou acesso não é tratada como consulta comprovada.

Relatório local sem credenciais ou resultados comerciais: `.cache/erp-audit/mcp-live-read.json`. Cada repetição consome aproximadamente 20 chamadas do limite real por usuário de 60/minuto e gera novos logs de auditoria.
