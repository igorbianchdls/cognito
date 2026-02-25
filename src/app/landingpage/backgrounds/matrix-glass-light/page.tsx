'use client'

export default function LandingBackgroundMatrixGlassLightPage() {
  return (
    <>
      <div className="lp-bg-matrix-glass-light" aria-hidden="true">
        <div className="vignette" />
      </div>
      <style jsx global>{`
        .lp-bg-matrix-glass-light {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(circle at 12% 10%, rgba(255, 255, 255, 0.8), transparent 34%),
            radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.72), transparent 34%),
            linear-gradient(180deg, #f1f2f4 0%, #eceef1 48%, #e7eaee 100%);
          isolation: isolate;
        }

        .lp-bg-matrix-glass-light::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(88, 94, 104, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(88, 94, 104, 0.12) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.75;
          z-index: 0;
        }

        .lp-bg-matrix-glass-light::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, rgba(255, 255, 255, 0.6), transparent 38%),
            linear-gradient(300deg, rgba(255, 255, 255, 0.45), transparent 44%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.35), transparent 65%);
          z-index: 1;
        }

        .lp-bg-matrix-glass-light .vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at center, transparent 38%, rgba(77, 83, 94, 0.12) 100%);
          pointer-events: none;
          z-index: 2;
        }
      `}</style>
    </>
  )
}
