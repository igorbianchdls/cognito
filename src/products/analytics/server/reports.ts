// The numbers the Analytics screens show, as BigQuery queries. Every query is limited to one property and a period
// (the table is partitioned by day and clustered by property, so only that slice is read).
import { queryEvents, type BigQueryConfig, type Fetch } from './bigquery'

export const REPORTS = ['resumo', 'paginas', 'origens', 'aparelhos', 'eventos', 'ao-vivo'] as const
export type Report = (typeof REPORTS)[number]
const TZ = 'America/Sao_Paulo'

const scope = 'property_id = @p AND timestamp >= @de AND timestamp < @ate'
const sql: Record<Report, string> = {
  resumo: `
    SELECT FORMAT_DATE('%Y-%m-%d', DATE(timestamp, '${TZ}')) AS dia,
      COUNT(DISTINCT distinct_id) AS visitantes, COUNT(DISTINCT session_id) AS sessoes, COUNTIF(event = '$pageview') AS paginas
    FROM \`events\` WHERE ${scope} GROUP BY dia ORDER BY dia`,
  paginas: `
    SELECT path AS pagina, COUNT(*) AS visualizacoes, COUNT(DISTINCT distinct_id) AS visitantes
    FROM \`events\` WHERE ${scope} AND event = '$pageview' AND path IS NOT NULL GROUP BY pagina ORDER BY visualizacoes DESC LIMIT 20`,
  origens: `
    SELECT COALESCE(utm_source, referrer_host, '(direto)') AS origem, COUNT(DISTINCT distinct_id) AS visitantes, COUNT(DISTINCT session_id) AS sessoes
    FROM \`events\` WHERE ${scope} AND event = '$pageview' GROUP BY origem ORDER BY visitantes DESC LIMIT 20`,
  aparelhos: `
    SELECT 'aparelho' AS tipo, COALESCE(device, 'outro') AS nome, COUNT(DISTINCT distinct_id) AS visitantes FROM \`events\` WHERE ${scope} GROUP BY nome
    UNION ALL SELECT 'navegador', COALESCE(browser, 'Outro'), COUNT(DISTINCT distinct_id) FROM \`events\` WHERE ${scope} GROUP BY 2
    UNION ALL SELECT 'sistema', COALESCE(os, 'Outro'), COUNT(DISTINCT distinct_id) FROM \`events\` WHERE ${scope} GROUP BY 2
    UNION ALL SELECT 'pais', COALESCE(country, '—'), COUNT(DISTINCT distinct_id) FROM \`events\` WHERE ${scope} GROUP BY 2
    ORDER BY tipo, visitantes DESC`,
  eventos: `
    SELECT event AS evento, COUNT(*) AS total, COUNT(DISTINCT distinct_id) AS visitantes, FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', MAX(timestamp)) AS ultimo
    FROM \`events\` WHERE ${scope} GROUP BY evento ORDER BY total DESC LIMIT 50`,
  'ao-vivo': `
    SELECT FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', timestamp) AS quando, event AS evento, path AS pagina, distinct_id AS visitante, user_id AS usuario,
      country AS pais, device AS aparelho, browser AS navegador, referrer_host AS origem, TO_JSON_STRING(properties) AS propriedades
    FROM \`events\` WHERE ${scope} AND (@evento = '' OR event = @evento) ORDER BY timestamp DESC LIMIT 100`,
}

/** The report for [de, ate) (ISO dates or timestamps). ao-vivo can be filtered by event name. */
export function runReport(c: BigQueryConfig, report: Report, propertyId: string, de: Date, ate: Date, evento = '', send: Fetch = fetch) {
  return queryEvents(c, sql[report], [
    { name: 'p', type: 'STRING', value: propertyId },
    { name: 'de', type: 'TIMESTAMP', value: de.toISOString() },
    { name: 'ate', type: 'TIMESTAMP', value: ate.toISOString() },
    ...(report === 'ao-vivo' ? [{ name: 'evento', type: 'STRING' as const, value: evento }] : []),
  ], send)
}
