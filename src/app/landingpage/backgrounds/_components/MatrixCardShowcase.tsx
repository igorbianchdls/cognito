'use client'

type Props = {
  tone?: 'dark' | 'light'
}

export default function MatrixCardShowcase({ tone = 'dark' }: Props) {
  return (
    <>
      <div className={`lp-matrix-showcase ${tone === 'light' ? 'is-light' : 'is-dark'}`}>
        <div className="lp-matrix-showcase__inner">
          <div className="lp-matrix-showcase__header">
            <div className="lp-matrix-showcase__eyebrow">Preview UI sobre fundo Matrix</div>
            <h1>Comparativo de cards</h1>
            <p>3 estilos para avaliar legibilidade vs preservação do efeito de fundo.</p>
          </div>

          <div className="lp-matrix-showcase__grid">
            <article className="lp-matrix-card lp-matrix-card--glass-dark">
              <div className="lp-matrix-card__tag">glass-dark</div>
              <div className="lp-matrix-card__title">Receita Líquida</div>
              <div className="lp-matrix-card__value">R$ 248.490</div>
              <div className="lp-matrix-card__meta">Mais fiel ao fundo FX • melhor para tema matrix</div>
            </article>

            <article className="lp-matrix-card lp-matrix-card--glass-light">
              <div className="lp-matrix-card__tag">glass-light</div>
              <div className="lp-matrix-card__title">Receita Líquida</div>
              <div className="lp-matrix-card__value">R$ 248.490</div>
              <div className="lp-matrix-card__meta">Visual premium • pode dominar demais em fundo escuro</div>
            </article>

            <article className="lp-matrix-card lp-matrix-card--solid-contrast">
              <div className="lp-matrix-card__tag">solid-contrast</div>
              <div className="lp-matrix-card__title">Receita Líquida</div>
              <div className="lp-matrix-card__value">R$ 248.490</div>
              <div className="lp-matrix-card__meta">Máxima legibilidade • reduz presença do background</div>
            </article>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .lp-matrix-showcase {
          position: fixed;
          inset: 0;
          z-index: 12;
          display: grid;
          align-items: center;
          justify-items: center;
          padding: 28px;
          pointer-events: none;
        }

        .lp-matrix-showcase__inner {
          width: min(1180px, 100%);
        }

        .lp-matrix-showcase__header {
          margin-bottom: 18px;
        }

        .lp-matrix-showcase__eyebrow {
          margin-bottom: 8px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          opacity: 0.8;
        }

        .lp-matrix-showcase h1 {
          margin: 0 0 6px;
          font-size: clamp(22px, 3vw, 34px);
          line-height: 1.05;
          letter-spacing: -0.03em;
          font-family: var(--font-geist-sans), Geist, sans-serif;
        }

        .lp-matrix-showcase p {
          margin: 0;
          font-size: 13px;
          opacity: 0.86;
        }

        .lp-matrix-showcase__grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .lp-matrix-card {
          min-height: 164px;
          border-radius: 16px;
          padding: 14px 14px 12px;
          display: grid;
          align-content: start;
          gap: 8px;
        }

        .lp-matrix-card__tag {
          justify-self: start;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 10px;
          line-height: 1;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .lp-matrix-card__title {
          font-size: 12px;
          font-weight: 600;
          opacity: 0.9;
        }

        .lp-matrix-card__value {
          font-size: clamp(22px, 2.4vw, 30px);
          line-height: 1.05;
          letter-spacing: -0.04em;
          font-weight: 700;
        }

        .lp-matrix-card__meta {
          margin-top: auto;
          font-size: 11px;
          line-height: 1.35;
          opacity: 0.82;
        }

        .lp-matrix-showcase.is-dark {
          color: #eef2f7;
        }

        .lp-matrix-showcase.is-dark .lp-matrix-showcase__eyebrow {
          color: #cbd5e1;
        }

        .lp-matrix-showcase.is-dark .lp-matrix-showcase p {
          color: #c7d0db;
        }

        .lp-matrix-showcase.is-light {
          color: #111827;
        }

        .lp-matrix-showcase.is-light .lp-matrix-showcase__eyebrow {
          color: #334155;
        }

        .lp-matrix-showcase.is-light .lp-matrix-showcase p {
          color: #475569;
        }

        .lp-matrix-card--glass-dark {
          color: #edf2f7;
          background: linear-gradient(180deg, rgba(15, 18, 24, 0.82), rgba(11, 13, 18, 0.74));
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 10px 34px rgba(0, 0, 0, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .lp-matrix-card--glass-dark .lp-matrix-card__tag {
          color: #dbeafe;
          background: rgba(96, 165, 250, 0.16);
          border: 1px solid rgba(96, 165, 250, 0.2);
        }

        .lp-matrix-card--glass-light {
          color: #0f172a;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.66));
          border: 1px solid rgba(255, 255, 255, 0.55);
          box-shadow:
            0 12px 34px rgba(9, 12, 18, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .lp-matrix-card--glass-light .lp-matrix-card__tag {
          color: #1e293b;
          background: rgba(148, 163, 184, 0.2);
          border: 1px solid rgba(148, 163, 184, 0.28);
        }

        .lp-matrix-card--solid-contrast {
          color: #0f172a;
          background: #ffffff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 12px 28px rgba(2, 6, 23, 0.12);
        }

        .lp-matrix-card--solid-contrast .lp-matrix-card__tag {
          color: #0f172a;
          background: #eef2ff;
          border: 1px solid #dbeafe;
        }

        @media (max-width: 900px) {
          .lp-matrix-showcase {
            align-items: start;
            padding: 18px;
          }

          .lp-matrix-showcase__header {
            margin-bottom: 12px;
          }

          .lp-matrix-showcase__grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .lp-matrix-card {
            min-height: 126px;
          }
        }
      `}</style>
    </>
  )
}
