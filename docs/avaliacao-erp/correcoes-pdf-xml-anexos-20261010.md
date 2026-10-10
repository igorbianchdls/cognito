# Correções de consistência documental e anexos

Data: 10/10/2026. Escopo autorizado: os dois erros de PDF/XML da NFS-e e download da proposta pela lista de anexos, encontrados na revisão.

## Implementado

- A DPS/XML passa a usar `destinatario_snapshot`, assim como o PDF. Alterações posteriores no cadastro não mudam silenciosamente o tomador. Editar o rascunho atualiza esse snapshot; emitir e consultar um retorno posterior preservam os dados revisados. Documentos históricos não foram reescritos.
- O resolvedor de anexos reconhece `orcamento` com as permissões e os vínculos de vendas. A correção abrange metadados anteriores sem alterar arquivos imutáveis.
- O download de `erp-comercial` usa o mesmo seletor de configuração do arquivamento: variáveis comerciais, fiscais como reserva e validação do projeto do ERP. Downloads de `erp-fiscal` usam a configuração fiscal. Os demais anexos mantêm sua configuração existente.
- A migração `20261010130000_documentos_anexos_orcamento` foi aplicada e conferida no Supabase do ERP. O alias resolve para `vendas / vendas_arquivos / venda_id`.

## Verificação executada

`scripts/erp/document-consistency-smoke.ts`: quatro cenários aprovados com banco real, permissões do ERP e Storage em memória:

1. Alterar o cadastro depois de criar o rascunho mantém PDF e XML com o mesmo tomador.
2. Editar o rascunho incorpora o novo tomador; retorno posterior não o altera; o PDF da primeira revisão permanece intacto.
3. Proposta arquivada pode ser obtida pela rota própria e receber link de download pelos anexos; acesso com outra empresa é bloqueado.
4. OS arquivada recebe link pelos anexos; configuração de outro projeto é recusada.

Transação de teste revertida e conteúdo original de todas as tabelas ERP conferido por impressão digital. Nenhum registro de negócio persistido pelo teste; sequências de IDs podem avançar. Foram 23 operações e oito objetos no Storage simulado, sem requisições externas. A migração corretiva foi aplicada separadamente após a aprovação dos testes.

TypeScript direcionado aos arquivos alterados e ao teste: zero erros. Evidências locais: `.cache/commercial-documents/consistency-fixes.json` e `consistency-typecheck.json`.

## Limites e publicação

Não foi feito upload real nem teste no host do ChatGPT nesta etapa. A configuração de Storage fiscal/comercial e a migração dos PDFs fiscais existentes permanecem pendentes, conforme a revisão. Nenhuma publicação na Vercel foi feita: promover o conjunto sem configurar Storage prejudicaria a geração fiscal que já depende dele.

O terceiro achado da revisão, sobre descrição personalizada no card, não faz parte destes dois ajustes e permanece pendente.
