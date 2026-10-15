# Correções de compras e cadastros — 14/10/2026

## Entrega

As seis falhas confirmadas foram corrigidas no código e incluídas na versão `dpl_Fmz6Jgfx4m9pjYckBDvdSrLHroQg`, promovida para `https://cognito-seven.vercel.app`. Migração `20261015010000` aplicada e verificada no banco, com registro no histórico de migrações. O manifesto de publicação conserva os hashes dos arquivos enviados e a versão anterior para eventual reversão.

## Mudanças

1. **NF-e válida:** inserção/atualização de vínculo fornecedor-produto liberadas somente para a empresa do contexto e capacidades de gerenciar compras/cadastros. Leitura preservada; nenhuma política DELETE adicionada. Também completado o recebimento de estoque que estava ausente no importador: somente saldo ainda não recebido, itens vinculados ao documento, quantidade recebida e local atualizados, custo incluindo encargos/descontos. Tudo na mesma transação da nota e do financeiro.
2. **Endereço importado/legado parcial:** cidade sem logradouro (e outros endereços parciais permitidos pelo banco) pode reabrir e salvar; campos opcionais vazios são persistidos como null quando exigido pelo contrato do banco. Endereço totalmente vazio continua recusado.
3. **IBGE opcional:** aceita vazio, null ou omissão, inclusive após serializar e validar de novo. Código preenchido inválido continua recusado com mensagem específica em português.
4. **CSV de fornecedor:** telefone e alias celular são importados e persistidos.
5. **Contato legado:** e-mail/telefone enviados na raiz são traduzidos para os contatos normalizados. Preserva demais contatos e documento; permite limpar campo. Coleção estruturada explícita tem prioridade. O bloqueio de versão e a auditoria permanecem compartilhados por tela/API/tool.
6. **Reenvio de CSV:** limpa o valor do input após sucesso, permitindo selecionar novamente o mesmo arquivo sem recarregar; a deduplicação por conteúdo continua no serviço.

## Validação

- **17/17 grupos** em `compras-cadastros-corrigidos.json`: CRUD, versões, categorias, CSV parcial/reenvio, cancelamento após consumo, custo/financeiro multi-itens, rejeição de XML inválido e importação válida/repetida.
- **7/7 grupos específicos** em `cadastros-correcoes-regressao.json`: estabilidade de IBGE, validações inválidas, endereços parciais nos três tipos de pessoa, aliases de telefone e preservação de contatos/documento.
- NF-e sintética em homologação: duas unidades recebidas, uma conta de R$ 100 e repetição da mesma nota reutilizada. Ensaio com PostgreSQL real e papel restrito; dados revertidos por rollback, sem comunicação fiscal externa.
- Migração: proprietário autorizado gravou fixture revertida, identidade sem vínculo e outra empresa foram recusadas com 42501; política SELECT preservada. `migracao-vinculo-fornecedor.json`.
- Tela local com componentes reais: endereço importado sem logradouro e sem IBGE salvou; mesmo CSV selecionado/importado duas vezes sem recarga. Respostas HTTP fictícias somente nesse ensaio visual; não substitui os testes dos serviços reais.
- TypeScript sem erros. ESLint sem erros; um aviso preexistente de `_total` não utilizado no importador. Construção de produção concluída.
- Antes da promoção: HTTP autenticado da versão candidata verificou quatro cadastros e seus contratos, quatro exportações, acesso ERP e recusa do agendador anônimo. Verificação equivalente repetida no domínio principal.

## Evidências e limites

Resultados HTTP e manifesto em `.cache/registration-fixes/deployment/`. Scripts de reprodução em `docs/avaliacao-erp/20261014-auditoria/` e publicação em `scripts/erp/*registration-fixes*.mjs`. A API e o runtime MCP usam os serviços corrigidos; não foi feita nova sessão OAuth dentro de um host MCP externo.

Esta entrega fecha as seis falhas listadas; não certifica emissão fiscal externa, novos perfis de usuário, disparo de cron por horário ou devolução ao fornecedor.

Conferência visual no domínio principal: registro 351 reabriu com todos os dados e botão Salvar habilitado; registro 354 salvou com IBGE vazio, persistiu null e permaneceu inativo (versão 4). O CSV QA foi selecionado novamente sem recarga, reutilizando o lote 13 e o registro 351. Arquivo correcoes-publicadas-dados.json confirma o salvamento e um único cadastro QA inativo.
