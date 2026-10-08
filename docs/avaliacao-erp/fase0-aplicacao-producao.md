# Fase 0 — roteiro de aplicação em produção

Referência: [plano-erp-nivel-mercado-20261007.md](plano-erp-nivel-mercado-20261007.md), seção 5 (Fase 0). Nada deste roteiro foi executado no Supabase; cada passo de escrita precisa de autorização explícita.

## O que muda

| Migração | Efeito | Risco |
| --- | --- | --- |
| `20261007120000_empresa_fuso_horario.sql` | Coluna `shared.empresas.fuso_horario` (padrão São Paulo) | Baixo; o código já tolera a ausência |
| `20261007130000_erp_anexos_bucket.sql` | Bucket privado `erp-anexos` | Baixo |
| `20261008100000_erp_rls_contexto.sql` | Função `shared.erp_empresa_contexto()` e reescrita das políticas de RLS: permissão avaliada uma vez por consulta para a empresa da sessão; resultado idêntico ao anterior | Médio (toca todas as políticas do `erp`); reversível reaplicando as expressões antigas |
| `20261008110000_erp_validacao_escopo.sql` | Validações financeiras e de conciliação restritas aos registros afetados; trava por empresa passa a esperar em vez de falhar | Médio (regras centrais); mesmas regras, validadas pelos 42 cenários do `evolution-smoke` |
| `20261008120000_erp_estabilidade_fase0.sql` | `erp.hoje()` nos padrões de data; numeração `erp.numeracoes`/`erp.proximo_numero`; parcelas `vencido` voltam a `aberto`/`parcial`; 21 índices; remoção de 1 índice duplicado; rateio com valor obrigatório | Baixo/médio; a normalização de `vencido` altera 28 parcelas e gera eventos de histórico |

## Antes

1. Backup: snapshot do Supabase (Database → Backups) ou `pg_dump` do schema `erp`, `shared` e `plugin`.
2. Janela curta fora do horário comercial (as migrações de índice e de políticas bloqueiam escrita por segundos).
3. Conferências somente leitura (registrar os números):
   - `pnpm erp:slow-queries` (tempos de referência);
   - contagem de parcelas por status e soma dos saldos em aberto por empresa;
   - `SELECT count(*) FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relnamespace='erp'::regnamespace` (303).

## Aplicação

Na ordem, cada arquivo em uma transação (já têm `BEGIN/COMMIT`), pelo SQL Editor do Supabase ou `psql`:

1. `20261007120000_empresa_fuso_horario.sql`
2. `20261007130000_erp_anexos_bucket.sql`
3. `20261008100000_erp_rls_contexto.sql` — a mensagem `Políticas de RLS reescritas: N` deve mostrar N > 0
4. `20261008110000_erp_validacao_escopo.sql`
5. `20261008120000_erp_estabilidade_fase0.sql`
6. `20261008130000_erp_comercial_fase1.sql` (Fase 1: tabelas de preço, crédito, transporte, comissões)
7. `20261008140000_erp_devolucoes.sql` (Fase 1.5: devoluções de venda e baixas sem dinheiro)
8. `20261008150000_erp_permissoes_vendedor.sql` (Fase 1.7: vendedor do usuário, escopo "só as próprias vendas" e desconto máximo)
9. `20261009100000_erp_dre_categorias.sql` (Fase 2A: grupos da DRE, categorias financeiras × de cadastro, receita prevista). **Mexe em dados**: antes de aplicar, rodar a conferência das categorias (ver "Fase 2" abaixo) e aprovar o destino de cada uma
10. `20261009110000_erp_anexos.sql` (Fase 2B: anexos e comprovante da baixa)
11. `20261009120000_erp_conciliacao_cartao.sql` (Fase 2C: regras de lançamento do extrato, conta da maquininha, cartão na forma de pagamento)
12. `20261009130000_erp_orcamento_metas.sql` (Fase 2E: orçamento anual e metas de venda)

Depois, registrar as versões em `supabase_migrations.schema_migrations` (ou aplicar pelo `supabase db push`, que registra sozinho).

## Depois

1. Mesmas conferências do "Antes": status das parcelas (as 28 `vencido` passam a `aberto`/`parcial`; nenhuma outra muda), saldos em aberto iguais.
2. Tempos: contas a receber e a pagar abaixo de 300 ms no banco (`pnpm erp:slow-queries` após alguns usos).
3. Isolamento: abrir o ERP com um usuário de perfil restrito e conferir que só os módulos permitidos aparecem.
4. Criar um orçamento e uma venda sem número: devem receber `ORC-2026-NNNN` e `VEN-2026-NNNN`.
5. Rotinas: tela "Rotinas e recorrências" sem aviso de atraso depois da próxima execução do cron.
6. Permissões: todos os vínculos continuam com `escopo_vendas = 'todas'` e sem desconto máximo (nada muda até alguém configurar em Configurações → Members).
7. Fase 2: Cadastros → Categorias financeiras com todas as categorias em "Não classificado" (classificar no grupo da DRE); produtos, serviços, clientes e fornecedores com a mesma categoria de antes (agora em Categorias de cadastro); Relatórios → DRE abrindo.
8. Anexos: `SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_SUPABASE_URL` configurados na Vercel (o bucket `erp-anexos` vem da migração `20261007130000`). Opcional: `ERP_ANEXOS_LIMITE_MB` (padrão 1024).

## Fase 2: conferência das categorias (antes da migração 9)

A migração 9 separa as 45 categorias de produção: as de produto, serviço, cliente e fornecedor viram categorias de cadastro (mesmo id); as financeiras ficam receita ou despesa; "geral" vira receita ou despesa pelo uso, ou sai da tabela financeira se não tiver uso financeiro (sem apagar). O teste `node scripts/erp/fase2-categorias-smoke.mjs` reproduz cada caso com dados fictícios. Em produção, a conferência é uma leitura (SELECT) das categorias e do uso de cada uma, a ser executada só com autorização.

## Fora das migrações

- **Região da Vercel**: `vercel.json` agora define `regions: ["gru1"]` (São Paulo, junto do banco `sa-east-1`). Cada ida ao banco deixa de cruzar o continente (~120 ms → poucos ms). Vale no próximo deploy.
- **Cron**: conferir `CRON_SECRET` nas variáveis de produção. Sem ele a rota responde 503 e agora registra `CRON_SECRET_AUSENTE` no log. Depois de corrigido, rodar uma vez as rotinas (com confirmação: gera vendas dos 12 contratos atrasados).
- **Papel `authenticated`**: decisão pendente (revogar ou manter o acesso direto ao schema `erp`).
