# Segunda revisão do diagnóstico ERP — 11/10/2026

O diagnóstico anterior é fundamentado, mas não é completo nem constitui certificação de que o ERP esteja perfeito. Mantenho seus seis achados e acrescento quatro frentes de correção. As principais novas evidências estão em cálculos e operações que os dados demonstrativos atuais não exercitam.

Esta revisão não alterou código da aplicação, schema, registros ou buckets. Foram produzidos arquivos locais de diagnóstico. A ausência da integração fiscal real continua fora da lista de defeitos.

## Avaliação das seis conclusões anteriores

| Conclusão | Avaliação |
|---|---|
| Detalhamento de reposição falha pelo alias com acento | Mantida. O alias usado no HAVING difere do criado no SELECT. A evidência anterior contém três falhas da mesma causa. |
| Limite de crédito ignora adiantamentos aplicados | Mantida. O cálculo comercial usa valor menos dinheiro pago, enquanto o saldo financeiro também desconta créditos. |
| Numeração trunca a partir de 10.000 | Mantida. O padding de largura fixa é aplicado na função do banco, chamada pelos documentos. |
| Exportação corta em 50 registros | Mantida. A exportação usa a listagem paginada sem percorrer as páginas. |
| Tabelas de preço e devoluções param na primeira página | Mantida. As telas descartam as informações necessárias para navegar às páginas seguintes. |
| PDFs antigos ainda não migrados ao Storage | Mantida como pendência de implantação. Os buckets privados existem; isso não comprova upload de novos documentos pelo deploy. O fallback permite ler os PDFs antigos do banco. |

Não encontrei motivo para descartar esses achados ou recomendar uma reconstrução do ERP. A distinção entre problema do código, dado atual incorreto e migração pendente deve permanecer explícita.

## Como fiz a revisão independente

- Conferi as funções e os pontos de entrada relacionados às conclusões anteriores.
- Examinei relatórios financeiros por competência e margem, devoluções, créditos, comissões, proteção de títulos gerados e a repetição de requisições na interface/API.
- Executei as consultas reais dos relatórios no PostgreSQL do Supabase, dentro de uma transação READ ONLY, substituindo apenas as fontes de dados por CTEs com registros sintéticos tipados pelas próprias tabelas ERP. Nenhum registro sintético foi inserido no banco.
- Executei funções reais da aplicação com clientes SQL controlados para observar a validação de idempotência e a proteção de títulos.
- Executei o helper HTTP real com um servidor simulado que confirma a operação e perde a primeira resposta, para reproduzir uma falha de rede.
- Consultei a base real para verificar se os novos casos já aparecem nos dados: não há grupos de itens com produto repetido na mesma venda, devoluções ou pagamentos de comissão. Não há evidência de prejuízo atual nesses cenários.

Resultados numéricos e limites de cada reprodução: [evidencias-segunda-revisao.json](evidencias-segunda-revisao.json).

## 7. Custo duplicado no relatório de margem

**Cenário permitido:** uma venda tem duas linhas do mesmo produto, por exemplo com condições ou descrições diferentes. A tabela de itens não possui unicidade por produto/venda.

A consulta `marginSql` procura o custo total de saída por venda e produto. Ela atribui esse mesmo total a cada linha do produto e depois soma as linhas. Assim, duas linhas repetem o custo duas vezes. O problema alcança os relatórios de margem por venda, item e cliente.

**Reprodução executada no PostgreSQL:**

| Dado | Valor |
|---|---:|
| Receita da venda, duas linhas de R$ 100 | R$ 200 |
| Saída de duas unidades, custo de R$ 30 por unidade | R$ 60 |
| Custo retornado pela consulta | R$ 120 |
| Margem correta nesse cenário | R$ 140 |
| Margem retornada pela consulta | R$ 80 |

**Fonte:** `src/products/erp/server/erpFinancialReports.ts:189`, correlação por produto/venda, e linha 198, soma dos custos de cada item. As consultas são utilizadas em `erpProfessionalRepository.ts` nos relatórios de margem.

**Correção:** atribuir o custo ao item de origem quando houver vínculo, ou distribuir o custo agregado de forma consistente entre as linhas do mesmo produto. Conferir também entregas parciais e devoluções. Impedir um produto de aparecer em duas linhas seria uma restrição artificial para esconder o erro de cálculo.

## 8. Reembolso pode reduzir duas vezes o resultado por competência

O fluxo de devolução com tratamento `reembolso` cria uma conta a pagar ao cliente. O cálculo por competência inclui essa conta como despesa e também subtrai o valor da devolução da receita.

**Reprodução executada no PostgreSQL:** venda/receita de R$ 1.000 e devolução de R$ 200 com conta a pagar de reembolso de R$ 200. A consulta retornou:

- Receita original: +R$ 1.000.
- Dedução pela devolução: −R$ 200.
- Despesa pela obrigação de reembolso: −R$ 200.
- Resultado: R$ 600, quando o efeito líquido desse cenário, sem outros custos, é R$ 800.

**Fontes:** `erpReturnsRepository.ts:89` gera a obrigação; `erpFinancialReports.ts:145` inclui contas a pagar e linha 159 inclui novamente a devolução. A DRE por competência consome essa alocação em `erpDreReport.ts:48`.

Na DRE estruturada, marcar manualmente a categoria do reembolso como “Não entra na DRE” pode evitar a segunda dedução. Porém, a operação aceita uma categoria comum de despesa e não exige essa configuração; a correção não deve depender de o usuário conhecer esse detalhe. Não afirmo que todas as DREs ou todas as categorias produzam sempre a duplicidade.

**Correção:** identificar a obrigação como liquidação financeira da devolução e reconhecer o efeito no resultado apenas uma vez. O reembolso deve continuar aparecendo corretamente no contas a pagar e no caixa quando for pago. Excluí-lo indiscriminadamente de todos os relatórios seria incorreto.

## 9. Idempotência incompleta na interface e na API de devoluções

Foram comprovados dois comportamentos relacionados.

**Na interface:** `commercialUi.tsx:17` cria um novo `Idempotency-Key` em cada chamada, inclusive quando a pessoa repete o mesmo envio depois de uma falha de rede. Se o servidor confirmou a primeira operação e somente a resposta se perdeu, a segunda tentativa é interpretada como outra operação.

O teste executou o helper real duas vezes, com o mesmo endereço e corpo. O servidor simulado confirmou a primeira e interrompeu a resposta. A nova tentativa enviou outra chave e produziu duas operações em vez de uma. Esse helper é usado na criação de devoluções e no uso de crédito; uma devolução parcial ainda pode ter quantidade disponível para permitir a segunda operação.

**Na API:** `createSaleReturn`, em `erpReturnsRepository.ts:39`, encontra uma devolução pela chave e a devolve sem comparar a venda ou o conteúdo do novo pedido. Na reprodução com o contrato de entrada real, um pedido de reembolso para a venda 999, com uma chave já usada, recebeu como sucesso a devolução antiga de crédito da venda 1. Não ocorreu vazamento entre empresas; o problema é aceitar uma solicitação diferente como se tivesse sido executada.

O mesmo padrão de retorno sem comparação merece ser corrigido no uso de crédito e pagamento de comissões. A reprodução de payload diferente desta revisão foi feita especificamente em `createSaleReturn`, não em todos esses endpoints.

**Correção:** manter a chave da tentativa enquanto seu resultado estiver incerto e associá-la, no servidor, à operação, ao registro e a um hash do conteúdo. Repetição idêntica deve retornar o resultado original; conteúdo diferente deve retornar conflito. A infraestrutura financeira já contém um exemplo desse comportamento em `erpFinancialTitles.ts` e pode orientar a padronização.

## 10. Contas a pagar geradas por comissão/reembolso ficam desprotegidas na edição genérica

Os dois fluxos utilizam `createManualFinancialTitle`, que grava `origem='manual'`:

- Comissão: `erpCommercialRepository.ts:198`, com vínculo em `comissoes_pagamentos` e incremento de `comissoes_lancamentos.valor_pago` na linha 210.
- Reembolso: `erpReturnsRepository.ts:89`, com vínculo em `devolucoes.conta_pagar_id`.

A proteção em `erpCrudRepository.ts:45` verifica compra/venda, contrato e recorrência, mas não esses dois vínculos. Enquanto o título não tiver pagamento ou outros movimentos, a edição/exclusão genérica pode prosseguir como se fosse um lançamento manual independente. A exclusão é lógica: a FK continua válida porque a linha permanece no banco.

**Impacto:** a obrigação pode ser alterada ou cancelada sem ajustar a origem. Em uma comissão, por exemplo, a conta a pagar pode desaparecer das pendências enquanto o lançamento de comissão continua marcado como alocado/pago e deixa de ser oferecido novamente para geração.

**Evidência:** o fluxo real de `changeManualFinancialTitle` aceitou a exclusão no teste com cliente SQL controlado e não consultou comissões ou devoluções. A inspeção das funções/triggers do catálogo não encontrou validação específica desses vínculos. Não foi executada uma exclusão integrada no Supabase; a base não possui comissões/devoluções atuais e não foram criados dados de negócio para este diagnóstico.

**Correção:** bloquear a edição/exclusão genérica quando existir um desses vínculos. Se o produto oferecer cancelamento da operação de origem, ele deve ajustar título, alocações e histórico na mesma transação. Somente mudar o texto da descrição não protege o relacionamento.

## Como ajustaria as conclusões gerais

1. **Estrutura bem modelada:** concordo. RLS, FKs compostas por empresa, constraints, transações e histórico são pontos positivos reais. Não recomendo trocar a arquitetura.
2. **Dados atuais consistentes:** concordo dentro das verificações realizadas. Isso não significa que todos os eventos futuros produzam resultados corretos. Os novos cenários mostram justamente essa diferença.
3. **Segurança:** o teste anterior comprovou isolamento entre empresas nos contextos examinados. Não cobre todas as combinações de permissões de vendedor/contador, operações de escrita ou OAuth. O relatório já trazia essa ressalva; ela deve ter o mesmo peso que a conclusão positiva.
4. **Dashboards e relatórios:** os 44 cálculos conferidos não eram uma validação universal da DRE e de todos os relatórios de margem. Manter a afirmação limitada aos dashboards, período e dados testados.
5. **Storage:** classificar como implantação/migração pendente, sem afirmar que PDFs antigos estão quebrados ou que a chave da Vercel está ausente.
6. **Build:** continua não comprovado. A falta de memória do computador não é defeito do ERP, mas impede declarar que toda a checagem de tipos/build passou. Não repeti o mesmo teste pesado enquanto a memória virtual disponível permaneceu abaixo de 250 MiB.

## Prioridades consolidadas

1. Cálculos financeiros: limite de crédito, margem com produto repetido e competência de reembolsos.
2. Integridade das operações: repetição após falha de rede, conflito de chave e proteção de títulos vinculados a comissões/reembolsos.
3. Erro atual de reposição e limites de numeração, exportação e paginação.
4. Migração dos PDFs antigos, reconciliação do histórico de migrações e conclusão do build.

São seis achados anteriores mantidos e quatro frentes adicionais. O resultado é uma base profissional com correções específicas necessárias; não uma garantia de ausência de qualquer outro defeito. Nenhuma mudança na aplicação foi implementada nesta revisão.
