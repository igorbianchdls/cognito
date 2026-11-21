-- Endurecimento do banco, a partir do diagnóstico (advisors do Supabase):
--   1. O papel "authenticated" (login pelo Supabase, hoje também o token do Clerk) deixa de ter acesso ao schema erp.
--      O ERP só é lido pelo servidor, com o papel erp_runtime; as políticas já bloqueavam, isto tira o acesso de vez.
--   2. search_path fixo nas funções que não tinham (todas usam nomes qualificados).
--   3. Remove um índice duplicado em erp.produtos.
--   4. Índices para as chaves estrangeiras de relacionamento das tabelas mais usadas (exclusões e junções).
BEGIN;
SET LOCAL lock_timeout = '10s';

-- 1. ERP fora do alcance do papel authenticated (e do anon).
REVOKE ALL ON ALL TABLES IN SCHEMA erp FROM authenticated, anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA erp FROM authenticated, anon;
REVOKE USAGE ON SCHEMA erp FROM authenticated, anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA erp REVOKE ALL ON TABLES FROM authenticated, anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA erp REVOKE ALL ON SEQUENCES FROM authenticated, anon;

-- 2. search_path fixo.
ALTER FUNCTION shared.current_auth_user_id() SET search_path = '';
ALTER FUNCTION erp.set_atualizado_em() SET search_path = '';
ALTER FUNCTION erp.validar_documento_diferido() SET search_path = '';
ALTER FUNCTION erp.validar_fechamento_financeiro(bigint, bigint, text) SET search_path = '';
ALTER FUNCTION erp.bloquear_mutacao_evento() SET search_path = '';
ALTER FUNCTION erp.validar_fechamento_venda(bigint, bigint) SET search_path = '';
ALTER FUNCTION erp.validar_fechamento_compra(bigint, bigint) SET search_path = '';
ALTER FUNCTION erp.validar_periodo_operacional_aberto() SET search_path = '';
ALTER FUNCTION editor.uid() SET search_path = '';
ALTER FUNCTION editor.org() SET search_path = '';
ALTER FUNCTION editor.is_member(text) SET search_path = '';
ALTER FUNCTION editor.touch_updated_at() SET search_path = '';

-- 3. Índice duplicado (igual a produtos_categoria_idx).
DROP INDEX IF EXISTS erp.produtos_categoria_cadastro_idx;

-- 4. Índices das chaves estrangeiras de relacionamento (tabelas com mais de 100 linhas).
CREATE INDEX IF NOT EXISTS executions_empresa_id_fk_idx ON plugin.executions (empresa_id) WHERE empresa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS executions_user_id_fk_idx ON plugin.executions (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_receber_eventos_conta_receber_parcela_id_fk_idx ON erp.contas_receber_eventos (empresa_id, conta_receber_parcela_id) WHERE conta_receber_parcela_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_receber_eventos_pagamento_id_fk_idx ON erp.contas_receber_eventos (empresa_id, pagamento_id) WHERE pagamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_recebimentos_previstos_conta_financeira_id_fk_idx ON erp.vendas_recebimentos_previstos (empresa_id, conta_financeira_id) WHERE conta_financeira_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_recebimentos_previstos_metodo_pagamento_id_fk_idx ON erp.vendas_recebimentos_previstos (empresa_id, metodo_pagamento_id) WHERE metodo_pagamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_receber_parcelas_conta_financeira_id_fk_idx ON erp.contas_receber_parcelas (empresa_id, conta_financeira_id) WHERE conta_financeira_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_receber_parcelas_metodo_pagamento_id_fk_idx ON erp.contas_receber_parcelas (empresa_id, metodo_pagamento_id) WHERE metodo_pagamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_receber_parcelas_recebimento_previsto_id_fk_idx ON erp.contas_receber_parcelas (empresa_id, recebimento_previsto_id) WHERE recebimento_previsto_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS pagamentos_metodo_pagamento_id_fk_idx ON erp.pagamentos (empresa_id, metodo_pagamento_id) WHERE metodo_pagamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_itens_centro_custo_id_fk_idx ON erp.vendas_itens (empresa_id, centro_custo_id) WHERE centro_custo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS movimentacoes_estoque_local_estoque_id_fk_idx ON erp.movimentacoes_estoque (empresa_id, local_estoque_id) WHERE local_estoque_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_pagar_parcelas_conta_financeira_id_fk_idx ON erp.contas_pagar_parcelas (empresa_id, conta_financeira_id) WHERE conta_financeira_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_pagar_parcelas_metodo_pagamento_id_fk_idx ON erp.contas_pagar_parcelas (empresa_id, metodo_pagamento_id) WHERE metodo_pagamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_pagar_parcelas_parcela_prevista_id_fk_idx ON erp.contas_pagar_parcelas (empresa_id, parcela_prevista_id) WHERE parcela_prevista_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS documentos_estoque_itens_compra_item_id_fk_idx ON erp.documentos_estoque_itens (empresa_id, compra_item_id) WHERE compra_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS documentos_estoque_itens_produto_id_fk_idx ON erp.documentos_estoque_itens (empresa_id, produto_id) WHERE produto_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS documentos_estoque_itens_venda_item_id_fk_idx ON erp.documentos_estoque_itens (empresa_id, venda_item_id) WHERE venda_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_aprovada_por_fk_idx ON erp.vendas (aprovada_por) WHERE aprovada_por IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_categoria_id_fk_idx ON erp.vendas (empresa_id, categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_centro_custo_id_fk_idx ON erp.vendas (empresa_id, centro_custo_id) WHERE centro_custo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_conta_financeira_id_fk_idx ON erp.vendas (empresa_id, conta_financeira_id) WHERE conta_financeira_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_credito_liberado_por_fk_idx ON erp.vendas (credito_liberado_por) WHERE credito_liberado_por IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_local_estoque_id_fk_idx ON erp.vendas (empresa_id, local_estoque_id) WHERE local_estoque_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_metodo_pagamento_id_fk_idx ON erp.vendas (empresa_id, metodo_pagamento_id) WHERE metodo_pagamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_recusada_por_fk_idx ON erp.vendas (recusada_por) WHERE recusada_por IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_tabela_preco_id_fk_idx ON erp.vendas (empresa_id, tabela_preco_id) WHERE tabela_preco_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_receber_recorrencia_financeira_id_fk_idx ON erp.contas_receber (empresa_id, recorrencia_financeira_id) WHERE recorrencia_financeira_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_itens_centro_custo_id_fk_idx ON erp.compras_itens (empresa_id, centro_custo_id) WHERE centro_custo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_itens_local_estoque_id_fk_idx ON erp.compras_itens (empresa_id, local_estoque_id) WHERE local_estoque_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_itens_servico_id_fk_idx ON erp.compras_itens (empresa_id, servico_id) WHERE servico_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_pagar_compra_recorrencia_id_fk_idx ON erp.contas_pagar (empresa_id, compra_recorrencia_id) WHERE compra_recorrencia_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_parcelas_previstas_conta_financeira_id_fk_idx ON erp.compras_parcelas_previstas (empresa_id, conta_financeira_id) WHERE conta_financeira_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_parcelas_previstas_metodo_pagamento_id_fk_idx ON erp.compras_parcelas_previstas (empresa_id, metodo_pagamento_id) WHERE metodo_pagamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS documentos_estoque_compra_id_fk_idx ON erp.documentos_estoque (empresa_id, compra_id) WHERE compra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS documentos_estoque_entidade_id_fk_idx ON erp.documentos_estoque (empresa_id, entidade_id) WHERE entidade_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS documentos_estoque_local_estoque_id_fk_idx ON erp.documentos_estoque (empresa_id, local_estoque_id) WHERE local_estoque_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS documentos_estoque_venda_id_fk_idx ON erp.documentos_estoque (empresa_id, venda_id) WHERE venda_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS execucoes_automacao_evento_cobranca_id_fk_idx ON erp.execucoes_automacao (empresa_id, evento_cobranca_id) WHERE evento_cobranca_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_categoria_id_fk_idx ON erp.compras (empresa_id, categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_centro_custo_id_fk_idx ON erp.compras (empresa_id, centro_custo_id) WHERE centro_custo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_conta_financeira_id_fk_idx ON erp.compras (empresa_id, conta_financeira_id) WHERE conta_financeira_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_local_estoque_id_fk_idx ON erp.compras (empresa_id, local_estoque_id) WHERE local_estoque_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_metodo_pagamento_id_fk_idx ON erp.compras (empresa_id, metodo_pagamento_id) WHERE metodo_pagamento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_natureza_operacao_id_fk_idx ON erp.compras (empresa_id, natureza_operacao_id) WHERE natureza_operacao_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contratos_vendas_eventos_contrato_versao_id_fk_idx ON erp.contratos_vendas_eventos (empresa_id, contrato_id, contrato_versao_id) WHERE contrato_versao_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS entidades_categoria_tipo_fk_idx ON erp.entidades (empresa_id, categoria_id, categoria_tipo) WHERE categoria_tipo IS NOT NULL;
CREATE INDEX IF NOT EXISTS entidades_tabela_preco_id_fk_idx ON erp.entidades (empresa_id, tabela_preco_id) WHERE tabela_preco_id IS NOT NULL;

COMMIT;
