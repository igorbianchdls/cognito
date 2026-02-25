'use client'

import MatrixCardShowcase from '../_components/MatrixCardShowcase'

export default function LandingBackgroundMatrixGlassPage() {
  return (
    <>
      <div className="lp-bg-matrix-glass" aria-hidden="true">
        <div className="vignette" />
      </div>
      <MatrixCardShowcase tone="dark" />
      <style jsx global>{`
        .lp-bg-matrix-glass {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(circle at 8% 12%, rgba(99, 102, 241, 0.16), transparent 34%),
            radial-gradient(circle at 90% 14%, rgba(236, 72, 153, 0.12), transparent 34%),
            radial-gradient(circle at 82% 84%, rgba(16, 185, 129, 0.12), transparent 36%),
            #06070b;
          isolation: isolate;
        }

        .lp-bg-matrix-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 0;
        }

        .lp-bg-matrix-glass::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, rgba(255, 255, 255, 0.02), transparent 38%),
            linear-gradient(300deg, rgba(255, 255, 255, 0.02), transparent 42%);
          z-index: 0;
        }

        .lp-bg-matrix-glass .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.42) 100%);
          z-index: 2;
          pointer-events: none;
        }
      `}</style>
    </>
  )
}
