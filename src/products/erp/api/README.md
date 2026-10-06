# API do ERP

Esta pasta organiza a API HTTP usada pelo SaaS e permite testar o CRUD pelas mesmas regras do ERP. Não é um novo produto nem uma segunda implementação do banco.

Notas de serviço possuem handlers em `handlers/notas-servico`, contratos compartilhados e serviço fiscal comum ao MCP. Consulte [fluxo, endpoints, PDF e simulação](../../../../docs/avaliacao-erp/notas-servico-simulacao-20261006.md).

## Fluxo e responsabilidades

```text
Cliente HTTP → src/app/api/erp/**/route.ts → erp/api/handlers
               → autenticação + contratos → erp/server → PostgreSQL/Supabase
Plugin MCP → aplicação do plugin → erp/server + erp/shared → mesmo banco
```

| Pasta | Responsabilidade |
| --- | --- |
| `src/app/api/erp` | URLs do Next: apenas configuração e exportação dos métodos. |
| `api/handlers` | Traduzir requisição/resposta, exigir permissões, chamar os serviços. |
| `api/contracts` | Contratos exclusivos do transporte HTTP. |
| `api/http` | Autenticação, contexto por requisição, limites, erros e correlação. |
| `server` | Regras, consultas, transações, auditoria, integridade e banco. |
| `shared` | Contratos e tipos reutilizáveis pelo SaaS, API e plugin. |

As consultas antes localizadas em `chatgptplugin/application/cardQueries.ts` e `erpQueries.ts` agora estão em `server/erpReadQueries.ts` e `erpReadService.ts`. Os arquivos do plugin reexportam esses serviços para compatibilidade. O MCP chama esses serviços diretamente: não precisa fazer uma chamada HTTP para o próprio SaaS. As escritas pelo plugin continuam sujeitas à sua revisão/aprovação.

`server/erpApi.ts` é um adaptador de compatibilidade para consumidores antigos. Novos handlers importam `api/http/responses`; serviços importam erros de `shared/erpErrors`.

## Acesso e proteção

- A API de uso normal exige uma sessão Clerk do SaaS e uma associação ativa com a empresa selecionada. Ainda não é uma API pública com chave de integração.
- O tenant e o usuário vêm da sessão. Não envie `empresa_id` (nem o nome antigo `tenant_id`), `criado_por` ou `atualizado_por` no corpo.
- Cada método exige a capacidade correspondente. O banco também aplica o papel `erp_runtime`, RLS e escopo explícito do tenant.
- GET executa consultas ERP em modo somente leitura; limite SQL de 10 segundos. Escritas têm limite SQL de 30 segundos por instrução.
- Corpo JSON de até 1 MiB; OFX e importações de dados aceitam até 4 MiB. A contagem inclui bytes efetivamente recebidos, mesmo sem `Content-Length`.
- Corpos não vazios exigem `application/json` ou um tipo `application/*+json`. JSON malformado retorna 400.
- Página: 1–10.000; tamanho da página: 1–100; busca: até 500 caracteres. Datas devem existir e os intervalos devem estar em ordem.
- Todas as respostas usam `Cache-Control: no-store` e `x-correlation-id`. Logs registram operação, status, duração e correlação, sem corpo ou credenciais.
- `/internal/automacoes` exige `Authorization: Bearer <CRON_SECRET>` e roda sob o contexto de cada empresa. Rotas de faturamento fiscal desativadas continuam retornando 410.

## CRUD para testes e uso do SaaS

Use um ambiente local/de testes com sessão autenticada. A API executa operações reais no banco configurado; não existe um modo de simulação implícito. O teste automatizado descrito abaixo usa um PostgreSQL local em memória com dados fictícios.

### Cadastros

`/api/erp/clientes`, `/fornecedores`, `/vendedores`, `/produtos`, `/servicos`, `/categorias` e `/contas-financeiras` usam a rota genérica `[entityId]`:

- POST: `{ "values": { ... } }`.
- GET de listagem: `?page=1&pageSize=20&query=...&filter.status=...`.
- GET individual: `/<id>`; resposta `{ "record": { ... } }`.
- PATCH individual: `{ "values": { ... }, "expectedVersion": 1 }`.
- DELETE individual: `{ "expectedVersion": 2 }`. **Desativa** o cadastro e preserva o histórico. Não é exclusão física.

Outros módulos usam `[entityId]` para consultas e algumas criações. Não suponha que todos aceitam edição e exclusão por essa rota; consulte o registro de módulos em `server/erpModuleRegistry.ts`.

### Contas a pagar e a receber

Rotas explícitas para títulos completos: `/api/erp/titulos/pagar` e `/api/erp/titulos/receber`.

**Atenção aos IDs:** as listagens financeiras mostram parcelas, com `id` da parcela e `conta_id` do título. GET/PATCH/DELETE em `/titulos/<lado>/<id>` exigem o **ID do título**. Baixas usam o **ID da parcela**.

POST exige `Idempotency-Key`, com 1–200 caracteres entre letras, números, `:._-`. Exemplo fictício; substitua as referências por IDs válidos da empresa:

```http
POST /api/erp/titulos/pagar
Content-Type: application/json
Idempotency-Key: teste-conta-pagar-001

{
  "values": {
    "fornecedor_id": 101,
    "descricao": "Compra de materiais",
    "numero_documento": "MAT-001",
    "valor_total": 1200,
    "data_competencia": "2026-10-05",
    "data_emissao": "2026-10-05",
    "categoria_id": 101,
    "conta_financeira_id": 101,
    "parcelas": [
      { "data_vencimento": "2026-10-15", "valor": 600 },
      { "data_vencimento": "2026-11-15", "valor": 600 }
    ]
  }
}
```

Para receber, use `cliente_id`. Os valores devem ser números, positivos, com no máximo duas casas decimais; a soma de 1–48 parcelas deve coincidir com o total. Referências precisam estar ativas e pertencer à mesma empresa.

POST retorna 201; repetição da mesma chave e mesmos dados retorna 200, `reused: true`, sem criar outro título. Dados diferentes ou uma chave de título excluído retornam 409. Repetir uma criação após editar o título retorna sua representação atual.

GET individual retorna `record`, `installments`, `history`, `versao` e cabeçalho `ETag`. PATCH e DELETE exigem `If-Match` com esse ETag, incluindo as aspas:

```http
If-Match: "<versao retornada pelo GET>"
```

PATCH envia `{ "values": { ... } }` com os campos obrigatórios e o calendário completo. Omissão de documento, centro de custo, conta financeira ou observações preserva o valor anterior; `null` limpa esse campo. O ETag muda após a edição. DELETE envia `{ "motivo": "Registro de teste encerrado" }` e faz exclusão lógica.

Títulos originados de venda, compra, contrato ou recorrência devem ser alterados no documento de origem. Títulos com pagamentos, créditos, renegociação, cobrança ou rateio não podem ser reescritos/excluídos por esse CRUD. Períodos fechados continuam protegidos. Para baixar e estornar, use os endpoints financeiros existentes.

### Vendas e compras

- `/vendas` e `/compras`: GET/POST; POST usa `{ "values": { ... } }` com o contrato de criação já utilizado pelo ERP.
- `/<id>`: GET/PATCH; PATCH exige `expectedVersion` e `values`.
- DELETE `/<id>`: `{ "expectedVersion": 1, "motivo": "Rascunho de teste" }`. Exclui logicamente apenas rascunhos sem efeitos financeiros, fiscais ou de estoque. Exige também consulta financeira e de estoque para verificar vínculos.
- Documentos confirmados devem ser cancelados pela ação `/cancelar`, respeitando suas regras de reversão.
- Confirmação, atendimento e recebimento preservam as rotas e regras atuais.

Cabeçalhos de idempotência são obrigatórios para as operações que já os exigiam, incluindo criação de vendas, baixas e operações de estoque. Algumas rotas antigas aceitam chave opcional; o catálogo e o handler indicam o contrato real. Uma chave opcional não garante repetição segura para todas as operações.

### Fechamentos de período

POST `/fechamentos` recebe `modulo`, `periodo_inicio`, `periodo_fim` e um motivo opcional. PATCH recebe `{ "id": 1, "motivo": "Correção autorizada" }`; o motivo da reabertura é obrigatório, entre 3 e 1.000 caracteres. O ERP solicita esse motivo e o guarda junto ao autor e à data. Fechamentos não podem ser apagados.

GET `/pagamentos?tipo=pagar&conta_id=<id>` recebe o ID do título de origem, não o ID da conta bancária. Os GETs de catálogos e contagem também exigem seus parâmetros específicos; consulte o handler para cada contrato.

## Erros

```json
{ "error": { "code": "VERSION_CONFLICT", "message": "...", "correlationId": "...", "recovery": "refresh" } }
```

| HTTP | Significado |
| --- | --- |
| 400 | JSON inválido ou erro de transporte específico. |
| 401 / 403 | Sessão ausente / permissão insuficiente. |
| 404 | Recurso indisponível ou rota/operação desconhecida. |
| 409 | Conflito de versão, operação repetida incompatível ou regra de negócio. |
| 410 | Operação fiscal desativada. |
| 412 / 428 | ETag desatualizado / cabeçalho `If-Match` obrigatório. |
| 413 / 415 | Corpo grande demais / tipo de conteúdo incorreto. |
| 422 | Campos, referências ou regras inválidos. |
| 500 / 503 | Falha interna / tempo limite ou serviço indisponível. |

`recovery` pode ser `none`, `same-operation`, `refresh` ou `verify`. Para falhas de rede/tempo limite, consulte o resultado antes de repetir. Algumas consultas legadas retornam 422 ao receber um ID inexistente; não expõem dados de outra empresa.

## Verificação e manutenção

```text
pnpm erp:api-catalog           # confere rotas, handlers, limites e catálogo
pnpm erp:api-catalog:write     # atualiza catálogo e tabela deste README
pnpm erp:api-http-smoke        # CRUD HTTP real, banco local fictício, sem .env
pnpm erp:typecheck
pnpm chatgptplugin:typecheck
pnpm chatgptplugin:database-smoke
pnpm erp:stock-regression
pnpm build
```

O teste HTTP carrega os exports reais das rotas do Next e usa servidor HTTP local. Substitui apenas a identidade externa e o transporte do pool PostgreSQL; executa os contratos, serviços, SQL, transações, RLS e integridade do ERP. Nenhuma conexão ao Supabase é feita por esse teste.

Verificação local desta implementação: 20 grupos HTTP, incluindo 78 métodos sem sessão, 27 endpoints GET autenticados, CRUD/versionamento, idempotência, isolamento, baixas/estorno, fechamento/reabertura e rollback por falha de auditoria. O plugin passou 27 grupos de banco, 13 grupos do protocolo de formulários e o teste visual de formulário. Estoque/contratos/automações passaram 29 cenários. Esses números não representam cobertura de todos os caminhos de todos os endpoints.

PGlite usa uma conexão: chamadas HTTP simultâneas verificam isolamento de contexto, mas **não provam concorrência entre duas sessões PostgreSQL**. A validação desse comportamento exige um banco exclusivo para testes e continua pendente até configurá-lo. O build completo depende também de espaço livre suficiente para as dependências e os artefatos do Next.

Para adicionar uma operação: crie/estenda a regra em `server`, reutilize contratos de `shared` quando apropriado, crie o handler com `withErpHttp`, exponha uma rota fina, teste o efeito e os casos de recusa, atualize este guia e regenere o catálogo. Não escreva SQL nos handlers.

## Catálogo de endpoints

¹ As permissões na tabela são a união das capacidades citadas no arquivo, não uma exigência conjunta de todos os métodos. Rotas com módulos/operações dinâmicos consultam seus registros de permissões. Fiscal aparece apenas para documentar o transporte existente.

<!-- API-CATALOG:START -->
| Endpoint | Métodos | Autenticação | Limite do corpo | Permissões citadas no handler¹ |
| --- | --- | --- | --- | --- |
| `/api/erp/[entityId]/[id]` | GET, PATCH, DELETE | session | 1 MiB | Sessão / regra dinâmica |
| `/api/erp/[entityId]/resumo` | GET | session | 1 MiB | Sessão / regra dinâmica |
| `/api/erp/[entityId]` | GET, POST | session | 1 MiB | Sessão / regra dinâmica |
| `/api/erp/acesso` | GET | session | 1 MiB | Sessão / regra dinâmica |
| `/api/erp/automacoes` | GET, POST | session | 1 MiB | `erp.configuracoes.gerenciar` |
| `/api/erp/bancos/importar-ofx` | POST | session | 4 MiB | `erp.financeiro.gerenciar` |
| `/api/erp/catalogos/busca` | GET | session | 1 MiB | `erp.cadastros.visualizar` |
| `/api/erp/catalogos/categorias` | GET | session | 1 MiB | `erp.cadastros.visualizar` |
| `/api/erp/compras/[id]/cancelar` | POST | session | 1 MiB | `erp.compras.gerenciar` |
| `/api/erp/compras/[id]/confirmar` | POST | session | 1 MiB | `erp.compras.gerenciar` |
| `/api/erp/compras/[id]/receber` | POST | session | 1 MiB | `erp.compras.gerenciar` |
| `/api/erp/compras/[id]` | GET, PATCH, DELETE | session | 1 MiB | `erp.compras.gerenciar`, `erp.compras.visualizar`, `erp.estoque.visualizar`, `erp.financeiro.visualizar` |
| `/api/erp/compras/catalogos` | GET | session | 1 MiB | `erp.compras.visualizar` |
| `/api/erp/compras` | GET, POST | session | 1 MiB | `erp.compras.gerenciar`, `erp.compras.visualizar` |
| `/api/erp/conciliacao/concluidas` | GET | session | 1 MiB | `erp.financeiro.visualizar` |
| `/api/erp/conciliacao/regras` | GET, POST | session | 1 MiB | `erp.financeiro.gerenciar`, `erp.financeiro.visualizar` |
| `/api/erp/conciliacao/sugestoes` | GET | session | 1 MiB | `erp.financeiro.visualizar` |
| `/api/erp/conciliacao/transacoes/[id]/desfazer` | POST | session | 1 MiB | `erp.financeiro.gerenciar` |
| `/api/erp/conciliacao/transacoes/[id]/ignorar` | POST | session | 1 MiB | `erp.financeiro.gerenciar` |
| `/api/erp/contas-pagar-parcelas/[id]/baixar` | POST | session | 1 MiB | `erp.financeiro.baixar` |
| `/api/erp/contas-receber-parcelas/[id]/baixar` | POST | session | 1 MiB | `erp.financeiro.baixar` |
| `/api/erp/contratos/[id]` | GET, PATCH | session | 1 MiB | `erp.vendas.gerenciar`, `erp.vendas.visualizar` |
| `/api/erp/contratos/processar` | POST | session | 1 MiB | `erp.vendas.gerenciar` |
| `/api/erp/dashboards/[dashboardId]/registros` | GET | session | 1 MiB | Sessão / regra dinâmica |
| `/api/erp/dashboards/[dashboardId]` | GET | session | 1 MiB | Sessão / regra dinâmica |
| `/api/erp/estoque/contagem` | GET | session | 1 MiB | `erp.estoque.ajustar` |
| `/api/erp/fechamentos` | GET, POST, PATCH | session | 1 MiB | `erp.configuracoes.gerenciar`, `erp.financeiro.visualizar` |
| `/api/erp/financeiro/[operation]` | GET, POST | session | 1 MiB | `erp.financeiro.estornar`, `erp.financeiro.gerenciar`, `erp.financeiro.visualizar` |
| `/api/erp/historicos/[kind]/[id]` | GET | session | 1 MiB | `erp.compras.visualizar`, `erp.financeiro.visualizar`, `erp.vendas.visualizar` |
| `/api/erp/importacoes/[type]` | GET, POST | session | 4 MiB | `erp.cadastros.gerenciar`, `erp.cadastros.visualizar` |
| `/api/erp/importacoes/lotes/[id]` | GET | session | 4 MiB | `erp.cadastros.visualizar` |
| `/api/erp/internal/automacoes` | GET | cron | 1 MiB | Sessão / regra dinâmica |
| `/api/erp/notas-compra` | GET, POST | session | 1 MiB | `erp.compras.gerenciar`, `erp.compras.visualizar` |
| `/api/erp/notas-servico/[id]/[operation]` | GET, POST | session | 0.0625 MiB | `erp.vendas.gerenciar`, `erp.vendas.visualizar` |
| `/api/erp/notas-servico/[id]` | GET, PATCH | session | 0.0625 MiB | `erp.vendas.gerenciar`, `erp.vendas.visualizar` |
| `/api/erp/notas-servico` | GET, POST | session | 0.0625 MiB | `erp.vendas.gerenciar`, `erp.vendas.visualizar` |
| `/api/erp/operacoes/[resource]` | GET, POST | session | 1 MiB | `erp.estoque.ajustar` |
| `/api/erp/operacoes/catalogos` | GET | session | 1 MiB | Sessão / regra dinâmica |
| `/api/erp/orcamentos/[id]/acao` | POST | session | 1 MiB | `erp.vendas.gerenciar` |
| `/api/erp/orcamentos/[id]/converter` | POST | session | 1 MiB | `erp.vendas.gerenciar` |
| `/api/erp/ordens-servico/[id]/acao` | POST | session | 1 MiB | `erp.vendas.gerenciar` |
| `/api/erp/ordens-servico/[id]` | GET, PATCH | session | 1 MiB | `erp.vendas.gerenciar`, `erp.vendas.visualizar` |
| `/api/erp/ordens-servico` | GET, POST | session | 1 MiB | `erp.vendas.gerenciar`, `erp.vendas.visualizar` |
| `/api/erp/pagamentos/[id]/estornar` | POST | session | 1 MiB | `erp.financeiro.estornar` |
| `/api/erp/pagamentos` | GET | session | 1 MiB | `erp.financeiro.visualizar` |
| `/api/erp/recorrencias/processar` | POST | session | 1 MiB | `erp.financeiro.gerenciar` |
| `/api/erp/recorrencias` | GET, PATCH | session | 1 MiB | `erp.configuracoes.gerenciar`, `erp.financeiro.gerenciar` |
| `/api/erp/relatorios/[report]` | GET | session | 1 MiB | `erp.relatorios.visualizar` |
| `/api/erp/resumo/profissional` | GET | session | 1 MiB | `erp.relatorios.visualizar` |
| `/api/erp/resumo` | GET | session | 1 MiB | `erp.relatorios.visualizar` |
| `/api/erp/titulos/[side]/[id]` | GET, PATCH, DELETE | session | 1 MiB | `erp.financeiro.gerenciar`, `erp.financeiro.visualizar` |
| `/api/erp/titulos/[side]` | GET, POST | session | 1 MiB | `erp.financeiro.gerenciar`, `erp.financeiro.visualizar` |
| `/api/erp/vendas/[id]/atender-parcial` | POST | session | 1 MiB | `erp.vendas.gerenciar` |
| `/api/erp/vendas/[id]/atender` | POST | session | 1 MiB | `erp.vendas.gerenciar` |
| `/api/erp/vendas/[id]/cancelar` | POST | session | 1 MiB | `erp.vendas.gerenciar` |
| `/api/erp/vendas/[id]/confirmar` | POST | session | 1 MiB | `erp.vendas.gerenciar` |
| `/api/erp/vendas/[id]/faturar-parcial` | POST | none | 1 MiB | Sessão / regra dinâmica |
| `/api/erp/vendas/[id]/faturar` | POST | none | 1 MiB | Sessão / regra dinâmica |
| `/api/erp/vendas/[id]/pre-validacao-fiscal` | GET | session | 1 MiB | `erp.vendas.visualizar` |
| `/api/erp/vendas/[id]` | GET, PATCH, DELETE | session | 1 MiB | `erp.estoque.visualizar`, `erp.financeiro.visualizar`, `erp.vendas.gerenciar`, `erp.vendas.visualizar` |
| `/api/erp/vendas/catalogos` | GET | session | 1 MiB | `erp.vendas.visualizar` |
| `/api/erp/vendas` | GET, POST | session | 1 MiB | `erp.vendas.gerenciar`, `erp.vendas.visualizar` |
<!-- API-CATALOG:END -->
