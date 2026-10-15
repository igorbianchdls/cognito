# Compras e cadastros — testes de 14/10/2026

## Resultado desta rodada

36 grupos automatizados com serviços reais e PostgreSQL real: **32 aprovados e 4 falharam**. As verificações visuais no site publicado são complementares e não estão incluídas nessa contagem. A contagem é de grupos, não de cada afirmação interna. As duas rodadas iniciais com problemas do próprio ensaio (contexto após SAVEPOINT e consulta gerada sem parâmetros) foram corrigidas e não são defeitos do produto.

Não significa que todos os módulos ou todas as combinações de interface estejam certificados. O XML válido bloqueou os testes que dependem de sua importação; há pendências visuais e de perfis descritas abaixo.

## Compras

| Cenário | Resultado e evidência |
|---|---|
| Cancelar após consumir estoque de um dos dois itens | Aprovado: recusa sem reversão parcial de estoque ou títulos. Depois de recompor o saldo, cancelou e zerou o estoque QA. |
| Dois itens, desconto R$ 20 e frete R$ 40 | Aprovado: produtos R$ 200, aquisição R$ 220, estoque valorizado em R$ 220, uma conta a pagar de R$ 220. Reenvio não duplicou. |
| Dois recebimentos simultâneos | Aprovado em duas conexões: somente um recebimento; estoque de duas unidades; uma conta de R$ 220 com duas parcelas de R$ 110. O segundo recebeu erro de quantidade excedente. |
| Recebimento versus cancelamento simultâneo | Aprovado na ordem de execução observada: cancelamento venceu; recebimento recusado; compra cancelada, estoque zero e títulos cancelados. Não comprova todas as ordens possíveis de escalonamento. |
| Recorrência mensal e reenvio | Aprovado: 31/01, 28/02 e 31/03/2027; três ocorrências; nova execução não gerou outras; recorrência encerrada. |
| Dois processadores da mesma recorrência | Aprovado: trabalhadores geraram 3 e 0 documentos; três competências únicas no banco. Seleção limitada ao ID QA. |
| Compra de serviço | Aprovado: duas unidades de R$ 100, conta a pagar de R$ 200; entrada em estoque recusada; cancelamento permitido sem pagamento. |
| XML inválido/não autorizado | Aprovado: recusados sem criar nota. |
| XML sintético autorizado em homologação | **Falha**: bloqueio RLS ao inserir `erp.fornecedores_produtos`. A tabela tem política SELECT, sem política de escrita para o papel restrito usado pelo ERP. Não foi removida proteção nem usada conta privilegiada para contornar o erro. |

O ciclo válido de XML (duplicidade, vínculo com pedido e estoque/financeiro) **não está aprovado**: a importação falha antes de concluir. Não houve emissão nem comunicação fiscal externa. A ausência de efeitos parciais persistidos foi conferida após rollback; o ensaio não certifica todos os caminhos HTTP de falha.

## Cadastros

- Serviços reais: criar, editar, buscar, recusar versão antiga e desativar clientes, fornecedores, vendedores, produtos, serviços e as duas categorias: aprovados.
- Contatos estruturados de cliente/fornecedor/vendedor: edição, preservação quando omitidos e recusa de dois contatos principais para a mesma finalidade: aprovados.
- Conta contábil sintética e filha analítica: criação, edição, versão e desativação: aprovados; desativação da mãe com filha ativa foi recusada.
- Categoria de cadastro com pai do mesmo tipo: aprovada; pai/filha de tipos incompatíveis: recusada.
- CSV dos quatro tipos: uma linha válida e uma inválida, status parcial, relatório com linha 3, busca do registro e repetição sem duplicar: aprovados no serviço.
- CSV de produto/serviço com mesmo SKU/código em arquivo de conteúdo diferente: recusou duplicata e registrou erro por linha.
- Edição pelos campos legados `email`/`telefone` na raiz: **falha do contrato legado** — os valores são aceitos, mas permanecem anteriores. O formato atual `contatos` funciona; não confundir com falha de toda edição de contato.
- Telefone no CSV de fornecedor: **falha** — a coluna anunciada pela tela não é mapeada e o telefone fica vazio.
- Cliente importado com apenas cidade: **falha reproduzida no site** — cria endereço com logradouro vazio, que o contrato atual recusa ao reabrir; o formulário fica vazio e salvar é bloqueado.

## Evidência pela interface publicada

- Categoria financeira ID 132, `QA-OTTO CAD DRE FINAL 026`: criada explicitamente fora da DRE; reabriu com a mesma classificação; descrição editada; desativada no diálogo do próprio site. A exclusão de resultados é coberta pelos ensaios financeiros anteriores; não foi criado novo lançamento nessa categoria nesta rodada.
- Importação lote 13, `QA-OTTO-cadastros.csv`: duas linhas, uma importada e uma com erro. Relatório CSV de erros baixado, linha 3 com “Nome é obrigatório”. Após recarregar e reenviar o mesmo arquivo, retornou lote 13 e registro 351, sem duplicar.
- Exportações de clientes, fornecedores, produtos e serviços baixadas pelos links reais. Cabeçalhos CSV conferidos; o cliente QA apareceu uma vez com e-mail, telefone e cidade corretos. Não equivale a reconciliar cada cadastro histórico da empresa.
- **Defeito adicional da tela**: depois de importar, selecionar novamente o mesmo arquivo não atualiza o estado e mostra “Selecione um arquivo CSV”. Recarregar resolve temporariamente. O componente limpa `file`, mas não o valor do input.
- Cliente 351: busca aprovada; edição bloqueada por endereço incompleto; desativação aprovada no diálogo interno. Histórico de importação preservado.
- Produto 223: campo obrigatório recusado, criado por R$ 123,45, pesquisado, reaberto, alterado para R$ 125,55 e desativado pela tela.
- Serviço 74: criado com preço R$ 200 e custo R$ 75; pesquisado, reaberto, custo alterado para R$ 80 e desativado pela tela. Captura `cadastros-servico-final-inativo.png`.

## Rotinas

Os cinco tipos (contratos, recorrências financeiras/compras, títulos vencidos, estoque mínimo e indicadores) concluíram e repetiram a mesma execução sem duplicar. Contratos/recorrências foram limitados a conjunto vazio no seletor do ensaio; seus efeitos com documentos não são certificados por esse teste de orquestração. A recorrência de compras teve ensaio separado com documentos reais QA.

O disparo do agendador por horário/cron não foi executado globalmente: isso processaria dados não QA. Não foi apresentado como aprovado.

## Plano de correção

| Prioridade | Ajuste | Critério para concluir |
|---|---|---|
| Alta | Permissão de escrita do vínculo fornecedor/produto no XML, com empresa e capacidade corretas | Importar XML válido pelo papel restrito e HTTP; repetir chave; vincular pedido; conferir quantidades, custo, parcelas e rollback de erros; garantir recusa de outra empresa. Não ampliar permissões indiscriminadamente. |
| Alta | Compatibilidade de endereços incompletos vindos de CSV/legado | Importar só cidade, reabrir e editar sem perder campos; decidir no contrato compartilhado como representar endereço parcial. Repetir em cliente, fornecedor e vendedor. |
| Média | Mapear telefone do fornecedor no CSV | Coluna `telefone` e alias `celular` persistem e retornam na busca/exportação. |
| Média | Tornar explícita a compatibilidade de e-mail/telefone legados | Atualizar contato equivalente ou recusar claramente o formato antigo; não aceitar silenciosamente sem efeito. Regressão via serviço/API/tool. |
| Média | Limpar valor do input após importar CSV | Selecionar o mesmo arquivo novamente sem recarregar; retornar o lote existente, sem duplicar. |

## O que continua aberto

1. Retestar os caminhos de XML impedidos pela falha e a edição dos cadastros com endereço parcial após correção.
2. Completar o ciclo visual de cada variante de cliente/fornecedor/vendedor e categoria de cadastro. Os serviços compartilhados passaram, mas isso não é prova de todos os controles da tela.
3. Perfis reais de consulta/operador, acesso entre empresas e integração OAuth/MCP em host externo continuam no roteiro transversal. Os testes desta rodada usam o usuário 3 da empresa 2.
4. Disparo agendado em ambiente isolado com fixtures QA.
5. Devolução ao fornecedor: lacuna funcional no fluxo examinado; não há ação dedicada comprovada. Precisa definição/implementação antes de teste completo.

## Limpeza e evidências

Ensaios sequenciais usaram rollback. Ensaios de concorrência gravaram somente fixtures QA: compras canceladas, recorrências inativas, produtos pausados; arquivos de resultado registram IDs e nenhuma falha de limpeza. Nenhum pagamento bancário real foi executado.

Arquivos: `compras-cadastros-consolidado.json` agrega os seis relatórios de resultado; scripts `testes-compras-cadastros*.mjs`, `testes-compras-concorrencia.mjs`, `testes-cadastros-contabilidade.mjs`, `testes-cadastros-detalhes.mjs` e `testes-compras-servicos-csv.mjs` reproduzem os cenários. Capturas em `output/audit-20261014/`, especialmente `cadastros-csv-parcial.png` e `cadastros-edicao-importado-erro.png`.

Conferência final independente (compras-cadastros-limpeza.json): 18 compras QA canceladas; 9 contas a pagar sem nenhum título ativo; 3 recorrências inativas; 7 produtos inativos e estoque físico somado zero; serviço 74, cliente 351 e categoria 132 inativos. Essa conferência inclui as rodadas de concorrência anteriores desta sessão, sem apagar o histórico.

## Continuação — interface e acessos

- Cliente 354: campos obrigatórios, criação com contato e endereço, busca, reabertura, edição de e-mail/cidade/IBGE e desativação pela tela aprovados quando o IBGE está preenchido.
- **Nova falha confirmada:** endereço novo com IBGE opcional vazio retorna “Invalid input”. O contrato transforma vazio em null na tela e recusa esse null ao validar de novo no servidor. O mesmo formulário salvou ao informar 2304400. Reprodução isolada em `cadastros-ibge-opcional.json`; captura `cliente-endereco-ibge-vazio.png`. A correção deve aceitar sua própria saída serializada e manter o IBGE opcional, com mensagem em português por campo.
- Fornecedor 355 e vendedor 356: criação com contato, busca, reabertura, edição de e-mail e desativação pela interface aprovadas; telefone do vendedor também editado e persistido.
- Segurança no banco real: 105 tabelas com escopo de empresa consultadas como proprietário; identidade sem vínculo recebeu zero registros nas 105 tabelas e na projeção fiscal. Testes somente leitura, sem alterar perfis. Evidência `cadastros-permissoes-complemento.json`.
- Perfis disponíveis: somente um owner ativo. Login visual de consulta/operador permanece bloqueado pela ausência dessas identidades; os perfis não foram criados nem permissões ampliadas.
- Agendador: endpoint publicado sem credencial retornou HTTP 401. Há configuração de cron no repositório, mas a empresa não possui execução concluída no histórico consultado; isso não prova a causa nem certifica disparo por horário. Não foi acionado o processador global com credencial.
### Encerramento da continuação visual

Categoria de cadastro 122 (tipo cliente): criação, busca, reabertura, edição de descrição e desativação passaram pela tela publicada. Assim, os ciclos básicos de cliente/fornecedor/vendedor/categoria que estavam sem evidência visual foram executados. Isso não certifica todas as variantes PJ/estrangeiro, múltiplos endereços, filiais ou todos os filtros.

Verificação independente no banco (`cadastros-ui-complemento-limpeza.json`): entidades 354/355/356 inativas e versão 3; três contatos com e-mails editados preservados; cidade e IBGE editados do cliente persistidos; categoria 122 inativa com descrição editada. Não houve lançamento financeiro nesta continuação.

O total anterior de 36 grupos permanece como registro da rodada anterior. Esta continuação adiciona a matriz de leitura em 105 tabelas, ensaio HTTP do agendador, quatro ciclos básicos visuais e reprodução isolada da **nova falha de IBGE opcional**. Não somar inventários de perfis e leitura de histórico como aprovação de perfis ou agendamento.

Próximo trabalho necessário: corrigir as falhas confirmadas, incluindo o contrato que rejeita null no código IBGE; depois retestar XML válido, endereços, CSV e compatibilidade dos contatos. Login de outros perfis depende de identidades disponíveis; execução agendada precisa de ambiente isolado para não processar documentos reais.

## Correções entregues

As seis falhas descritas neste histórico foram corrigidas e publicadas. Relatório atual de implementação e validação: [correcoes-compras-cadastros.md](correcoes-compras-cadastros.md). Os resultados antigos de falha permanecem como evidência histórica e não descrevem a versão publicada após esta correção.
