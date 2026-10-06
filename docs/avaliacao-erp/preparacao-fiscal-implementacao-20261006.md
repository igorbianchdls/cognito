# Base fiscal preparada para integração futura

> Depois desta entrega foram criadas [12 notas fiscais demonstrativas](notas-fiscais-demonstrativas-20261006.md). A descrição de tabelas vazias abaixo registra o estado na aplicação original da migração; o estado atual inclui esse cenário de simulação, com configuração inativa e sem emissão externa.

Data: 06/10/2026. Projeto Supabase: `mtadnxqoqxzbdksktwdr`.

## Estado entregue

A preparação estrutural foi aplicada no Supabase e o código compatível foi publicado em `https://cognito-seven.vercel.app`. Os dados comerciais existentes foram preservados. As oito tabelas fiscais continuam vazias: nenhuma configuração, nota ou credencial real foi criada.

A emissão permanece desativada. A entrega prepara armazenamento, contratos, permissões e proteção de histórico; a integração completa depende do provedor escolhido e dos testes em homologação.

## Tabelas no schema `erp`

| Tabela | Responsabilidade |
| --- | --- |
| `configuracoes_fiscais` | Configuração por empresa, CNPJ, provedor e ambiente; uma configuração ativa padrão por empresa/ambiente; referência do segredo no servidor. |
| `notas_fiscais` | Documento, origem comercial, modelo fiscal, ambiente, identificação externa e cópias dos dados de emitente, destinatário e integração. |
| `notas_fiscais_itens` | Itens vinculados à origem correta, identificação sequencial, unidade, descontos e dados tributários de mercadorias/serviços. |
| `notas_fiscais_totais` | Totais, ISS, retenções, valor líquido e campos opcionais de IBS/CBS. Valores ausentes continuam distinguíveis de zero. |
| `notas_fiscais_eventos` | Histórico imutável; vínculo opcional à tentativa ou ao retorno de origem. |
| `notas_fiscais_tentativas` | Operação solicitada, chave de idempotência, número da tentativa, conteúdo enviado, hash, resposta e estado operacional. |
| `notas_fiscais_retornos` | Recepção de notificações, deduplicação por evento externo ou hash, vínculo à nota e estado de processamento. |
| `notas_fiscais_arquivos` | Associação imutável aos arquivos privados existentes em `erp.arquivos`; acesso pelo fluxo protegido de histórico/arquivos do ERP. |

### Regras principais

- Homologação e produção podem coexistir para o mesmo CNPJ. A seleção de emitente recebe o ambiente explicitamente.
- Os nomes específicos da Focus foram substituídos por `empresa_provedor_ref`, `referencia_externa` e `resposta_provedor`. Não existe provedor selecionado automaticamente.
- Uma venda pode ter mais de uma nota, permitindo preparar emissões parciais e complementares. Isso não implementa sozinho os respectivos fluxos comerciais/fiscais.
- A referência externa é única por empresa/provedor/ambiente. Retornos repetidos não criam novo registro; reutilizar a identidade com conteúdo diferente é rejeitado.
- Reenvios sob a mesma chave de idempotência exigem o mesmo pedido. O bloqueio da nota serializa a verificação; uma resposta de aceitação não equivale à autorização fiscal.
- Itens comerciais e contraparte devem corresponder à venda/compra vinculada, dentro da mesma empresa.
- Documentos finalizados têm conteúdo, itens e totais congelados. As alterações operacionais permitidas não autorizam reabrir o conteúdo fiscal. O congelamento ao final da transação preserva a importação atômica de XML.
- Eventos e associações de arquivos são imutáveis. Arquivos vinculados não podem ser excluídos nem ter bucket, caminho ou hash substituídos.
- RLS está habilitada nas oito tabelas. A gravação de totais foi corrigida, e os acessos comerciais seguem as permissões de vendas/compras. A projeção de emitente não entrega credenciais ou a configuração completa.
- O modelo NFS-e Nacional permite guardar DPS, competência, municípios e classificação de ISS; os requisitos estruturais são verificados antes de marcar o documento como pronto para envio.

## Onde está o código

| Arquivo | Função |
| --- | --- |
| `supabase/migrations/20261006010000_prepare_erp_fiscal_integration.sql` | Alterações de schema, índices, integridade, congelamento e políticas de acesso. |
| `src/products/erp/shared/fiscalContracts.ts` | Validação de pedidos/retornos e interface do futuro adaptador de emissão, consulta e cancelamento. |
| `src/products/erp/server/fiscal/fiscalIntegrationRepository.ts` | `recordFiscalAttempt` e `recordFiscalReturn`: persistência autenticada com idempotência/deduplicação. Não enviam pedidos externos. |
| `src/products/erp/server/fiscal/nfeParser.ts` | Extração do ambiente, dados originais de emitente/destinatário, número dos itens, descontos e tributos do XML. |
| `src/products/erp/server/erpRepository.ts` | Importação de XML de compra compatível com os novos campos e a proteção do documento. |
| `src/products/erp/server/erpHistoryRepository.ts` | Associação fiscal ao fluxo existente de arquivos privados. |
| `src/products/erp/server/erpProfessionalRepository.ts` | Pré-validação de venda com ambiente explícito. |
| `src/products/erp/api/handlers/vendas/pre-validacao-fiscal.ts` | GET de pré-validação: `?ambiente=homologacao` ou `?ambiente=producao`; produção continua sendo o padrão quando omitido. |

`recordFiscalReturn` só aceita contexto autenticado do ERP. Quando o endpoint de webhook for implementado, o chamador deve validar a identidade/autenticidade do provedor antes de usar essa função. Não há endpoint público de webhook nesta entrega.

## Validação realizada

- **65 verificações do banco**, incluindo separação de ambientes, integridade, duplicidade, reenvios, proteção de conteúdo, arquivos, permissões de um perfil restrito de vendas e isolamento por empresa.
- **13 verificações do código real**, incluindo os repositórios, importação de XML, repetição de pedidos/retornos e acesso ao histórico/arquivos.
- Os 78 testes de escrita foram executados em transações revertidas. Não deixaram registros de teste. Sequências de identificadores usadas pela importação podem avançar mesmo após a reversão, comportamento normal do PostgreSQL.
- Verificação TypeScript passou. Verificação de estilo dos arquivos alterados terminou sem erros; permaneceu um aviso anterior de função não utilizada.
- **17 consultas GET autenticadas com sessão real do Clerk** passaram na versão preparada e novamente em produção, incluindo os módulos comerciais, estoque, notas de compra e pré-validação nos dois ambientes.
- A aplicação comparou contagens e hashes de registros de 13 tabelas comerciais antes/depois: dados preservados. Restrições fiscais validadas e RLS conferida após a aplicação.

Os testes não incluem concorrência entre processos independentes, carga ou comunicação com uma API fiscal real.

### Evidências locais

- Scripts reproduzíveis: `scripts/erp/fiscal-preparation-smoke.mjs`, `scripts/erp/fiscal-repository-smoke.ts` e `scripts/erp/apply-fiscal-preparation.mjs`.
- Relatórios locais ignorados pelo Git: `.cache/fiscal-preparation/smoke.json`, `repository-smoke.json`, `application.json`, `staged-reads.json`, `production-reads.json` e `promotion.json`.
- Versão da migração aplicada: `20261006010000`.
- Hash SHA-256 do corpo aplicado: `8578e58911d8f1d32b71d71644082a7f586283c008d7e79a6420cbdafabea6f1`.
- Publicação verificada: `dpl_2iZB9Q1JW7fQFJvosNgjAnoYHtYK`.
- Hash do conjunto de arquivos publicado: `b90b2952486505d96487a21e018d45ea00bf6b688b16b82dc0df332355e1fe9a`.

Os scripts de teste desta preparação exigem a base fiscal anterior vazia e executam a migração antes de reverter a transação. Após esta migração estar aplicada, esses testes devem ser executados em uma base descartável correspondente à versão anterior; não são rotinas de produção a serem repetidas sem ajuste. O aplicador verifica uma migração já aplicada sem reaplicá-la.

## Próxima etapa, quando o provedor for escolhido

1. Definir os modelos atendidos e os campos/layouts exigidos pela API; preparar o cadastro fiscal de produtos/serviços e do emitente.
2. Implementar o adaptador real, a resolução segura de credenciais, os pedidos de emissão/consulta/cancelamento e suas validações específicas.
3. Implementar autenticação de webhook, processamento de retornos, conciliação após timeout e agendamento/reenvio com controle de concorrência e estados.
4. Armazenar os XMLs e documentos originais no armazenamento privado, associando-os à nota; o vínculo e a leitura já estão preparados.
5. Testar em homologação autorização, rejeição, resposta perdida, duplicidade, consulta, cancelamento e guarda dos arquivos antes de ativar produção.

Ainda não existem adaptador ativo, emissor, worker, credencial fiscal configurada ou emissão real. Os campos tributários armazenam dados; não constituem cálculo de impostos ou certificação de conformidade tributária. A validação geral de totais e do leiaute deverá acompanhar o contrato da API escolhida.
