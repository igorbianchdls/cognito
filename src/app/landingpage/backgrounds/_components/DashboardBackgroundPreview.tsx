'use client'

type Props = {
  tone?: 'dark' | 'light'
  title?: string
  subtitle?: string
}

const sparklinePoints = '0,42 18,40 36,34 54,31 72,28 90,24 108,26 126,19 144,16 162,18 180,12 198,10'
const lineChartPoints = '8,92 38,84 68,88 98,70 128,62 158,68 188,46 218,50 248,34 278,30'
const areaChartPoints = `8,96 ${lineChartPoints} 278,96`

const barData = [64, 48, 78, 36, 55]
const donutData = [42, 28, 18, 12]

export default function DashboardBackgroundPreview({
  tone = 'dark',
  title = 'Dashboard Preview',
  subtitle = 'Cards mockados para comparar legibilidade e contraste em cada background.',
}: Props) {
  const donutOffsets = donutData.reduce<number[]>((acc, value, index) => {
    if (index === 0) return [0]
    acc.push(acc[index - 1] + donutData[index - 1])
    return acc
  }, [])

  return (
    <>
      <section className={`lp-bg-preview lp-bg-preview--${tone}`}>
        <div className="lp-bg-preview__shell">
          <header className="lp-bg-preview__header">
            <div className="lp-bg-preview__eyebrow">Dashboard Mock</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>

          <div className="lp-bg-preview__grid">
            <article className="lp-db-card lp-db-card--kpi">
              <div className="lp-db-card__top">
                <div className="lp-db-card__title">Receita Líquida</div>
                <div className="lp-db-card__badge is-positive">+12.4%</div>
              </div>
              <div className="lp-db-card__value">R$ 248.490</div>
              <div className="lp-db-card__hint">vs. mês anterior</div>
              <svg viewBox="0 0 200 52" className="lp-db-card__sparkline" aria-hidden="true">
                <polyline points={sparklinePoints} />
              </svg>
            </article>

            <article className="lp-db-card lp-db-card--bars">
              <div className="lp-db-card__top">
                <div className="lp-db-card__title">Canais de Venda</div>
                <div className="lp-db-card__badge">Top 5</div>
              </div>
              <div className="lp-db-bars">
                {barData.map((value, i) => (
                  <div key={i} className="lp-db-bars__row">
                    <span className="lp-db-bars__label">{['Site', 'B2B', 'Whats', 'Loja', 'Market'][i]}</span>
                    <div className="lp-db-bars__track">
                      <div className="lp-db-bars__fill" style={{ width: `${value}%` }} />
                    </div>
                    <span className="lp-db-bars__value">{value}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="lp-db-card lp-db-card--line">
              <div className="lp-db-card__top">
                <div className="lp-db-card__title">Faturamento (12 meses)</div>
                <div className="lp-db-card__badge">Trend</div>
              </div>
              <svg viewBox="0 0 286 104" className="lp-db-linechart" aria-hidden="true">
                <defs>
                  <linearGradient id="lp-db-line-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g className="lp-db-linechart__grid">
                  <line x1="8" y1="20" x2="278" y2="20" />
                  <line x1="8" y1="44" x2="278" y2="44" />
                  <line x1="8" y1="68" x2="278" y2="68" />
                  <line x1="8" y1="92" x2="278" y2="92" />
                </g>
                <polygon points={areaChartPoints} className="lp-db-linechart__area" />
                <polyline points={lineChartPoints} className="lp-db-linechart__line" />
              </svg>
            </article>

            <article className="lp-db-card lp-db-card--mix">
              <div className="lp-db-card__top">
                <div className="lp-db-card__title">Mix por Categoria</div>
                <div className="lp-db-card__badge">Share</div>
              </div>
              <div className="lp-db-mix">
                <svg viewBox="0 0 84 84" className="lp-db-donut" aria-hidden="true">
                  <circle cx="42" cy="42" r="28" className="lp-db-donut__base" />
                  {donutData.map((part, i) => {
                    const circumference = 2 * Math.PI * 28
                    const dash = (part / 100) * circumference
                    const gap = circumference - dash
                    const offset = -((donutOffsets[i] / 100) * circumference)
                    return (
                      <circle
                        key={i}
                        cx="42"
                        cy="42"
                        r="28"
                        className={`lp-db-donut__slice s-${i + 1}`}
                        strokeDasharray={`${dash} ${gap}`}
                        strokeDashoffset={offset}
                      />
                    )
                  })}
                </svg>
                <div className="lp-db-legend">
                  {[
                    ['Serviços', '42%'],
                    ['Produtos', '28%'],
                    ['Licenças', '18%'],
                    ['Outros', '12%'],
                  ].map(([label, pct], i) => (
                    <div key={label} className="lp-db-legend__row">
                      <span className={`lp-db-legend__dot s-${i + 1}`} />
                      <span className="lp-db-legend__label">{label}</span>
                      <span className="lp-db-legend__pct">{pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .lp-bg-preview {
          position: fixed;
          inset: 0;
          z-index: 12;
          display: grid;
          align-items: center;
          justify-items: center;
          padding: 28px;
          pointer-events: none;
        }

        .lp-bg-preview__shell {
          width: min(1200px, 100%);
        }

        .lp-bg-preview__header {
          margin-bottom: 14px;
        }

        .lp-bg-preview__eyebrow {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 8px;
          opacity: 0.85;
        }

        .lp-bg-preview__header h1 {
          margin: 0 0 6px;
          font-size: clamp(22px, 2.7vw, 34px);
          line-height: 1.02;
          letter-spacing: -0.035em;
          font-family: var(--font-geist-sans), Geist, sans-serif;
        }

        .lp-bg-preview__header p {
          margin: 0;
          font-size: 13px;
          max-width: 720px;
          opacity: 0.84;
        }

        .lp-bg-preview__grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 14px;
        }

        .lp-db-card {
          border-radius: 18px;
          min-height: 170px;
          padding: 14px;
          display: grid;
          align-content: start;
          gap: 8px;
          border: 1px solid transparent;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.12);
        }

        .lp-db-card--kpi {
          min-height: 194px;
        }

        .lp-db-card__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .lp-db-card__title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: -0.01em;
          opacity: 0.95;
        }

        .lp-db-card__badge {
          font-size: 10px;
          line-height: 1;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 4px 7px;
          border-radius: 999px;
          border: 1px solid currentColor;
          opacity: 0.7;
        }

        .lp-db-card__badge.is-positive {
          border-color: rgba(16, 185, 129, 0.35);
          color: #10b981;
          background: rgba(16, 185, 129, 0.08);
          opacity: 1;
        }

        .lp-db-card__value {
          font-size: clamp(24px, 2.2vw, 30px);
          line-height: 1.02;
          letter-spacing: -0.045em;
          font-weight: 700;
        }

        .lp-db-card__hint {
          font-size: 11px;
          opacity: 0.72;
          margin-top: -2px;
        }

        .lp-db-card__sparkline {
          width: 100%;
          height: 52px;
          overflow: visible;
          margin-top: auto;
        }

        .lp-db-card__sparkline polyline {
          fill: none;
          stroke: currentColor;
          stroke-width: 2.25;
          stroke-linecap: round;
          stroke-linejoin: round;
          opacity: 0.8;
        }

        .lp-db-bars {
          display: grid;
          gap: 7px;
          margin-top: 2px;
        }

        .lp-db-bars__row {
          display: grid;
          grid-template-columns: 48px 1fr 28px;
          align-items: center;
          gap: 8px;
        }

        .lp-db-bars__label,
        .lp-db-bars__value {
          font-size: 10px;
          opacity: 0.8;
        }

        .lp-db-bars__track {
          height: 7px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
          overflow: hidden;
        }

        .lp-db-bars__fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.85), rgba(16, 185, 129, 0.85));
        }

        .lp-db-linechart {
          width: 100%;
          height: 104px;
          margin-top: auto;
        }

        .lp-db-linechart__grid line {
          stroke: currentColor;
          stroke-opacity: 0.12;
          stroke-width: 1;
        }

        .lp-db-linechart__area {
          fill: url(#lp-db-line-fill);
        }

        .lp-db-linechart__line {
          fill: none;
          stroke: currentColor;
          stroke-opacity: 0.9;
          stroke-width: 2.25;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .lp-db-mix {
          display: grid;
          grid-template-columns: 84px 1fr;
          gap: 10px;
          align-items: center;
          margin-top: 2px;
        }

        .lp-db-donut {
          width: 84px;
          height: 84px;
          transform: rotate(-90deg);
        }

        .lp-db-donut__base {
          fill: none;
          stroke: rgba(148, 163, 184, 0.16);
          stroke-width: 10;
        }

        .lp-db-donut__slice {
          fill: none;
          stroke-width: 10;
          stroke-linecap: butt;
        }

        .lp-db-donut__slice.s-1,
        .lp-db-legend__dot.s-1 { stroke: #60a5fa; background: #60a5fa; }
        .lp-db-donut__slice.s-2,
        .lp-db-legend__dot.s-2 { stroke: #34d399; background: #34d399; }
        .lp-db-donut__slice.s-3,
        .lp-db-legend__dot.s-3 { stroke: #f59e0b; background: #f59e0b; }
        .lp-db-donut__slice.s-4,
        .lp-db-legend__dot.s-4 { stroke: #f472b6; background: #f472b6; }

        .lp-db-legend {
          display: grid;
          gap: 6px;
        }

        .lp-db-legend__row {
          display: grid;
          grid-template-columns: 8px 1fr auto;
          align-items: center;
          gap: 6px;
        }

        .lp-db-legend__dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }

        .lp-db-legend__label,
        .lp-db-legend__pct {
          font-size: 10px;
          opacity: 0.84;
        }

        .lp-bg-preview--dark {
          color: #eef2f7;
        }

        .lp-bg-preview--dark .lp-db-card {
          background: linear-gradient(180deg, rgba(13, 16, 22, 0.78), rgba(10, 12, 17, 0.7));
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow:
            0 16px 42px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .lp-bg-preview--dark .lp-db-card--kpi {
          background:
            linear-gradient(180deg, rgba(16, 24, 36, 0.84), rgba(10, 14, 22, 0.76)),
            radial-gradient(circle at 12% 8%, rgba(96, 165, 250, 0.12), transparent 46%);
          border-color: rgba(96, 165, 250, 0.14);
        }

        .lp-bg-preview--dark .lp-db-card--bars {
          background:
            linear-gradient(180deg, rgba(13, 21, 18, 0.82), rgba(10, 15, 14, 0.74)),
            radial-gradient(circle at 88% 12%, rgba(52, 211, 153, 0.10), transparent 48%);
          border-color: rgba(52, 211, 153, 0.12);
        }

        .lp-bg-preview--dark .lp-db-card--line {
          background:
            linear-gradient(180deg, rgba(14, 18, 28, 0.82), rgba(10, 13, 20, 0.74)),
            radial-gradient(circle at 82% 16%, rgba(34, 211, 238, 0.08), transparent 46%);
          border-color: rgba(34, 211, 238, 0.10);
        }

        .lp-bg-preview--dark .lp-db-card--mix {
          background:
            linear-gradient(180deg, rgba(23, 15, 28, 0.82), rgba(13, 10, 19, 0.74)),
            radial-gradient(circle at 18% 14%, rgba(244, 114, 182, 0.10), transparent 48%);
          border-color: rgba(244, 114, 182, 0.12);
        }

        .lp-bg-preview--dark .lp-bg-preview__eyebrow {
          color: #cbd5e1;
        }

        .lp-bg-preview--dark .lp-bg-preview__header p {
          color: #c7d0db;
        }

        .lp-bg-preview--light {
          color: #0f172a;
        }

        .lp-bg-preview--light .lp-db-card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0.74));
          border-color: rgba(148, 163, 184, 0.24);
          box-shadow:
            0 16px 40px rgba(15, 23, 42, 0.10),
            inset 0 1px 0 rgba(255, 255, 255, 0.75);
        }

        .lp-bg-preview--light .lp-bg-preview__eyebrow {
          color: #334155;
        }

        .lp-bg-preview--light .lp-bg-preview__header p {
          color: #475569;
        }

        @media (max-width: 980px) {
          .lp-bg-preview {
            align-items: start;
            padding: 16px;
          }

          .lp-bg-preview__grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .lp-db-card {
            min-height: 150px;
            border-radius: 14px;
          }

          .lp-db-card--kpi {
            min-height: 170px;
          }
        }
      `}</style>
    </>
  )
}
