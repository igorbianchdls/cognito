import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('docs/avaliacao-erp/catalogo-revisao-tabelas.json', 'utf8'));
const excluded = new Set(['configuracoes_fiscais','notas_fiscais','notas_fiscais_itens','notas_fiscais_totais','notas_fiscais_eventos','conversoes_unidades_produto','documentos_estoque','documentos_estoque_itens','inventarios','inventarios_itens','kits_produtos','kits_produtos_itens','locais_estoque','movimentacoes_estoque','reservas_estoque','saldos_estoque','transferencias_estoque','transferencias_estoque_itens']);
const tables = c.rls.filter(x => x.schema === 'erp' && x.relkind === 'r' && !excluded.has(x.relname)).map(x => x.relname).sort();
if (tables.length !== 50) throw new Error('Revisar escopo: quantidade de tabelas mudou.');
const safe = value => String(value ?? '—').replaceAll('|','\\|').replaceAll('\n',' ');
const lines = ['# Dicionário das tabelas avaliadas', '', `Fonte: consulta de metadados de ${c.date}.`, '', '50 tabelas fora dos módulos fiscal e estoque. Produtos e fornecedores de produtos constam apenas como cadastros referenciados. Campos e vínculos de fiscal/estoque das tabelas compartilhadas são omitidos abaixo; o catálogo bruto preserva os metadados completos para rastreabilidade.', '', 'Este arquivo descreve a estrutura existente. As recomendações estão em [Avaliação completa](avaliacao-tabelas-servicos.md).', ''];
for (const t of tables) {
  lines.push(`## erp.${t}`, '', '| Coluna | Tipo | Aceita nulo | Padrão |', '| --- | --- | --- | --- |');
  for (const x of c.columns.filter(x => x.table_schema === 'erp' && x.table_name === t && !/estoque|fiscal|imposto|tribut|ncm|cest|suframa|inscricao|simples|codigo_servico_municipal/.test(x.column_name))) {
    const type = x.udt_name === 'numeric' ? `numeric(${x.numeric_precision},${x.numeric_scale})` : x.udt_name;
    lines.push(`| ${x.column_name} | ${type} | ${x.is_nullable === 'YES' ? 'Sim' : 'Não'} | ${safe(x.column_default)} |`);
  }
  lines.push('', 'Restrições e relacionamentos:', '', '```sql');
  lines.push(...c.constraints.filter(x => x.schema === 'erp' && x.table_name === t && !/estoque|fiscal|imposto|tribut|ncm|cest|suframa|inscricao/.test(x.name)).map(x => `${x.name}: ${x.definition}`));
  lines.push('```', '', 'Índices:', '', '```sql');
  lines.push(...c.indexes.filter(x => x.schemaname === 'erp' && x.tablename === t && !/estoque|fiscal/.test(x.indexname)).map(x => x.indexdef));
  lines.push('```', '', 'Gatilhos e políticas:', '', '```text');
  lines.push(...c.triggers.filter(x => x.schema === 'erp' && x.table_name === t).map(x => x.definition));
  lines.push(...c.policies.filter(x => x.schemaname === 'erp' && x.tablename === t).map(x => `${x.cmd}: ${x.qual ?? ''} WITH CHECK ${x.with_check ?? ''}`));
  lines.push('```', '');
}
fs.writeFileSync('docs/avaliacao-erp/dicionario-tabelas-servicos.md', lines.join('\n'));
const scoped = new Set(tables);
console.log(JSON.stringify({tables: tables.length, columns: c.columns.filter(x=>x.table_schema==='erp'&&scoped.has(x.table_name)).length, indexes:c.indexes.filter(x=>x.schemaname==='erp'&&scoped.has(x.tablename)).length, fks:c.constraints.filter(x=>x.schema==='erp'&&scoped.has(x.table_name)&&x.type==='f').length, checks:c.constraints.filter(x=>x.schema==='erp'&&scoped.has(x.table_name)&&x.type==='c').length, tablesWithoutRls:c.rls.filter(x=>x.schema==='erp'&&scoped.has(x.relname)&&!x.relrowsecurity).map(x=>x.relname)}));
