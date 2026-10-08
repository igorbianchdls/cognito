import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { db, restoreCatalog } from './evolution-fixture.mjs'
import { applySharedMigration } from '../shared/schema-contract.mjs'
import { applyRecentMigrations } from './phase0-migrations.mjs'

// Fase 2A em banco local (PGlite, dados fictícios): cria categorias no modelo antigo (receita, despesa, geral,
// produto, serviço, cliente, fornecedor), usa-as em títulos, produtos, serviços, regras de comissão e cadastros,
// aplica a migração e confere o de-para, a DRE e a receita prevista. Não acessa banco remoto.
const MIGRATION = '20261009100000_erp_dre_categorias.sql'
const checks = []
const q = async (sql, params) => (await db.query(sql, params)).rows
async function check(name, fn) { await fn(); checks.push(name); console.info(`Passed: ${name}`) }
async function rejects(sql, pattern, params) {
  await db.exec('BEGIN')
  try { await assert.rejects(db.query(sql, params), pattern) } finally { await db.exec('ROLLBACK') }
}

try {
  await restoreCatalog()
  for (const f of ['01-integridade-historicos.sql', '02-periodos-fechados.sql', '03-cadastros-documentos-contratos.sql', '04-adiantamentos-renegociacoes.sql']) await db.exec(readFileSync('scripts/erp/sql/' + f, 'utf8'))
  for (const f of ['20260909033000_drop_erp_financial_views.sql', '20260909040000_harden_erp_service_integrity.sql', '20261003170000_harden_erp_read_access.sql', '20261005020000_harden_erp_stock_operations.sql', '20261005021000_anchor_contract_cycles.sql']) await db.exec(readFileSync('supabase/migrations/' + f, 'utf8'))
  await applySharedMigration(db)
  await applyRecentMigrations(db, { skip: [MIGRATION] })
  await db.exec(`ALTER TABLE erp.categorias DROP CONSTRAINT categorias_tipo_chk;
    ALTER TABLE erp.categorias ADD CONSTRAINT categorias_tipo_chk CHECK (tipo IN ('receita','despesa','produto','servico','geral','cliente','fornecedor'));
    INSERT INTO shared.empresas(id,name,slug) VALUES(1,'Empresa A','fase2-a'),(2,'Empresa B','fase2-b');
    INSERT INTO shared.usuarios(id,email,full_name,clerk_user_id) VALUES(1,'owner@example.invalid','Owner','local_owner');
    INSERT INTO erp.categorias(id,empresa_id,nome,tipo) VALUES
      (1,1,'Venda de serviços','receita'),(2,1,'Aluguel','despesa'),(3,1,'Bebidas','produto'),(4,1,'Manutenção','servico'),
      (5,1,'Varejo','cliente'),(6,1,'Matéria-prima','fornecedor'),(7,1,'Diversos','geral'),(8,1,'Sem uso','geral'),
      (9,1,'Peças','geral'),(10,1,'Pessoal','despesa'),(11,1,'Salários','despesa'),(12,1,'Encargos','despesa'),(13,1,'Misto','produto'),
      (20,2,'Receita B','receita');
    UPDATE erp.categorias SET categoria_pai_id=10 WHERE id=11; UPDATE erp.categorias SET categoria_pai_id=11 WHERE id=12;
    INSERT INTO erp.entidades(id,empresa_id,nome,eh_cliente,eh_fornecedor,metadata) VALUES
      (101,1,'Cliente varejo',true,false,'{"categoria":"Varejo"}'),(102,1,'Fornecedor MP',false,true,'{"categoria":"matéria-prima"}'),
      (103,1,'Cliente novo segmento',true,false,'{"categoria":"Governo"}'),(104,1,'Sem categoria',true,false,'{}');
    INSERT INTO erp.produtos(id,empresa_id,nome,sku,categoria_id) VALUES(201,1,'Refrigerante','R',3),(202,1,'Parafuso','P',9),(203,1,'Kit','K',13);
    INSERT INTO erp.servicos(id,empresa_id,nome,preco,categoria_id) VALUES(301,1,'Revisão',100,4),(302,1,'Troca de peça',50,9),(303,1,'Montagem',80,13);`)
  // Uso financeiro: "Diversos" (geral) em contas a pagar; "Peças" (geral) só em produto/serviço; regra de comissão na "Bebidas".
  await db.exec(`BEGIN; INSERT INTO erp.contas_pagar(id,empresa_id,fornecedor_id,descricao,valor_total,data_competencia,data_emissao,categoria_id,origem,status)
      VALUES(401,1,102,'Despesa diversa',50,'2026-10-01','2026-10-01',7,'manual','aberto');
    INSERT INTO erp.contas_pagar_parcelas(empresa_id,conta_pagar_id,numero_parcela,data_vencimento,valor) VALUES(1,401,1,'2026-10-10',50); COMMIT;
    INSERT INTO erp.comissoes_regras(empresa_id,nome,categoria_id,percentual) VALUES(1,'Bebidas 3%',3,3);`)
  await db.exec(readFileSync('supabase/migrations/' + MIGRATION, 'utf8'))

  await check('Grupos fixos da DRE criados para cada empresa e para empresas novas', async () => {
    assert.deepEqual((await q('SELECT empresa_id::int, count(*)::int n FROM erp.dre_grupos GROUP BY 1 ORDER BY 1')), [{ empresa_id: 1, n: 9 }, { empresa_id: 2, n: 9 }])
    await db.exec("INSERT INTO shared.empresas(id,name,slug) VALUES(3,'Empresa C','fase2-c')")
    assert.equal((await q('SELECT count(*)::int n FROM erp.dre_grupos WHERE empresa_id=3'))[0].n, 9)
    await db.exec("UPDATE erp.dre_grupos SET nome='Folha de pagamento', ordem=4 WHERE empresa_id=1 AND codigo=4")
    await rejects("UPDATE erp.dre_grupos SET codigo=8 WHERE empresa_id=1 AND codigo=4", /fixos|unique|duplicate/)
    await rejects("UPDATE erp.dre_grupos SET natureza='receita' WHERE empresa_id=1 AND codigo=4", /fixos/)
  })

  await check('Categorias de cadastro com ids preservados e uso duplo separado', async () => {
    const rows = await q('SELECT id::int, tipo, nome FROM erp.categorias_cadastro WHERE empresa_id=1 ORDER BY id, tipo')
    const by = name => rows.filter(r => r.nome === name).map(r => [r.id, r.tipo])
    assert.deepEqual(by('Bebidas'), [[3, 'produto']])
    assert.deepEqual(by('Manutenção'), [[4, 'servico']])
    assert.deepEqual(by('Varejo'), [[5, 'cliente']])
    assert.deepEqual(by('Matéria-prima'), [[6, 'fornecedor']])
    // "Peças" (geral) usada por produto e por serviço: o produto mantém o id; o serviço ganha um id novo.
    const pecas = by('Peças'); assert.equal(pecas.length, 2); assert.deepEqual(pecas.find(p => p[1] === 'produto'), [9, 'produto'])
    const pecasServico = pecas.find(p => p[1] === 'servico')[0]; assert(pecasServico > 20)
    assert.equal((await q('SELECT categoria_id::int c FROM erp.servicos WHERE id=302'))[0].c, pecasServico)
    // "Misto" (tipo produto) usada também por serviço.
    assert.equal(by('Misto').length, 2)
    assert.deepEqual((await q('SELECT categoria_id::int c, categoria_tipo t FROM erp.produtos WHERE id IN (201,202,203) ORDER BY id')).map(r => [r.c, r.t]), [[3, 'produto'], [9, 'produto'], [13, 'produto']])
    assert.equal((await q('SELECT categoria_id::int c FROM erp.comissoes_regras'))[0].c, 3)
  })

  await check('Clientes e fornecedores ligados pela categoria (nome sem acento/maiúscula e nome novo)', async () => {
    const rows = await q(`SELECT e.id::int, e.categoria_tipo, c.nome FROM erp.entidades e LEFT JOIN erp.categorias_cadastro c ON c.empresa_id=e.empresa_id AND c.id=e.categoria_id ORDER BY e.id`)
    assert.deepEqual(rows.map(r => [r.id, r.categoria_tipo, r.nome]), [[101, 'cliente', 'Varejo'], [102, 'fornecedor', 'Matéria-prima'], [103, 'cliente', 'Governo'], [104, null, null]])
  })

  await check('Tabela financeira só com receita/despesa; "geral" usada vira despesa; demais saem sem apagar', async () => {
    const rows = await q('SELECT id::int, tipo, excluido_em IS NOT NULL removida, metadata FROM erp.categorias WHERE empresa_id=1 ORDER BY id')
    const get = id => rows.find(r => r.id === id)
    assert.deepEqual([get(7).tipo, get(7).removida, get(7).metadata.tipo_original], ['despesa', false, 'geral'])
    for (const id of [3, 4, 5, 6, 8, 9, 13]) assert.equal(get(id).removida, true, `categoria ${id}`)
    assert.equal(get(8).metadata.migrada_para_cadastro, false)
    assert.equal(get(9).metadata.migrada_para_cadastro, true)
    assert(rows.filter(r => !r.removida).every(r => ['receita', 'despesa'].includes(r.tipo)))
    await rejects("INSERT INTO erp.categorias(empresa_id,nome,tipo) VALUES(1,'X','produto')", /categorias_tipo_chk|check/i)
  })

  await check('Hierarquia de 2 níveis e herança do grupo da DRE', async () => {
    // O antigo 3º nível (Encargos) subiu para debaixo de Pessoal.
    assert.equal((await q('SELECT categoria_pai_id::int p FROM erp.categorias WHERE id=12'))[0].p, 10)
    const pessoal = (await q('SELECT id FROM erp.dre_grupos WHERE empresa_id=1 AND codigo=4'))[0].id
    await db.query('UPDATE erp.categorias SET dre_grupo_id=$1 WHERE id=10', [pessoal])
    assert.deepEqual((await q('SELECT id::int, dre_grupo_id::text g FROM erp.categorias WHERE id IN (11,12) ORDER BY id')).map(r => r.g), [String(pessoal), String(pessoal)])
    // Subcategoria não escolhe grupo próprio: herda.
    const admin = (await q('SELECT id FROM erp.dre_grupos WHERE empresa_id=1 AND codigo=5'))[0].id
    await db.query('UPDATE erp.categorias SET dre_grupo_id=$1 WHERE id=11', [admin])
    assert.equal(String((await q('SELECT dre_grupo_id FROM erp.categorias WHERE id=11'))[0].dre_grupo_id), String(pessoal))
    await rejects("INSERT INTO erp.categorias(empresa_id,nome,tipo,categoria_pai_id) VALUES(1,'Neto','despesa',11)", /2 níveis/)
    await rejects("INSERT INTO erp.categorias(empresa_id,nome,tipo,categoria_pai_id) VALUES(1,'Receita sob despesa','receita',10)", /mesmo tipo/)
    await rejects('UPDATE erp.categorias SET fora_dre=true, dre_grupo_id=$1 WHERE id=2', /categorias_fora_dre_chk|check/i, [admin])
    // Categoria usada pode mudar de grupo (classificação gerencial), mas não de tipo.
    await db.query('UPDATE erp.categorias SET dre_grupo_id=$1 WHERE id=7', [admin])
    await rejects("UPDATE erp.categorias SET tipo='receita' WHERE id=7", /utilizado/)
  })

  await check('Categoria de cadastro: tipo na chave impede produto em categoria de cliente', async () => {
    await rejects('UPDATE erp.produtos SET categoria_id=5 WHERE id=201', /produtos_categoria_fk|foreign key/i)
    await rejects("UPDATE erp.entidades SET categoria_id=3, categoria_tipo='cliente' WHERE id=101", /entidades_categoria_fk|foreign key/i)
    await db.exec("INSERT INTO erp.categorias_cadastro(empresa_id,tipo,nome,categoria_pai_id) VALUES(1,'produto','Refrigerantes',3)")
    await rejects("INSERT INTO erp.categorias_cadastro(empresa_id,tipo,nome,categoria_pai_id) VALUES(1,'servico','Errada',3)", /categorias_cadastro_pai_fk|foreign key/i)
  })

  await check('Receita prevista: não recebe baixa e não volta a previsão depois de efetiva', async () => {
    await db.exec(`BEGIN; INSERT INTO erp.contas_receber(id,empresa_id,cliente_id,descricao,valor_total,data_competencia,data_emissao,categoria_id,origem,status,tipo_lancamento)
      VALUES(501,1,101,'Projeto previsto',300,'2026-11-01','2026-11-01',1,'manual','aberto','previsao');
      INSERT INTO erp.contas_receber_parcelas(empresa_id,conta_receber_id,numero_parcela,data_vencimento,valor) VALUES(1,501,1,'2026-11-10',300); COMMIT;`)
    assert.equal((await q("SELECT tipo_lancamento FROM erp.contas_receber WHERE id=501"))[0].tipo_lancamento, 'previsao')
    await db.exec("UPDATE erp.contas_receber SET tipo_lancamento='efetivo' WHERE id=501")
    assert((await q('SELECT efetivado_em FROM erp.contas_receber WHERE id=501'))[0].efetivado_em)
    await rejects("UPDATE erp.contas_receber SET tipo_lancamento='previsao' WHERE id=501", /não pode ser previsão/)
  })

  console.info(JSON.stringify({ status: 'passed', checks: checks.length, database: 'PGlite/fictitious' }))
} catch (error) {
  console.error(JSON.stringify({ status: 'failed', message: error.message, code: error.code, stack: error.stack?.split('\n').slice(0, 4) }))
  process.exitCode = 1
} finally {
  await db.close()
}
