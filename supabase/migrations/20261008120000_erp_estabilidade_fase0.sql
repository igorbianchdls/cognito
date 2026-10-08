BEGIN;

-- Fase 0 — estabilidade: data padrão no fuso da empresa, numeração sequencial, "vencido" calculado,
-- índices de apoio a relatórios e integridade do rateio.

-- 1. "Hoje" do ERP no fuso da sessão (app.erp_time_zone, definido pelo servidor; padrão São Paulo).
--    Substitui CURRENT_DATE (UTC), que depois das 21h de Brasília vira o dia seguinte.
CREATE OR REPLACE FUNCTION erp.hoje()
RETURNS date
LANGUAGE sql
STABLE
SET search_path TO 'pg_catalog'
AS $$ SELECT (now() AT TIME ZONE coalesce(nullif(current_setting('app.erp_time_zone', true), ''), 'America/Sao_Paulo'))::date $$;
GRANT EXECUTE ON FUNCTION erp.hoje() TO PUBLIC;

DO $defaults$
DECLARE col record;
BEGIN
  FOR col IN
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema='erp' AND column_default ILIKE 'CURRENT_DATE'
  LOOP
    EXECUTE format('ALTER TABLE erp.%I ALTER COLUMN %I SET DEFAULT erp.hoje()', col.table_name, col.column_name);
  END LOOP;
END
$defaults$;

-- 2. Numeração sequencial por empresa, tipo e ano (VEN-2026-0001). Sem acesso direto: só pela função,
--    que confere a empresa da sessão e o vínculo do usuário.
CREATE TABLE IF NOT EXISTS erp.numeracoes (
  empresa_id bigint NOT NULL REFERENCES shared.empresas(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('venda','orcamento','pedido','compra','ordem_servico','contrato','inventario','transferencia_estoque')),
  ano integer NOT NULL CHECK (ano BETWEEN 2000 AND 2999),
  proximo bigint NOT NULL DEFAULT 1 CHECK (proximo > 0),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (empresa_id, tipo, ano)
);
COMMENT ON TABLE erp.numeracoes IS 'Próximo número de cada tipo de documento por empresa e ano; usado por erp.proximo_numero.';
ALTER TABLE erp.numeracoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON erp.numeracoes FROM PUBLIC;

CREATE OR REPLACE FUNCTION erp.proximo_numero(empresa_id bigint, tipo text, data date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
#variable_conflict use_column
DECLARE
  v_empresa bigint := proximo_numero.empresa_id;
  v_tipo text := proximo_numero.tipo;
  v_ano integer := extract(year FROM coalesce(proximo_numero.data, erp.hoje()))::integer;
  v_prefixo text; v_tabela text; v_numero text; v_n bigint; v_existe boolean;
BEGIN
  -- Com empresa na sessão (sempre que o servidor usa erp_runtime), exige a mesma empresa e vínculo ativo.
  -- Sem contexto só chegam papéis privilegiados (scripts de manutenção), pois a execução não é concedida a outros.
  IF shared.erp_empresa_contexto() IS NOT NULL AND (v_empresa IS DISTINCT FROM shared.erp_empresa_contexto() OR NOT shared.is_tenant_member(v_empresa)) THEN
    RAISE EXCEPTION 'Numeração fora da empresa da sessão' USING ERRCODE='42501';
  END IF;
  SELECT x.prefixo, x.tabela INTO v_prefixo, v_tabela FROM (VALUES
    ('venda','VEN','vendas'),('orcamento','ORC','vendas'),('pedido','PED','vendas'),('compra','COM','compras'),
    ('ordem_servico','OS','ordens_servico'),('contrato','CTR','contratos_vendas'),('inventario','INV','inventarios'),
    ('transferencia_estoque','TRF','transferencias_estoque')) AS x(tipo, prefixo, tabela)
  WHERE x.tipo = v_tipo;
  IF v_prefixo IS NULL THEN RAISE EXCEPTION 'Tipo de numeração inválido' USING ERRCODE='22023'; END IF;
  LOOP
    INSERT INTO erp.numeracoes AS n (empresa_id, tipo, ano, proximo) VALUES (v_empresa, v_tipo, v_ano, 2)
    ON CONFLICT (empresa_id, tipo, ano) DO UPDATE SET proximo = n.proximo + 1, atualizado_em = now()
    RETURNING n.proximo - 1 INTO v_n;
    v_numero := format('%s-%s-%s', v_prefixo, v_ano, lpad(v_n::text, 4, '0'));
    -- Números digitados manualmente no mesmo formato são pulados.
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM erp.%I WHERE empresa_id=$1 AND numero=$2)', v_tabela) INTO v_existe USING v_empresa, v_numero;
    EXIT WHEN NOT v_existe;
  END LOOP;
  RETURN v_numero;
END
$function$;
REVOKE ALL ON FUNCTION erp.proximo_numero(bigint, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION erp.proximo_numero(bigint, text, date) TO erp_runtime, service_role;

-- Ponto de partida a partir dos números já existentes no formato PREFIXO-AAAA-NNNN.
INSERT INTO erp.numeracoes (empresa_id, tipo, ano, proximo)
SELECT empresa_id, tipo, ano, max(seq) + 1 FROM (
  SELECT v.empresa_id, CASE v.tipo_documento WHEN 'orcamento' THEN 'orcamento' WHEN 'pedido' THEN 'pedido' ELSE 'venda' END AS tipo,
    (regexp_match(v.numero, '^(?:VEN|ORC|PED)-(\d{4})-(\d{1,12})$'))[1]::integer AS ano,
    (regexp_match(v.numero, '^(?:VEN|ORC|PED)-(\d{4})-(\d{1,12})$'))[2]::bigint AS seq
  FROM erp.vendas v
  UNION ALL SELECT empresa_id, 'compra', (regexp_match(numero, '^COM-(\d{4})-(\d{1,12})$'))[1]::integer, (regexp_match(numero, '^COM-(\d{4})-(\d{1,12})$'))[2]::bigint FROM erp.compras
  UNION ALL SELECT empresa_id, 'ordem_servico', (regexp_match(numero, '^OS-(\d{4})-(\d{1,12})$'))[1]::integer, (regexp_match(numero, '^OS-(\d{4})-(\d{1,12})$'))[2]::bigint FROM erp.ordens_servico
  UNION ALL SELECT empresa_id, 'contrato', (regexp_match(numero, '^CTR-(\d{4})-(\d{1,12})$'))[1]::integer, (regexp_match(numero, '^CTR-(\d{4})-(\d{1,12})$'))[2]::bigint FROM erp.contratos_vendas
  UNION ALL SELECT empresa_id, 'inventario', (regexp_match(numero, '^INV-(\d{4})-(\d{1,12})$'))[1]::integer, (regexp_match(numero, '^INV-(\d{4})-(\d{1,12})$'))[2]::bigint FROM erp.inventarios
  UNION ALL SELECT empresa_id, 'transferencia_estoque', (regexp_match(numero, '^TRF-(\d{4})-(\d{1,12})$'))[1]::integer, (regexp_match(numero, '^TRF-(\d{4})-(\d{1,12})$'))[2]::bigint FROM erp.transferencias_estoque
) existentes
WHERE ano BETWEEN 2000 AND 2999 AND seq IS NOT NULL
GROUP BY empresa_id, tipo, ano
ON CONFLICT (empresa_id, tipo, ano) DO UPDATE SET proximo = greatest(erp.numeracoes.proximo, EXCLUDED.proximo);

-- 3. "Vencido" passa a ser só calculado (data < hoje e saldo > 0). Parcelas gravadas como vencido voltam ao
--    estado real: parcial quando já houve liquidação, aberto caso contrário. A validação diferida recalcula
--    valor_pago e status em seguida.
UPDATE erp.contas_receber_parcelas p SET status = CASE WHEN (SELECT c.dinheiro + c.credito FROM erp.composicao_parcela(p.empresa_id, 'receber', p.id) c) > 0 THEN 'parcial' ELSE 'aberto' END
WHERE p.status = 'vencido';
UPDATE erp.contas_pagar_parcelas p SET status = CASE WHEN (SELECT c.dinheiro + c.credito FROM erp.composicao_parcela(p.empresa_id, 'pagar', p.id) c) > 0 THEN 'parcial' ELSE 'aberto' END
WHERE p.status = 'vencido';
UPDATE erp.contas_receber SET status = 'aberto' WHERE status = 'vencido';
UPDATE erp.contas_pagar SET status = 'aberto' WHERE status = 'vencido';

-- 4. Índices para filtros e relatórios (vendedor, produto, categoria, centro de custo, cliente) e históricos.
CREATE INDEX IF NOT EXISTS vendas_vendedor_idx ON erp.vendas(empresa_id, vendedor_id) WHERE vendedor_id IS NOT NULL AND excluido_em IS NULL;
CREATE INDEX IF NOT EXISTS vendas_itens_produto_idx ON erp.vendas_itens(empresa_id, produto_id) WHERE produto_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS vendas_itens_servico_idx ON erp.vendas_itens(empresa_id, servico_id) WHERE servico_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_itens_produto_idx ON erp.compras_itens(empresa_id, produto_id) WHERE produto_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_receber_categoria_idx ON erp.contas_receber(empresa_id, categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_pagar_categoria_idx ON erp.contas_pagar(empresa_id, categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_receber_centro_custo_idx ON erp.contas_receber(empresa_id, centro_custo_id) WHERE centro_custo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contas_pagar_centro_custo_idx ON erp.contas_pagar(empresa_id, centro_custo_id) WHERE centro_custo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS produtos_categoria_idx ON erp.produtos(empresa_id, categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contratos_vendas_cliente_idx ON erp.contratos_vendas(empresa_id, cliente_id);
CREATE INDEX IF NOT EXISTS ordens_servico_cliente_idx ON erp.ordens_servico(empresa_id, cliente_id);
CREATE INDEX IF NOT EXISTS ordens_servico_itens_ordem_idx ON erp.ordens_servico_itens(empresa_id, ordem_servico_id);
CREATE INDEX IF NOT EXISTS contratos_vendas_itens_contrato_idx ON erp.contratos_vendas_itens(empresa_id, contrato_id);
CREATE INDEX IF NOT EXISTS reservas_estoque_venda_idx ON erp.reservas_estoque(empresa_id, venda_id);
CREATE INDEX IF NOT EXISTS documentos_estoque_itens_documento_idx ON erp.documentos_estoque_itens(empresa_id, documento_estoque_id);
CREATE INDEX IF NOT EXISTS movimentacoes_estoque_documento_idx ON erp.movimentacoes_estoque(empresa_id, documento_estoque_id) WHERE documento_estoque_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS compras_eventos_compra_idx ON erp.compras_eventos(empresa_id, compra_id);
CREATE INDEX IF NOT EXISTS contas_pagar_eventos_conta_idx ON erp.contas_pagar_eventos(empresa_id, conta_pagar_id);
CREATE INDEX IF NOT EXISTS ordens_servico_eventos_ordem_idx ON erp.ordens_servico_eventos(empresa_id, ordem_servico_id);
CREATE INDEX IF NOT EXISTS contratos_vendas_eventos_contrato_idx ON erp.contratos_vendas_eventos(empresa_id, contrato_id);
CREATE INDEX IF NOT EXISTS renegociacoes_entidade_idx ON erp.renegociacoes(empresa_id, entidade_id);

-- Índice não único que repete um único (mesmas colunas e predicado) é removido.
DO $duplicados$
DECLARE dup record;
BEGIN
  FOR dup IN
    SELECT redundante.indexrelid::regclass AS indice
    FROM pg_index redundante
    JOIN pg_index unico ON unico.indrelid = redundante.indrelid AND unico.indisunique
      AND unico.indkey::text = redundante.indkey::text
      AND coalesce(pg_get_expr(unico.indpred, unico.indrelid), '') = coalesce(pg_get_expr(redundante.indpred, redundante.indrelid), '')
      AND coalesce(pg_get_expr(unico.indexprs, unico.indrelid), '') = coalesce(pg_get_expr(redundante.indexprs, redundante.indrelid), '')
    WHERE NOT redundante.indisunique AND NOT redundante.indisprimary
      AND redundante.indrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'erp'::regnamespace)
  LOOP
    EXECUTE format('DROP INDEX %s', dup.indice);
  END LOOP;
END
$duplicados$;

-- 5. Rateio sempre com valor (relatórios distribuem pelo valor; percentual é informativo).
ALTER TABLE erp.rateios_financeiros ADD CONSTRAINT rateios_financeiros_valor_obrigatorio CHECK (valor IS NOT NULL);

COMMIT;
