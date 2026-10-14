# Contas contábeis e DRE — 12/10/2026

## Estrutura

`erp.contas_contabeis` guarda o plano de contas de cada empresa. Grupos são contas sintéticas; contas específicas são analíticas. `conta_pai_id` organiza os níveis da hierarquia, sempre dentro da mesma empresa. Não existe uma tabela separada de planos ou de grupos contábeis.

Campos principais: empresa, código, nome, descrição, conta superior, tipo, classificação, natureza devedora/credora, situação, versão e responsáveis/data da criação e atualização.

Regras de aplicação e banco:

- Código numérico com segmentos separados por ponto, único por empresa, inclusive após desativação.
- Apenas contas sintéticas podem ter filhas. Pai e filha compartilham a classificação.
- Hierarquias circulares, referências entre empresas e contas ativas sob pais inativos são recusadas.
- Cadastros financeiros só podem receber vínculos novos com contas analíticas ativas da mesma empresa.
- Uma conta vinculada preserva código, classificação, natureza e tipo; seu nome e descrição podem ser editados com histórico.
- Desativação exige resolver primeiro as filhas e os cadastros ativos vinculados. Referências históricas permanecem preservadas.
- Exclusão física é bloqueada. A API DELETE desativa o cadastro.
- Alterações incrementam a versão. PATCH aceita alterações parciais e recusa versões desatualizadas.
- As alterações são serializadas por empresa e auditadas em `erp.cadastros_eventos`.
- RLS e permissões seguem o padrão do ERP; consulta exige `erp.cadastros.visualizar`, escrita exige `erp.cadastros.gerenciar`.

`erp.categorias.conta_contabil_id` e `erp.contas_financeiras.conta_contabil_id` ligam categorias, bancos e caixas às contas contábeis. O grupo da DRE e a conta contábil são informações distintas: a DRE gerencial continua calculada pelos registros financeiros, categorias e movimentos de estoque.

Esta etapa fornece o cadastro e os vínculos. Escrituração por partidas dobradas, livros Diário/Razão, arquivos para sistemas contábeis e obrigações contábeis exigem uma etapa própria.

## Tela e API

- Tela: `/erp/cadastros/contas-contabeis`, com hierarquia, busca, filtros, paginação e formulário.
- CRUD: `/api/erp/contas-contabeis` e `/api/erp/contas-contabeis/<id>`.
- Resumo: `/api/erp/contas-contabeis/resumo`.
- Seletor: `/api/erp/catalogos/contas-contabeis?tipo=analitica&q=...&page=1`.
- Para contas superiores, usar `tipo=sintetica`, `excluir=<id da conta editada>` e, opcionalmente, `classificacao=ativo`. O catálogo exclui a própria conta e suas descendentes.
- Seletores exibem 50 opções por página, com pesquisa no servidor. Vínculos históricos são mostrados pelo identificador/nome do registro atual mesmo quando não estão nas opções ativas.

O CRUD usa os envelopes e a autenticação existentes do ERP. Criação: `{ "values": { ... } }`. Edição: `{ "values": { ... }, "expectedVersion": 1 }`. Desativação: `{ "expectedVersion": 2 }`. Empresa e autor vêm da sessão, não do corpo.

## DRE

A tela abre por competência e permite alternar para caixa. Alterar a visão ou o período cancela a consulta anterior; respostas e erros antigos não substituem o resultado atual. O relatório também confere os metadados da resposta antes de renderizar valores ou habilitar exportação. Os detalhamentos cancelam suas consultas ao fechar/trocar.

- Competência: títulos pela data de competência, rateios, ajustes de renegociação, deduções por devoluções e CMV dos movimentos de estoque.
- Caixa: baixas líquidas pela data de pagamento/recebimento; estornos afetam sua própria data; rateios conservam o valor total da baixa.
- Categorias marcadas como `fora_dre` aparecem no indicador de valores fora da DRE, mas não entram em seus subtotais. Os movimentos monetários continuam no fluxo de caixa.
- Compra de mercadorias para revenda fica fora da DRE como aquisição de estoque. O custo vendido é calculado pelo CMV, evitando sua dupla inclusão.
- Categorias sem classificação continuam visíveis em “Não classificado”. A estrutura inicial classificou as 12 categorias conhecidas da empresa de demonstração.

O serviço compartilhado em `server/erpDreReport.ts` é usado pela tela, Portal do Contador e relatório estruturado do MCP. Os aliases antigos `dre-competencia`/`dre-caixa` da API e das tools mantêm as colunas `competencia`, `categoria`, `tipo`, `valor`, mas agora projetam os mesmos cálculos, incluindo as exclusões da DRE e o CMV por competência. Os aliases não retornam subtotais nas linhas, para que somar seus registros não duplique o resultado.

## Migrações e dados iniciais

1. `20261012110000_erp_contas_contabeis`: tabela, vínculos, índices, permissões, proteção de hierarquia/vínculos e novo tipo de evento de cadastro.
2. `20261012111000_erp_classificacao_contabil_demo`: 46 contas iniciais editáveis, classificação/vínculo das 12 categorias e vínculo dos três bancos/caixas da empresa 2, autorizada pelo administrador 3. A migração exige esse vínculo de proprietário e não inicializa outras empresas.

O modelo inicial pode ser ajustado por quem gerencia os cadastros. É uma base de organização para a demonstração, não uma escrituração contábil produzida ou validada por contador.

## Verificação e aplicação

Executar na raiz do projeto, com `.env.local` configurado para o Supabase correto:

```text
node scripts/erp/accounting-regression.mjs
node scripts/erp/accounting-reconcile.mjs
node scripts/erp/accounting-ui-regression.mjs
node scripts/erp/accounting-migrate.mjs --check
node scripts/erp/accounting-migrate.mjs --apply
```

Os dois primeiros scripts aplicam as migrações dentro de transações revertidas. Verificam CRUD, versão, hierarquia, vínculos, paginação, RLS, cálculos independentes e funções de relatório do Portal e da tool. As sequências podem ter lacunas após o rollback, mas os dados de teste não são mantidos.

O teste da interface executa o componente real com transporte e ciclo de hooks controlados, forçando respostas fora de ordem, cancelamentos, troca de período e falhas antigas. Ele verifica o comportamento; não equivale a uma inspeção visual no navegador.

O aplicador confere as assinaturas das migrações testadas, faz backup da estrutura e dos cadastros afetados em `.cache/accounting`, preserva as demais tabelas de negócio, verifica políticas existentes e aplica as duas migrações juntas. A aplicação exige compilação bem-sucedida da versão preparada na Vercel. Credenciais e backups ficam fora do Git.

As evidências operacionais ficam em `.cache/accounting`.

## Resultado da execução

As duas migrações foram aplicadas e verificadas no Supabase: 46 contas contábeis, 12 categorias classificadas/vinculadas e três contas financeiras vinculadas. As 101 demais tabelas de negócio, as políticas existentes e os dados das outras empresas foram preservados.

A publicação `dpl_4B45r88V3WKUws9rahir1wSvMkcr` foi confirmada como `READY` no domínio `https://cognito-seven.vercel.app`. As consultas autenticadas com Clerk passaram também após a promoção: cadastro/listagem/detalhe/resumo/catálogo, categorias e bancos, DRE por competência e caixa, aliases da API e as duas visões no Portal do Contador. Requisição anônima e tentativa de informar empresa no catálogo foram recusadas.

Passaram os testes de CRUD e versão com transação revertida, integridade de hierarquia/vínculos, paginação e RLS; a reconciliação independente dos valores; os cenários de rateio, recebimento parcial e estorno em outro mês; a rejeição de respostas antigas na interface; e a serialização com duas conexões PostgreSQL, sem gravações de negócio. O catálogo da API confirmou 83 rotas/125 métodos, e a verificação das descrições das tools preservou seus validadores e permissões.

No exemplo de setembro de 2026, o resultado gerencial foi R$ 48.275,22 por competência e R$ 42.257,45 na visão de caixa da DRE, ambos com “Não classificado” zerado. A DRE por caixa exclui as aquisições patrimoniais classificadas como fora da DRE; por isso seu resultado pode diferir do resultado total dos pagamentos ou do fluxo de caixa.

O código permaneceu disponível para revisão na árvore de trabalho, sem criar commit Git.
