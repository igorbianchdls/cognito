# Melhorias do financeiro — 14/10/2026

As cinco melhorias da auditoria foram implementadas no código local. Esta rodada não publicou uma nova versão no site.

## Alterações

- **Recorrências:** botão em Contas a pagar abre a listagem financeira, com edição da descrição e do término (quantidade total, data ou indeterminado), pausa, retomada e encerramento. A edição afeta os lançamentos ainda não gerados. Frequência, valores e calendário original permanecem preservados. O servidor valida a próxima ocorrência e o conflito de versão; uma recorrência encerrada não pode ser editada.
- **Regras simultâneas:** cada transação bancária pendente é verificada novamente sob bloqueio antes de lançar. Outra execução que já processou ou está processando o mesmo movimento é ignorada; conflitos reais de chave não são ocultados.
- **Conciliação:** alterações da lista principal, importações, regras, conciliação sugerida, desfazimento e descarte atualizam também histórico, sugestões e conferência do saldo. Conta, filtro e paginação são preservados.
- **Seleção de baixas:** referência única, data e moeda brasileiras, documento, contraparte e conta. A busca contextual considera a conta e a direção do extrato e exclui baixas estornadas, conciliadas e sem valor líquido positivo. O servidor continua validando o vínculo ao salvar.
- **Créditos:** data legível no seletor e histórico. A aplicação sugere o menor valor entre o saldo da parcela e o crédito disponível; a devolução sugere o crédito disponível. A sugestão acompanha a troca de adiantamento. As validações de saldo do servidor foram mantidas.

## Validação

- TypeScript do ERP aprovado.
- ESLint dos arquivos alterados: sem erros. Os avisos anteriores de navegação e limpeza de referência continuam fora do escopo; a dependência nova desnecessária foi corrigida.
- Duas execuções reais simultâneas de regra: uma baixa de R$ 10, um título, zero duplicações e zero falsas falhas. A baixa foi estornada, o título cancelado, a transação ignorada e a conta QA inativada.
- Regressão do servidor com banco real e rollback: edição afeta somente a próxima ocorrência, preservação do título inicial, término inválido, conflito de versão, pausa, retomada e encerramento. Catálogo validado contra conta/direção incorretas, estorno e referência de transação inexistente.
- Componentes reais no navegador local com respostas fictícias: editar, pausar, retomar e encerrar; crédito de R$ 20 em título de R$ 100 com sugestão de R$ 20 e data 14/10/2026; conciliação manual atualizando linha, histórico e pendências; desfazimento preservando conta e filtro.

Os testes locais não substituem o reteste da próxima publicação com autenticação e usuários de permissões restritas. Não houve transação bancária externa.

## Evidências e reprodução

- `testes-financeiro-melhorias.mjs`: testes de servidor, sempre em transação desfeita.
- `testes-financeiro-melhorias-concorrencia.mjs`: duas conexões, fixtures QA na empresa 2 e limpeza ao final.
- `financeiro-melhorias-regressao.json` e `financeiro-melhorias-concorrencia.json`: resultados locais.
- `scripts/erp/financial-improvements-ui-fixture.mjs`: componentes reais com HTTP fictício, sem acesso ao banco; servir em 127.0.0.1:3197.
- Capturas em `output/audit-20261014/financeiro-melhorias-*-local.png`. A aparência do ambiente de teste usa CSS simplificado; os componentes e interações são os do ERP.

## Atualização do fechamento

A gestão de recorrências foi retestada no domínio publicado, com edição, pausa, retomada, encerramento e preservação do título anterior. Crédito/devolução exibem data brasileira e sugerem R$ 20 disponíveis; catálogo contextual mostra referência #1150, data, moeda, contraparte e conta. Conciliação manual, desfazimento e sugestão exata atualizaram a linha, histórico, sugestões e pendências sem recarga e preservaram conta/filtro. Evidências em `fechamento-financeiro-ui.json` e `fechamento-financeiro-complementar.json`. Fixtures encerradas e efeito líquido financeiro zero, conferido no banco. Perfis reais distintos continuam dependentes da disponibilidade dessas sessões.
