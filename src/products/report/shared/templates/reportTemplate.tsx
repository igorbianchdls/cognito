'use client'

import React from 'react'

type MarkerProps = {
  children?: React.ReactNode
  id?: string
  name?: string
  title?: string
}

type ChartMarkerProps = {
  data?: Array<Record<string, unknown>>
  height?: number
  series?: Array<string | { color?: string; key: string; label?: string }>
  style?: React.CSSProperties
  title?: string
  type?: 'bar'
  xKey?: string
  format?: 'currency' | 'number' | 'percent'
}

function ReportTemplateMarker({ children }: MarkerProps) {
  return <>{children}</>
}

function ThemeMarker(_: MarkerProps) {
  return null
}

function ReportMarker({ children }: MarkerProps) {
  return <>{children}</>
}

function ChartMarker(_: ChartMarkerProps) {
  return null
}

ReportTemplateMarker.displayName = 'ReportTemplate'
ThemeMarker.displayName = 'Theme'
ReportMarker.displayName = 'Report'
ChartMarker.displayName = 'Chart'

export const REPORT_TEMPLATE_SOURCE = String.raw`<ReportTemplate name="executive_report_runtime" title="Executive Report Review">
  <Theme name="light" />

  <Report id="cover" title="Cover">
    <section style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: 52, backgroundColor: '#FFFFFF', gap: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Q4 / 2025 / Report Runtime Review</p>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, color: '#20232A', letterSpacing: '-0.03em', lineHeight: 1.15 }}>Executive Report Review</h1>
        <p style={{ margin: 0, color: '#5C6470', maxWidth: '72%', lineHeight: 1.7 }}>
          A document-style report now rendered as pure HTML, prioritizing stable pagination, reliable typography and predictable page layout before richer widgets return.
        </p>
      </div>

      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12, color: '#384152', fontSize: 13, lineHeight: 1.7 }}>
        <li>Report layout no longer depends on the generic BI parser.</li>
        <li>Text, headings and sections are authored as HTML and rendered without widget translation.</li>
        <li>Future data components will be reintroduced only after document geometry is stable.</li>
      </ul>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1, padding: 24, backgroundColor: '#EAF8FF', borderRadius: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'stretch' }}>
          <article style={{ padding: 20, border: '1px solid #D7ECF8', borderRadius: 20, backgroundColor: '#F7FCFF' }}>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#6E7F91', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Document behavior</p>
            <h2 style={{ margin: 0, marginBottom: 10, fontSize: 20, fontWeight: 600, color: '#1D2733', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Static report baseline</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425063' }}>
              The report runtime now starts from a static HTML baseline. That gives the page predictable flow and avoids accidental dashboard behavior leaking into print-style documents.
            </p>
          </article>

          <article style={{ padding: 20, border: '1px solid #D7ECF8', borderRadius: 20, backgroundColor: '#FFFFFF' }}>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#6E7F91', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Reading flow</p>
            <h2 style={{ margin: 0, marginBottom: 10, fontSize: 20, fontWeight: 600, color: '#1D2733', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Document-first composition</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425063' }}>
              Sections, paragraphs and emphasis are represented directly as HTML, so the report behaves like a real document instead of a dashboard snapshot.
            </p>
          </article>
        </div>
      </section>
    </section>
  </Report>

  <Report id="summary" title="Summary">
    <section style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: 52, backgroundColor: '#FFFFFF', gap: 22 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ margin: 0, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Executive Report Review</p>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#20232A', letterSpacing: '-0.03em', lineHeight: 1.15 }}>Why report runtime should be independent</h1>
      </div>

      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: '#4E5665' }}>
        Reports have different constraints from slides and dashboards. They need stable vertical flow, printable page behavior and predictable section spacing.
      </p>

      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, color: '#2A3140', fontSize: 13, lineHeight: 1.65 }}>
        <li>Document pages can expand vertically, but pagination must remain visually coherent.</li>
        <li>HTML paragraphs and headings are easier to reason about than generic BI widgets in a report context.</li>
        <li>The runtime can evolve incrementally after the static reading flow is solid.</li>
      </ul>

      <article style={{ padding: 18, border: '1px solid #E8EBF1', borderRadius: 18, backgroundColor: '#FFFFFF' }}>
        <h2 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 600, color: '#20232A', letterSpacing: '-0.02em', lineHeight: 1.25 }}>Practical consequence</h2>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: '#4E5665' }}>
          A dedicated report parser and renderer let the document focus on semantic sections and narrative flow, instead of inheriting interaction-heavy assumptions from dashboards.
        </p>
      </article>

      <Chart
        type="bar"
        title="Runtime complexity comparison"
        xKey="stage"
        height={240}
        format="number"
        style={{ padding: 18, border: '1px solid #E8EBF1', borderRadius: 18, backgroundColor: '#FAFBFD' }}
        data={[
          { stage: 'Parsing', previous: 3, current: 1 },
          { stage: 'Debug', previous: 5, current: 2 },
          { stage: 'Layout', previous: 4, current: 2 },
          { stage: 'Export', previous: 4, current: 2 },
        ]}
        series={[
          { key: 'previous', label: 'Before', color: '#CBD5E1' },
          { key: 'current', label: 'Now', color: '#2563EB' },
        ]}
      />
    </section>
  </Report>

  <Report id="details" title="Details">
    <section style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: 52, backgroundColor: '#FFFFFF', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ margin: 0, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Implementation roadmap</p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, color: '#20232A', letterSpacing: '-0.03em', lineHeight: 1.15 }}>What comes next</h1>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#5C6470', maxWidth: '78%' }}>
          The first stable state is a pure HTML report. Special data components return only after the page flow remains correct in preview, thumbnails and PDF export.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        <article style={{ padding: 20, borderRadius: 18, backgroundColor: '#F8FAFC', border: '1px solid #E8EBF1' }}>
          <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Phase 1</p>
          <h2 style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 600, color: '#20232A' }}>Static report pages</h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#4E5665' }}>Validate reading flow, pagination, preview rendering and export capture with HTML-only content.</p>
        </article>
        <article style={{ padding: 20, borderRadius: 18, backgroundColor: '#F8FAFC', border: '1px solid #E8EBF1' }}>
          <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Phase 2</p>
          <h2 style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 600, color: '#20232A' }}>One component at a time</h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#4E5665' }}>Reintroduce charts or tables through report-specific wrappers instead of the old BI runtime.</p>
        </article>
        <article style={{ padding: 20, borderRadius: 18, backgroundColor: '#F8FAFC', border: '1px solid #E8EBF1' }}>
          <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Phase 3</p>
          <h2 style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 600, color: '#20232A' }}>Richer document DSL</h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#4E5665' }}>Only after runtime stability, extend the report DSL with controlled special blocks where they actually add value.</p>
        </article>
      </div>
    </section>
  </Report>
</ReportTemplate>`

export const REPORT_TEMPLATE = (
  <ReportTemplateMarker name="executive_report_runtime" title="Executive Report Review">
    <ThemeMarker name="light" />

    <ReportMarker id="cover" title="Cover">
      <section style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: 52, backgroundColor: '#FFFFFF', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Q4 / 2025 / Report Runtime Review</p>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, color: '#20232A', letterSpacing: '-0.03em', lineHeight: 1.15 }}>Executive Report Review</h1>
          <p style={{ margin: 0, color: '#5C6470', maxWidth: '72%', lineHeight: 1.7 }}>
            A document-style report now rendered as pure HTML, prioritizing stable pagination, reliable typography and predictable page layout before richer widgets return.
          </p>
        </div>

        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12, color: '#384152', fontSize: 13, lineHeight: 1.7 }}>
          <li>Report layout no longer depends on the generic BI parser.</li>
          <li>Text, headings and sections are authored as HTML and rendered without widget translation.</li>
          <li>Future data components will be reintroduced only after document geometry is stable.</li>
        </ul>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1, padding: 24, backgroundColor: '#EAF8FF', borderRadius: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'stretch' }}>
            <article style={{ padding: 20, border: '1px solid #D7ECF8', borderRadius: 20, backgroundColor: '#F7FCFF' }}>
              <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#6E7F91', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Document behavior</p>
              <h2 style={{ margin: 0, marginBottom: 10, fontSize: 20, fontWeight: 600, color: '#1D2733', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Static report baseline</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425063' }}>
                The report runtime now starts from a static HTML baseline. That gives the page predictable flow and avoids accidental dashboard behavior leaking into print-style documents.
              </p>
            </article>

            <article style={{ padding: 20, border: '1px solid #D7ECF8', borderRadius: 20, backgroundColor: '#FFFFFF' }}>
              <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#6E7F91', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Reading flow</p>
              <h2 style={{ margin: 0, marginBottom: 10, fontSize: 20, fontWeight: 600, color: '#1D2733', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Document-first composition</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#425063' }}>
                Sections, paragraphs and emphasis are represented directly as HTML, so the report behaves like a real document instead of a dashboard snapshot.
              </p>
            </article>
          </div>
        </section>
      </section>
    </ReportMarker>

    <ReportMarker id="summary" title="Summary">
      <section style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: 52, backgroundColor: '#FFFFFF', gap: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Executive Report Review</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#20232A', letterSpacing: '-0.03em', lineHeight: 1.15 }}>Why report runtime should be independent</h1>
        </div>

        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: '#4E5665' }}>
          Reports have different constraints from slides and dashboards. They need stable vertical flow, printable page behavior and predictable section spacing.
        </p>

        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, color: '#2A3140', fontSize: 13, lineHeight: 1.65 }}>
          <li>Document pages can expand vertically, but pagination must remain visually coherent.</li>
          <li>HTML paragraphs and headings are easier to reason about than generic BI widgets in a report context.</li>
          <li>The runtime can evolve incrementally after the static reading flow is solid.</li>
        </ul>

        <article style={{ padding: 18, border: '1px solid #E8EBF1', borderRadius: 18, backgroundColor: '#FFFFFF' }}>
          <h2 style={{ margin: 0, marginBottom: 8, fontSize: 18, fontWeight: 600, color: '#20232A', letterSpacing: '-0.02em', lineHeight: 1.25 }}>Practical consequence</h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.75, color: '#4E5665' }}>
            A dedicated report parser and renderer let the document focus on semantic sections and narrative flow, instead of inheriting interaction-heavy assumptions from dashboards.
          </p>
        </article>

        <ChartMarker
          type="bar"
          title="Runtime complexity comparison"
          xKey="stage"
          height={240}
          format="number"
          style={{ padding: 18, border: '1px solid #E8EBF1', borderRadius: 18, backgroundColor: '#FAFBFD' }}
          data={[
            { stage: 'Parsing', previous: 3, current: 1 },
            { stage: 'Debug', previous: 5, current: 2 },
            { stage: 'Layout', previous: 4, current: 2 },
            { stage: 'Export', previous: 4, current: 2 },
          ]}
          series={[
            { key: 'previous', label: 'Before', color: '#CBD5E1' },
            { key: 'current', label: 'Now', color: '#2563EB' },
          ]}
        />
      </section>
    </ReportMarker>

    <ReportMarker id="details" title="Details">
      <section style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: 52, backgroundColor: '#FFFFFF', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ margin: 0, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Implementation roadmap</p>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, color: '#20232A', letterSpacing: '-0.03em', lineHeight: 1.15 }}>What comes next</h1>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#5C6470', maxWidth: '78%' }}>
            The first stable state is a pure HTML report. Special data components return only after the page flow remains correct in preview, thumbnails and PDF export.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
          <article style={{ padding: 20, borderRadius: 18, backgroundColor: '#F8FAFC', border: '1px solid #E8EBF1' }}>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Phase 1</p>
            <h2 style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 600, color: '#20232A' }}>Static report pages</h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#4E5665' }}>Validate reading flow, pagination, preview rendering and export capture with HTML-only content.</p>
          </article>
          <article style={{ padding: 20, borderRadius: 18, backgroundColor: '#F8FAFC', border: '1px solid #E8EBF1' }}>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Phase 2</p>
            <h2 style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 600, color: '#20232A' }}>One component at a time</h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#4E5665' }}>Reintroduce charts or tables through report-specific wrappers instead of the old BI runtime.</p>
          </article>
          <article style={{ padding: 20, borderRadius: 18, backgroundColor: '#F8FAFC', border: '1px solid #E8EBF1' }}>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 11, color: '#8B8E97', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Phase 3</p>
            <h2 style={{ margin: 0, marginBottom: 10, fontSize: 18, fontWeight: 600, color: '#20232A' }}>Richer document DSL</h2>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#4E5665' }}>Only after runtime stability, extend the report DSL with controlled special blocks where they actually add value.</p>
          </article>
        </div>
      </section>
    </ReportMarker>
  </ReportTemplateMarker>
)
