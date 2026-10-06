# Notas fiscais demonstrativas — 06/10/2026

## Criação concluída no Supabase

Empresa: `shared.empresas.id = 2`, vinculada ao usuário Igor Bianch (`shared.usuarios.id = 3`). Cenário: `fiscal-demo-20261006`.

Foram criadas **12 notas**, vinculadas aos documentos comerciais existentes: **8 de vendas e 4 de compras**, sendo **6 de mercadorias (NF-e) e 6 de serviços (NFS-e)**. A data de referência é 06/10/2026; as datas dos documentos seguem as operações de origem.

Os registros usam números `DEMO-0001` a `DEMO-0012`, série `DEMO`, descrições identificadas como simulação e metadados `demo`, `simulado`, `sem_validade_fiscal` e `dataset`. Os estados “emitida”, “aguardando retorno”, “falha” e “cancelada” representam exclusivamente cenários locais, sem autorização ou comunicação fiscal real.

| Número | Origem | Tipo | Estado simulado | Valor (R$) |
| --- | --- | --- | --- | ---: |
| DEMO-0001 | Venda 789 | Mercadorias | Rascunho | 2.413,23 |
| DEMO-0002 | Venda 785 | Mercadorias | Aguardando retorno | 308,46 |
| DEMO-0003 | Venda 783 | Mercadorias | Emitida | 1.945,26 |
| DEMO-0004 | Venda 779 | Mercadorias | Cancelada | 847,70 |
| DEMO-0005 | Venda 787 | Serviços | Rascunho | 1.590,00 |
| DEMO-0006 | Venda 784 | Serviços | Aguardando retorno | 3.200,00 |
| DEMO-0007 | Venda 687 | Serviços | Falha | 1.830,00 |
| DEMO-0008 | Venda 686 | Serviços | Emitida | 1.650,00 |
| DEMO-0009 | Compra 301 | Mercadorias | Emitida | 2.448,70 |
| DEMO-0010 | Compra 300 | Mercadorias | Cancelada | 14.205,00 |
| DEMO-0011 | Compra 302 | Serviços | Rascunho | 5.967,00 |
| DEMO-0012 | Compra 298 | Serviços | Falha | 166,60 |

## Registros auxiliares

- 14 itens, associados aos produtos/serviços e itens comerciais corretos.
- 12 registros de totais, com descontos e frete reconciliados às origens.
- 37 eventos de histórico com nomes iniciados por `simulacao_`.
- 7 tentativas locais concluídas e 9 retornos simulados já processados, sem agendamento de execução.
- 1 configuração inativa de homologação, provedor `simulador_local`, `padrao=false` e sem referência de credencial.

O emitente demonstrativo tem nome identificado como simulação e CNPJ `00000000000000`, deliberadamente inválido para uso real. Nenhuma chave de acesso fiscal, URL de XML/PDF/DANFE ou arquivo fictício com link quebrado foi criado. Protocolo demonstrativo, quando presente, começa por `SIMULADO-`.

Os valores de ISS de 5% e o exemplo de retenção são **dados arbitrários de demonstração**, sem indicação de enquadramento ou alíquota aplicável. As três notas emitidas e duas canceladas estão protegidas pelo congelamento normal do schema. Seus conteúdos não devem ser editados como se fossem rascunhos.

## Preservação das operações existentes

Não foram criados novos títulos, parcelas, pagamentos, movimentos ou saldos de estoque. A execução comparou contagens e hashes completos de 15 tabelas comerciais/financeiras/estoque/arquivos antes e depois; os registros permaneceram iguais.

O campo de situação fiscal das vendas também não foi alterado: esta carga cria documentos fiscais demonstrativos e seus vínculos, sem acionar um fluxo real de emissão. Os vínculos passam a participar das regras existentes do ERP: uma compra com nota deixa de aparecer entre candidatas à importação, e vendas/compras com notas ativas podem ter seu cancelamento comercial bloqueado. Isso permite exercitar o comportamento real dessas associações.

## Verificações

1. Execução inicial em transação revertida validou o cenário antes da criação definitiva. Sequências de IDs podem avançar nessa verificação, comportamento normal do PostgreSQL.
2. Criação definitiva feita em uma única transação, sem desativar triggers, RLS ou restrições.
3. Conferidos: quantidades/estados, soma de itens menos desconto mais frete, valor líquido/retido, congelamento, configuração inativa, ausência de credenciais/URLs e isolamento contra contexto sem acesso à empresa.
4. **19 consultas GET autenticadas com sessão real do Clerk passaram em produção**: listagem de notas de compra, históricos das 12 notas, detalhes das 4 compras vinculadas e pré-validação nos dois ambientes.
5. A pré-validação continua indicando ausência de configuração fiscal ativa em homologação e produção; o cadastro demonstrativo não habilita emissão.

Script: `scripts/erp/seed-fiscal-demo.mjs`. Usa projeto/empresa/usuário verificados e não duplica o cenário ao ser executado novamente. `--check` faz a primeira criação em transação revertida ou apenas verifica o conjunto já existente. A aplicação explícita usa `--apply --project=mtadnxqoqxzbdksktwdr`.

Evidências locais ignoradas pelo Git: `.cache/fiscal-demo/dry-run.json`, `.cache/fiscal-demo/application.json` e `.cache/fiscal-demo/production-reads.json`.

A carga não incluiu alterações de interface nem publicação de código. A integração fiscal real permanece pendente de provedor/adaptador e testes em homologação, conforme [a preparação da base](preparacao-fiscal-implementacao-20261006.md).
