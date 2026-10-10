# Diagnóstico de propostas e ordens de serviço

Data: 10/10/2026. Revisão do código e do projeto Supabase conectado ao ERP. Neste relatório, proposta comercial é o orçamento de venda (`tipo_documento = 'orcamento'`); o rascunho de aprovação de uma tool é outro objeto.

Este documento registra o diagnóstico anterior às mudanças. O resultado das correções e as pendências estão no [relatório de implementação](propostas-ordens-servico-implementacao-20261010.md).

## Conclusão

A estrutura existente pode ser aproveitada. Não é necessário refazer as tabelas principais. O fluxo completo ainda precisa de correções nas conversões, de ampliação das tools e de implementação dos PDFs comerciais.

| Área | Propostas/orçamentos | Ordens de serviço |
| --- | --- | --- |
| Banco | Usa `erp.vendas`, itens, recebimentos previstos, eventos e arquivos | Usa cabeçalho, itens, eventos e arquivos próprios |
| Operações básicas | Criação, edição, consulta, conversão e exclusão de rascunho testadas | Criação, repetição, edição, aprovação, início e conclusão testados |
| Plugin | Seis tools existentes, com limitações de campos e ações | Sem tools para listar, detalhar, criar, editar e executar o ciclo da OS; apenas a consulta genérica de anexos aceita OS |
| PDF | Botão de impressão da tela pelo navegador; sem gerador comercial no servidor | Sem geração de PDF da OS |

## Banco: pontos bons

Na empresa 2 existem 12 propostas e 24 OS disponíveis. Conferi as tabelas reais, suas colunas, chaves, índices, políticas e gatilhos.

- Separação por empresa, RLS habilitado, permissões de leitura/escrita e chaves compostas para evitar vínculos entre empresas.
- Itens discriminados entre produto e serviço, quantidades positivas, valores não negativos e validações de equação comercial.
- Numeração única, chaves de idempotência e controle de versão usado pela aplicação.
- Histórico de eventos protegido contra alteração e exclusão.
- Snapshot do cliente e vínculos com documentos de origem.
- OS possui responsável, equipamento, marca, modelo, série, problema, diagnóstico, previsão de entrega e observações públicas/internas.
- As propostas conferidas não geraram contas a receber. Os totais dos 12 orçamentos e das 24 OS conferiram com seus itens; não encontrei divergência de cliente nos vínculos das OS com vendas.

`situacao` da proposta continua sendo texto sem restrição de valores. Os vínculos atuais também não garantem, por si, um único resultado comercial para a sequência OS → proposta → venda.

## Problemas confirmados

### 1. Situações de proposta inconsistentes — prioridade alta

O banco possui `em_aberto`, `enviada`, `aprovada` e `recusada`. A interface e parte do serviço esperam `em_andamento`, `aprovado` e `recusado`.

Consequências: contadores e ações da interface não reconhecem corretamente esses registros. No teste, uma proposta existente com `situacao = 'recusada'` foi convertida em venda: a proteção verifica apenas `recusado`. A alteração foi revertida.

A ação `enviar` registra `enviada_em`, mas uma proposta nova permanece `em_andamento`. Ela também não implementa entrega por e-mail nem geração/envio do documento.

Recomendação: definir situações canônicas, normalizar os registros, restringir valores no banco e alinhar transições, filtros, interface e tools.

### 2. Conversão de OS com previsão de entrega falha — prioridade alta

Reproduzi criação de OS com previsão em 20/10/2026 seguida de `gerar_orcamento`. O PostgreSQL devolveu `invalid input syntax for type date`.

O leitor do banco devolve um objeto `Date`; `convertServiceOrder` repassa `previsao_entrega` sem normalizar, e o gravador da venda transforma esse objeto em texto descritivo. É um problema de transporte no código, não de estrutura da coluna `date`.

Recomendação: normalizar a data para `YYYY-MM-DD` na passagem entre os serviços e verificar geração de orçamento e de venda.

### 3. Uma OS permite duas vendas pelo fluxo combinado — prioridade alta

Com previsão vazia para isolar o problema de data, executei OS → orçamento → converter orçamento em venda → gerar venda da OS. Foram criadas duas vendas diferentes.

A conversão do orçamento não atualiza o vínculo da OS com a primeira venda; a ação da OS cria outra com uma chave própria. A numeração e a idempotência de cada operação funcionam, mas falta coordenação entre as origens. As vendas do teste ficaram em rascunho, sem contas a receber, e foram revertidas.

Recomendação: sincronizar os vínculos e reutilizar/bloquear a geração quando a proposta originada da OS já produziu uma venda.

### 4. Itens arquivados entram na conversão — prioridade média

As consultas de itens em `convertServiceOrder` e `convertQuoteToSale` não filtram `excluido_em`. Na OS de teste, arquivei um item e ajustei o total para considerar só os ativos. A conversão falhou com “A soma das parcelas precisa ser igual ao total da venda”, porque o item arquivado voltou ao cálculo.

Não há itens arquivados nas OS atuais da empresa 2; o defeito foi reproduzido em um cenário temporário.

### 5. Validade sem regra de conversão — prioridade média

Uma proposta de teste válida até 09/10/2026 foi convertida em 10/10/2026. Falta definir se uma proposta vencida deve ser bloqueada, renovada ou exigir autorização explícita antes da conversão.

## Tools

As propostas usam:

- `listar_vendas`, com `tipo_documento: 'orcamento'`;
- `obter_venda`;
- `criar_venda`, `editar_venda` e `excluir_venda`, com `tipo: 'orcamento'`;
- `converter_orcamento`.

O teste MCP de criação, edição, conversão e exclusão passou com 21 chamadas, incluindo o catálogo e os protocolos. Também executei as duas tools de leitura com o contexto nativo de somente leitura: retornaram as 12 propostas e seus detalhes.

Faltam ações para enviar/marcar envio, aprovar e recusar propostas; filtro por situação comercial; geração/consulta do PDF. O contrato de escrita não aceita validade nem desconto geral. Condições parceladas e descrição personalizada dos itens também não estão expostas como na API/site.

Para OS faltam tools de listagem, detalhes, criação, edição, aprovação, início, conclusão, cancelamento, geração de proposta/venda e PDF. As funções e rotas HTTP de várias dessas operações já existem e podem ser reaproveitadas.

## PDFs

Não existe gerador nem endpoint de PDF comercial de proposta ou OS. O gerador da NFS-e atende outro documento.

O botão “Imprimir / PDF” das propostas chama `window.print()` no diálogo genérico de detalhes. O usuário pode salvar a impressão pelo navegador, mas isso não fornece um arquivo comercial gerado pelo servidor, versionado, disponível pela API e pelo plugin. A tela específica de OS nem utiliza esse botão.

Portanto, não há PDFs prontos desses dois tipos cuja paginação ou apresentação pudesse ser validada nesta revisão.

Para completar, implementar modelos separados de proposta e OS, um serviço compartilhado de geração, acesso protegido e controle de versão. Aproveitar `erp.arquivos`, `erp.vendas_arquivos` e `erp.ordens_servico_arquivos`, acrescentando o controle necessário dos documentos gerados. Preservar dados de empresa, cliente, itens, totais e condições na versão emitida. O PDF entregue ao cliente deve excluir as observações internas da OS.

## Melhorias adicionais

- Paginação de OS: a listagem atual tem limite fixo de 300 registros, sem navegação entre páginas.
- Registro claro de aprovação/recusa, motivo, responsável e datas.
- Separação entre versão técnica da linha e revisão comercial entregue ao cliente.
- Testes conjuntos das conversões, incluindo repetição, concorrência, expiração, arquivamento e cancelamento.

## Evidências e limites

- `.cache/proposals-orders-diagnostic/live-schema.json`: estrutura real do Supabase.
- `.cache/proposals-orders-diagnostic/probes.json`: nove observações com banco real; modificações de teste revertidas e comparação dos registros originais aprovada.
- `.cache/proposals-orders-diagnostic/mcp-quotes.json`: teste integrado MCP, autenticação de teste, operações reais do ERP dentro de transação revertida.
- `.cache/proposals-orders-diagnostic/reads.json`: tools de consulta usando o contexto real de somente leitura.

A primeira tentativa de teste mantinha todas as consultas no papel `erp_runtime`, inclusive as de `shared`; isso não reproduzia a alternância de papéis de `src/lib/postgres.ts`. O erro de permissão desse adaptador foi descartado. Uma tentativa intermediária usou um ajuste de permissão apenas em transação revertida; o diagnóstico final foi repetido sem esse ajuste e reproduzindo o comportamento do servidor. A permissão original foi reconferida e permanece inalterada.

Não houve alteração no código do produto, nas políticas permanentes, nos documentos existentes ou no Storage. Não foram testados login OAuth, renderização no navegador do ChatGPT, entrega por e-mail ou PDFs comerciais inexistentes.

## Ordem recomendada

1. Corrigir situações, datas, coordenação OS/proposta/venda e filtros de itens ativos.
2. Completar contratos e tools dos dois documentos.
3. Implementar PDFs comerciais e versões protegidas, integrados à API, site e plugin.
4. Validar o fluxo completo com os testes de regressão e os documentos gerados.
