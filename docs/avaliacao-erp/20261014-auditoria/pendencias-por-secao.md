# Cobertura e pendências por seção — revisão de 14/10/2026

Esta revisão confronta os registros de 13 e 14/10, as correções posteriores e o menu atual. Não executa novos cenários de negócio nem certifica todos os módulos. “Sem evidência recente” significa que o cenário precisa ser comprovado; não significa defeito confirmado nem ausência de testes antigos.

## Cadastros

**Com evidência:** criação de cliente, fornecedor, produto e serviço pela API; categorias financeiras criadas pela tela; categoria fora da DRE gravada corretamente pela API; proteção de conta contábil com filha ativa e mensagem específica corrigida. Há CRUD de cliente/fornecedor via MCP em ensaio anterior de 06/10, sem OAuth real.

**A validar:**

- C01 — Criar/editar categoria com “Não entra na DRE” pela interface, confirmar persistência e exclusão do resultado. A tentativa visual anterior foi inconclusiva; a API passou. Não classificar como falha de cálculo.
- C02 — Completar a matriz de criação, edição, desativação, busca e validações pela interface para clientes, fornecedores, vendedores, produtos, serviços e categorias de cadastro. Conferir vínculos em uso e preservação dos documentos anteriores. A cobertura recente não comprova todo esse ciclo por cadastro.
- C03 — Importação/exportação CSV de cadastros: arquivo válido, duplicado, linhas inválidas, mensagens por linha, repetição e conferência do resultado exportado. Os testes de extrato bancário CSV não comprovam importação de cadastros.
- C04 — Rotinas e recorrências: execução agendada e resultado operacional dos diferentes tipos de rotina, em escopo QA. Foram testados processadores específicos; não foi executado indiscriminadamente o agendador global da empresa.

## Compras

**Com evidência:** compra direta e pedido; confirmação; recebimento 7+3; rejeição de excesso; reenvio sem duplicar; uma conta a pagar; pagamento parcial; bloqueio de cancelamento com pagamento; estorno e cancelamento após tratamento financeiro; custo de aquisição incluindo frete/desconto. Os defeitos de status/entrada e recebimento 500 foram corrigidos e retestados.

**A validar:**

- P01 — Cancelamento após consumo do estoque da compra: saldo insuficiente, nenhuma reversão parcial e coerência de títulos, estoque e custos. Registro de 13/10 deixa o caso pendente; não foi localizada evidência posterior que o encerre.
- P02 — Notas de compra/XML: importação válida, arquivo inválido, duplicidade da chave, vínculos com pedido/fornecedor/itens e efeitos financeiros/estoque sem duplicação. A cobertura comercial recente não comprova esse módulo completo.
- P03 — Recorrências de compras no PostgreSQL real: calendário, repetição, concorrência e preservação das compras já geradas. Os testes financeiros recentes são de recorrências financeiras, não desse processador de compras.
- P04 — Concorrência de recebimentos/cancelamento de uma compra com múltiplos itens, descontos, frete e parcelas. Recebimento sequencial com reenvio passou; isso não substitui esse cenário concorrente completo.

**Lacuna funcional a confirmar/definir:** devolução ao fornecedor não tinha ação identificada na tela auditada. Não declarar esse fluxo aprovado nem tratá-lo como simples teste de botão existente.

## Vendas

**Com evidência:** orçamento → venda, vencimento/recusa, parcelas, confirmação/reserva, entregas parciais, repetição/concorrência, cancelamentos protegidos, devolução/abatimento/crédito/reembolso, descontos e tabela de preços, limite de crédito/liberação, metas e comissões. As cinco falhas complementares de custo, provisões, crédito e descontos foram corrigidas; regressão final de 15 cenários aprovada. Provisões agrupadas e bloqueios após baixa parcial/total também foram exercitados.

**A validar:**

- V01 — Revisão de contrato com múltiplos itens e condições distintas, preservando ciclos anteriores e alterando somente os próximos. Revisão simples e fim de mês já passaram.
- V02 — PDFs/arquivamento/anexos comerciais com Storage real e download no ambiente publicado. Há testes com banco real e Storage simulado; é necessário conferir a configuração e o estado atual antes de chamar a pendência de configuração ainda aberta.

**Lacuna funcional:** suspensão e encerramento manual de contratos não têm ações dedicadas identificadas no fluxo examinado. Geração, revisão e limite de vigência têm testes; não equivalem à suspensão/encerramento manual.

## Serviços e fiscal

**Com evidência:** OS rascunho/edição/versionamento, aprovação, execução, conclusão, bloqueios de etapa, conversão OS → orçamento → venda e abertura do documento vinculado. NFS-e e PDF/XML possuem testes de simulação e consistência do snapshot do tomador.

**A validar:**

- S01 — Emissão, consulta, rejeição e cancelamento com provedor fiscal externo em homologação. Simulação local não equivale a homologação fiscal.
- S02 — PDFs fiscais/comerciais, links temporários e anexos com armazenamento real na versão publicada, incluindo recusa de outra empresa. Testes de acesso com Storage em memória não comprovam o serviço real.

## Estoque

**Com evidência:** quantidade física/reservada/disponível, custo médio, fracionamento, conversão positiva e inválida, inventário multi-itens/atomicidade, transferência de custos entre locais, kits/componentes, alterações de composição após saída, devoluções intercaladas e concorrência de entradas/saídas/entregas/devoluções. CSV de movimentos e posição conferidos.

**A validar:**

- E01 — Fechar a evidência pela interface publicada dos fluxos que possuem validação apenas de serviço ou componente local, especialmente inventário multi-itens e conversões. Não repetir como “não testados” os cenários que já passaram no servidor.

**Limite do produto:** uma venda usa o local reservado. A divergência é recusada. Duas vendas em locais distintos passaram; distribuição de uma única venda entre vários locais não é um fluxo atualmente suportado.

**Dado histórico de QA:** movimentos antigos que evidenciaram custo incorreto foram preservados. A correção de novas operações não reescreve esses movimentos. Não usar esses registros antigos como baseline limpo sem reconciliação explícita.

## Financeiro

Os fluxos principais, concorrência, recorrências, crédito, cartões, importação e reconciliação têm evidências detalhadas no roteiro financeiro. As cinco melhorias finais foram implementadas e testadas localmente; ainda não publicadas nesta rodada.

- F01 — Publicar e retestar as cinco melhorias na versão real, com autenticação. Ver `financeiro-melhorias-implementadas.md`.
- F02 — Interface com perfis reais de consulta e operador. RLS/capacidades foram verificadas no servidor; não equivalem ao login visual desses perfis.

## Relatórios e dashboards

**Com evidência:** sete dashboards, detalhamentos, conferência de saldos e 46 comparações independentes; DRE caixa/competência e fluxo no recorte 01–14/10/2026, além de cenários de rateio, fora da DRE e estorno.

- R01 — Consolidar conferência equivalente dos relatórios de vendas, compras e margem em cenários controlados, com filtros, paginação e exportação, distinguindo testes antigos dos da versão atual. Testar um dashboard não comprova todos os relatórios independentes.
- R02 — Ampliar períodos de resultado, incluindo virada de mês/ano, com evidência explícita. O recorte conferido não certifica todos os períodos históricos.

## Pendências transversais

- T01 — Perfis distintos nas demais seções: leitura, edição, execução e ausência de acesso; acesso direto à API além da visibilidade dos botões.
- T02 — OAuth e execução completa dentro do ChatGPT/Claude reais. O runtime MCP, os serviços e fluxos de prévia/confirmação têm testes locais; os hosts externos não foram comprovados.

Este é um roteiro de fechamento, não uma contagem de todas as combinações possíveis. Lacunas funcionais e homologação externa devem permanecer separadas de defeitos confirmados.

## Fontes principais

- Registros brutos: `.cache/audit-20261013/results.ndjson`.
- `../20261013-auditoria/plano-melhorias.md`, `resumo-ajustes-parciais.md`, `compras-financeiro-validacao.json`, `melhorias-validacao.json` e `estoque-vendas-servicos-resumo.md`.
- `estoque-vendas-cobertura.md`, `correcoes-resumo.md`, `correcoes-cinco-falhas.md`, `regressao-cinco-falhas-final.json`, `cobertura-consolidada.json`.
- `financeiro-fechamento-final.md`, `financeiro-melhorias-implementadas.md`, `financeiro-reconciliacao-final-evidencia.json`.
- `../propostas-ordens-servico-implementacao-20261010.md`, `../correcoes-pdf-xml-anexos-20261010.md`, `../pdfs-fiscais-storage-20261010.md` (evidências históricas; estado de publicação/configuração requer reconferência).
- Menu atual: `src/products/erp/shared/navigation.ts`.


## Atualização após testes de compras e cadastros

Rodada de 14/10: 36 grupos automatizados, 32 aprovados e 4 falhas; ensaios visuais adicionais. P01 e P03 passaram; P04 passou nos cenários observados com frete, desconto e duas parcelas. P02 bloqueado por RLS ao gravar vínculo fornecedor/produto no XML válido. C01 persistência visual aprovada. C02 CRUD nos serviços aprovado, matriz visual parcial e erro ao editar endereço incompleto importado. C03 importações/reenvio/exportações testados; telefone de fornecedor descartado e reescolha do mesmo arquivo exigindo recarga são defeitos. C04 orquestração dos cinco tipos e recorrências aprovadas em escopo restrito; disparo cron não testado. Plano e limites completos: [compras-cadastros-resultados.md](compras-cadastros-resultados.md).

### Continuação dos cadastros pela interface

Cliente, fornecedor e vendedor criados com contatos, pesquisados, reabertos, editados e desativados na versão publicada. Cliente com endereço completo passou com IBGE preenchido. Encontrado defeito adicional: IBGE opcional vazio vira null na primeira validação e é recusado na validação seguinte ("Invalid input"). Ajuste no contrato compartilhado é necessário antes de encerrar a regressão de endereços. Isolamento de leitura conferido em 105 tabelas reais; identidade sem vínculo não leu registros. Não há usuários ativos de consulta/operador para login visual. Endpoint do agendador sem credencial recusa com 401; histórico de execução concluída da empresa estava vazio, então disparo automático segue sem comprovação.
C02: ciclos básicos visuais de cliente/fornecedor/vendedor/categoria de cadastro concluídos nesta continuação; registros 354/355/356 e categoria 122 inativos, com alterações conferidas diretamente no banco. Regressão de endereços e variantes continua dependente das correções registradas.

## Fechamento das seis correções

As seis falhas de compras/cadastros listadas no relatório foram corrigidas e publicadas em `dpl_Fmz6Jgfx4m9pjYckBDvdSrLHroQg`. Migração 20261015010000 aplicada; 17 grupos de regressão geral e 7 específicos aprovados. HTTP autenticado no candidato e no domínio principal aprovado. Cadastro importado com endereço parcial reabre; IBGE pode permanecer vazio; CSV de fornecedor mantém telefone; contrato legado de contatos atualiza sem perder outros contatos/documento; mesmo arquivo pode ser escolhido de novo sem recarga; XML válido importa com estoque e financeiro coerentes e sem duplicação na repetição. Detalhes em [correcoes-compras-cadastros.md](correcoes-compras-cadastros.md).

Permanecem como pendências externas/funcionais: perfis reais distintos disponíveis para login, disparo por horário em ambiente isolado, emissão fiscal externa e fluxo de devolução ao fornecedor. Esses itens não são as seis falhas corrigidas.