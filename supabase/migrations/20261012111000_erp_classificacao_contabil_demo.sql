BEGIN;
-- Initial editable chart and DRE classification for the authorized demonstration company.
DO $$
DECLARE empresa bigint:=2; autor bigint:=3; r record; pai bigint; v_conta bigint; grupo bigint; antes jsonb; depois jsonb; categoria bigint;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM shared.usuarios_empresas WHERE empresa_id=empresa AND usuario_id=autor AND role='owner' AND status='active') THEN
  RAISE EXCEPTION 'Confirme a empresa e o administrador antes de inicializar a estrutura contábil';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('erp:contabilidade:'||empresa::text,0));
 FOR r IN SELECT * FROM (VALUES
  ('1','Ativo',NULL,'sintetica','ativo','devedora'),
  ('1.1','Ativo circulante','1','sintetica','ativo','devedora'),
  ('1.1.1','Bancos e caixas','1.1','sintetica','ativo','devedora'),
  ('1.1.2','Clientes a receber','1.1','sintetica','ativo','devedora'),
  ('1.1.2.01','Contas a receber de clientes','1.1.2','analitica','ativo','devedora'),
  ('1.1.3','Estoques','1.1','sintetica','ativo','devedora'),
  ('1.1.3.01','Estoque de mercadorias para revenda','1.1.3','analitica','ativo','devedora'),
  ('1.2','Ativo não circulante','1','sintetica','ativo','devedora'),
  ('1.2.1','Imobilizado','1.2','sintetica','ativo','devedora'),
  ('1.2.1.01','Equipamentos da empresa','1.2.1','analitica','ativo','devedora'),
  ('2','Passivo',NULL,'sintetica','passivo','credora'),
  ('2.1','Passivo circulante','2','sintetica','passivo','credora'),
  ('2.1.1','Fornecedores a pagar','2.1','sintetica','passivo','credora'),
  ('2.1.1.01','Contas a pagar a fornecedores','2.1.1','analitica','passivo','credora'),
  ('2.1.2','Tributos a recolher','2.1','sintetica','passivo','credora'),
  ('2.1.2.01','Impostos e contribuições a recolher','2.1.2','analitica','passivo','credora'),
  ('2.1.3','Cartões a pagar','2.1','sintetica','passivo','credora'),
  ('3','Patrimônio líquido',NULL,'sintetica','patrimonio_liquido','credora'),
  ('3.1','Capital social','3','sintetica','patrimonio_liquido','credora'),
  ('3.1.01','Capital dos sócios','3.1','analitica','patrimonio_liquido','credora'),
  ('3.2','Lucros acumulados','3','sintetica','patrimonio_liquido','credora'),
  ('3.2.01','Resultados acumulados','3.2','analitica','patrimonio_liquido','credora'),
  ('4','Receitas',NULL,'sintetica','receita','credora'),
  ('4.1','Receitas com produtos','4','sintetica','receita','credora'),
  ('4.1.01','Venda de equipamentos','4.1','analitica','receita','credora'),
  ('4.2','Receitas com serviços','4','sintetica','receita','credora'),
  ('4.2.01','Projetos e implantação','4.2','analitica','receita','credora'),
  ('4.2.02','Suporte e contratos mensais','4.2','analitica','receita','credora'),
  ('5','Custos',NULL,'sintetica','custo','devedora'),
  ('5.1','Custos de mercadorias','5','sintetica','custo','devedora'),
  ('5.1.01','Custo das mercadorias vendidas','5.1','analitica','custo','devedora'),
  ('5.2','Custos de serviços','5','sintetica','custo','devedora'),
  ('5.2.01','Serviços técnicos terceirizados','5.2','analitica','custo','devedora'),
  ('6','Despesas',NULL,'sintetica','despesa','devedora'),
  ('6.1','Despesas administrativas','6','sintetica','despesa','devedora'),
  ('6.1.01','Aluguel e condomínio','6.1','analitica','despesa','devedora'),
  ('6.1.02','Energia elétrica','6.1','analitica','despesa','devedora'),
  ('6.1.03','Internet e telefonia','6.1','analitica','despesa','devedora'),
  ('6.1.04','Assinaturas de software','6.1','analitica','despesa','devedora'),
  ('6.1.05','Assessoria contábil','6.1','analitica','despesa','devedora'),
  ('6.2','Despesas comerciais','6','sintetica','despesa','devedora'),
  ('6.2.01','Marketing e publicidade','6.2','analitica','despesa','devedora'),
  ('6.2.02','Deslocamentos e visitas técnicas','6.2','analitica','despesa','devedora')
 ) AS c(codigo,nome,pai,tipo,classificacao,natureza)
 LOOP
  pai:=NULL;
  IF r.pai IS NOT NULL THEN SELECT id INTO STRICT pai FROM erp.contas_contabeis WHERE empresa_id=empresa AND codigo=r.pai; END IF;
  INSERT INTO erp.contas_contabeis(empresa_id,codigo,nome,conta_pai_id,tipo,classificacao,natureza,criado_por,atualizado_por)
   VALUES(empresa,r.codigo,r.nome,pai,r.tipo,r.classificacao,r.natureza,autor,autor);
 END LOOP;
 INSERT INTO erp.cadastros_eventos(empresa_id,entidade_tipo,entidade_id,evento,versao,dados,criado_por)
 SELECT empresa,'conta_contabil',c.id,'criado',c.versao,jsonb_build_object('origem','estrutura_inicial','depois',to_jsonb(c)),autor FROM erp.contas_contabeis c WHERE c.empresa_id=empresa;

 FOR r IN SELECT * FROM (VALUES
  ('Venda de equipamentos','4.1.01',1,false), ('Projetos e implantação','4.2.01',1,false),
  ('Suporte e contratos mensais','4.2.02',1,false), ('Compra de equipamentos para revenda','1.1.3.01',NULL,true),
  ('Serviços técnicos terceirizados','5.2.01',3,false), ('Aluguel e condomínio','6.1.01',5,false),
  ('Energia elétrica','6.1.02',5,false), ('Internet e telefonia','6.1.03',5,false),
  ('Assinaturas de software','6.1.04',5,false), ('Assessoria contábil','6.1.05',5,false),
  ('Marketing e publicidade','6.2.01',6,false), ('Deslocamentos e visitas técnicas','6.2.02',6,false)
 ) AS c(nome,codigo,grupo,fora)
 LOOP
  SELECT id,to_jsonb(c) INTO STRICT categoria,antes FROM erp.categorias c WHERE c.empresa_id=empresa AND c.nome=r.nome AND c.excluido_em IS NULL FOR UPDATE;
  SELECT id INTO STRICT v_conta FROM erp.contas_contabeis WHERE empresa_id=empresa AND codigo=r.codigo;
  grupo:=NULL;
  IF r.grupo IS NOT NULL THEN SELECT id INTO STRICT grupo FROM erp.dre_grupos WHERE empresa_id=empresa AND codigo=r.grupo; END IF;
  UPDATE erp.categorias c SET dre_grupo_id=grupo,fora_dre=r.fora,conta_contabil_id=v_conta,versao=versao+1,atualizado_por=autor
   WHERE c.empresa_id=empresa AND c.id=categoria RETURNING to_jsonb(c) INTO depois;
  INSERT INTO erp.cadastros_eventos(empresa_id,entidade_tipo,entidade_id,evento,versao,dados,criado_por)
   VALUES(empresa,'categoria',categoria,'atualizado',(depois->>'versao')::integer,jsonb_build_object('antes',antes,'depois',depois,'origem','classificacao_dre'),autor);
 END LOOP;
 FOR r IN SELECT * FROM erp.contas_financeiras WHERE empresa_id=empresa AND excluido_em IS NULL ORDER BY id FOR UPDATE LOOP
  SELECT id INTO STRICT pai FROM erp.contas_contabeis WHERE empresa_id=empresa AND codigo=CASE WHEN r.tipo='cartao' THEN '2.1.3' ELSE '1.1.1' END;
  INSERT INTO erp.contas_contabeis(empresa_id,codigo,nome,conta_pai_id,tipo,classificacao,natureza,ativo,criado_por,atualizado_por)
   VALUES(empresa,CASE WHEN r.tipo='cartao' THEN '2.1.3.' ELSE '1.1.1.' END||r.id,r.nome,pai,'analitica',
    CASE WHEN r.tipo='cartao' THEN 'passivo' ELSE 'ativo' END,CASE WHEN r.tipo='cartao' THEN 'credora' ELSE 'devedora' END,r.ativo,autor,autor) RETURNING id INTO v_conta;
  INSERT INTO erp.cadastros_eventos(empresa_id,entidade_tipo,entidade_id,evento,versao,dados,criado_por)
   SELECT empresa,'conta_contabil',c.id,'criado',1,jsonb_build_object('depois',to_jsonb(c),'origem','vinculo_banco'),autor FROM erp.contas_contabeis c WHERE c.empresa_id=empresa AND c.id=v_conta;
  IF r.ativo THEN
   UPDATE erp.contas_financeiras c SET conta_contabil_id=v_conta,versao=versao+1,atualizado_por=autor WHERE c.empresa_id=empresa AND c.id=r.id RETURNING to_jsonb(c) INTO depois;
   INSERT INTO erp.cadastros_eventos(empresa_id,entidade_tipo,entidade_id,evento,versao,dados,criado_por)
    VALUES(empresa,'conta_financeira',r.id,'atualizado',(depois->>'versao')::integer,jsonb_build_object('antes',to_jsonb(r),'depois',depois,'origem','vinculo_contabil'),autor);
  END IF;
 END LOOP;
END $$;
COMMIT;
