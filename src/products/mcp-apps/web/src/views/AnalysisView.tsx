import { AlertTriangle, CheckCircle2, CircleAlert, Info } from 'lucide-react'
import { ResultShell } from '@/products/mcp-apps/web/src/components/ResultShell'
import type { AnalysisStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { formatCellValue, getToolVisual, humanizeKey } from '@/products/mcp-apps/web/src/utils/format'

type AnalysisItem = Record<string, unknown>

function asRows(value: unknown): AnalysisItem[] {
  return Array.isArray(value)
    ? value.filter((item): item is AnalysisItem => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : []
}

function getSeverity(value: unknown) {
  const severity = String(value || 'info').toLowerCase()
  if (severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low') return severity
  return 'info'
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical' || severity === 'high') return <AlertTriangle size={16} strokeWidth={2.4} />
  if (severity === 'medium') return <CircleAlert size={16} strokeWidth={2.4} />
  if (severity === 'low') return <CheckCircle2 size={16} strokeWidth={2.4} />
  return <Info size={16} strokeWidth={2.4} />
}

export function AnalysisView({ data }: { data: AnalysisStructuredContent }) {
  const visual = getToolVisual('analysis')
  const metrics = asRows(data.metrics)
  const sections = asRows(data.sections)
  const nextSteps = Array.isArray(data.next_steps) ? data.next_steps : []
  const title = data.title || 'Analise'

  return (
    <ResultShell icon={visual.icon} tone={visual.tone} title={title} description={data.subtitle || undefined}>
      <section className="analysis-panel">
        {data.summary ? <p className="analysis-summary">{data.summary}</p> : null}

        {metrics.length ? (
          <div className="analysis-metrics" aria-label="Metricas da analise">
            {metrics.map((metric, index) => {
              const label = String(metric.label || metric.name || metric.title || `Metrica ${index + 1}`)
              const value = metric.value ?? metric.valor ?? metric.total ?? '-'
              return (
                <div className="analysis-metric" key={`${label}-${index}`}>
                  <span>{label}</span>
                  <strong>{formatCellValue(String(metric.format || label), value)}</strong>
                </div>
              )
            })}
          </div>
        ) : null}

        {sections.length ? (
          <div className="analysis-sections">
            {sections.map((section, index) => {
              const severity = getSeverity(section.severity)
              const heading = String(section.title || section.kind || `Achado ${index + 1}`)
              return (
                <article className={`analysis-card analysis-card--${severity}`} key={`${heading}-${index}`}>
                  <header>
                    <span className="analysis-card__icon" aria-hidden="true">
                      <SeverityIcon severity={severity} />
                    </span>
                    <div>
                      <p>{humanizeKey(String(section.kind || severity))}</p>
                      <h2>{heading}</h2>
                    </div>
                  </header>
                  {section.evidence ? <p>{String(section.evidence)}</p> : null}
                  {section.recommendation ? <strong>{String(section.recommendation)}</strong> : null}
                  {section.impact_value !== undefined ? (
                    <span className="analysis-card__impact">
                      Impacto: {formatCellValue('valor', section.impact_value)}
                    </span>
                  ) : null}
                </article>
              )
            })}
          </div>
        ) : null}

        {nextSteps.length ? (
          <section className="analysis-next">
            <h2>Proximos passos</h2>
            <ol>
              {nextSteps.map((step, index) => (
                <li key={`${step}-${index}`}>{step}</li>
              ))}
            </ol>
          </section>
        ) : null}
      </section>
    </ResultShell>
  )
}
