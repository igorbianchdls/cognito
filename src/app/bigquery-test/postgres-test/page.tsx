import { runQuery } from '@/lib/postgres';

export const dynamic = 'force-dynamic';

type Row = {
  plataforma: string | null;
  contas_vinculadas: number | null;
  campanhas_vinculadas: number | null;
  gasto_total: number | null;
  receita_total: number | null;
  conversoes_total: number | null;
  roas: number | null;
  taxa_conversao_percent: number | null;
  ctr_percent: number | null;
};

async function fetchSample() {
  const sql = `
    with base as (
      select
        ma.gasto,
        ma.receita,
        ma.conversao,
        ma.cliques,
        ma.impressao,
        ma.plataforma as plataforma_metricas,
        ap.plataforma as plataforma_anuncio,
        co.plataforma as plataforma_conta,
        coalesce(co.id, ma.conta_ads_id) as conta_relacionada_id,
        c.id as campanha_relacionada_id
      from trafego_pago.metricas_anuncios ma
      left join trafego_pago.anuncios_publicados ap
        on ap.id = ma.anuncio_publicado_id
      left join trafego_pago.grupos_de_anuncios ga
        on ga.id = ap.grupo_id
      left join trafego_pago.campanhas c
        on c.id = ga.campanha_id
      left join trafego_pago.contas_ads co
        on co.id = coalesce(ma.conta_ads_id, c.conta_ads_id)
      where ma.data >= current_date - interval '30 days'
    )
    select
      coalesce(plataforma_conta, plataforma_anuncio, plataforma_metricas, 'Desconhecida') as plataforma,
      count(distinct conta_relacionada_id) as contas_vinculadas,
      count(distinct campanha_relacionada_id) as campanhas_vinculadas,
      sum(gasto) as gasto_total,
      sum(receita) as receita_total,
      sum(conversao) as conversoes_total,
      case when sum(gasto) > 0 then sum(receita) / sum(gasto) else 0 end as roas,
      case when sum(cliques) > 0 then (sum(conversao)::numeric / sum(cliques)) * 100 else 0 end as taxa_conversao_percent,
      case when sum(impressao) > 0 then (sum(cliques)::numeric / sum(impressao)) * 100 else 0 end as ctr_percent
    from base
    group by 1
    order by roas desc;
  `;

  return runQuery<Row>(sql);
}

export default async function PostgresTestPage() {
  try {
    const rows = await fetchSample();
    return (
      <div className="min-h-screen bg-slate-950 py-16">
        <div className="mx-auto w-full max-w-3xl space-y-10 px-6 text-slate-50">
          <header className="space-y-2">
            <p className="text-sm text-slate-400 uppercase tracking-widest">Postgres via pgBouncer</p>
            <h1 className="text-3xl font-semibold">Teste de Conexão com Supabase/Postgres</h1>
            <p className="text-sm text-slate-400">
              Query montada com múltiplos joins (últimos 30 dias). Ajuste o SQL em <code className="font-mono">src/app/bigquery-test/postgres-test/page.tsx</code>.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-medium text-emerald-300">Resultado</h2>
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-900">
                  <tr className="text-left text-slate-300">
                    <th className="px-4 py-3 font-medium">Plataforma</th>
                    <th className="px-4 py-3 font-medium text-right">Contas</th>
                    <th className="px-4 py-3 font-medium text-right">Campanhas</th>
                    <th className="px-4 py-3 font-medium text-right">Gasto</th>
                    <th className="px-4 py-3 font-medium text-right">Receita</th>
                    <th className="px-4 py-3 font-medium text-right">Conversões</th>
                    <th className="px-4 py-3 font-medium text-right">ROAS</th>
                    <th className="px-4 py-3 font-medium text-right">Taxa Conversão</th>
                    <th className="px-4 py-3 font-medium text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.plataforma ?? 'N/A'} className="text-slate-100">
                      <td className="px-4 py-3 font-medium">{row.plataforma ?? 'Desconhecida'}</td>
                      <td className="px-4 py-3 text-right">{row.contas_vinculadas ?? 0}</td>
                      <td className="px-4 py-3 text-right">{row.campanhas_vinculadas ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        {row.gasto_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.receita_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.conversoes_total?.toLocaleString('pt-BR') ?? '0'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.roas?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.taxa_conversao_percent !== null ? `${row.taxa_conversao_percent.toFixed(2)}%` : '0.00%'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.ctr_percent !== null ? `${row.ctr_percent.toFixed(2)}%` : '0.00%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="text-xs text-slate-500">
            Consultando <code className="font-mono">SUPABASE_DB_URL</code> com Pool (pg). Confira os dados na Vercel local/dev antes de ir para produção.
          </footer>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Erro ao consultar Postgres:', error);

    return (
      <div className="min-h-screen bg-slate-950 py-16">
        <div className="mx-auto w-full max-w-xl space-y-6 px-6 text-slate-50">
          <h1 className="text-2xl font-semibold text-red-300">Erro na conexão com Postgres</h1>
          <p className="text-sm text-slate-300">
            Verifique se <code className="font-mono">SUPABASE_DB_URL</code> está definido e acessível. Veja o log no server para mais detalhes.
          </p>
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-900/70 p-4 text-xs text-red-200">
            {String(error)}
          </pre>
        </div>
      </div>
    );
  }
}
