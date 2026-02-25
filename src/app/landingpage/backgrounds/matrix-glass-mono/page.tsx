'use client'

export default function LandingBackgroundMatrixGlassMonoPage() {
  return (
    <>
      <div className="lp-bg-matrix-glass-mono" aria-hidden="true">
        <div className="vignette" />
      </div>
      <style jsx global>{`
        .lp-bg-matrix-glass-mono {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            linear-gradient(180deg, #060606 0%, #090909 50%, #050505 100%);
          isolation: isolate;
        }

        .lp-bg-matrix-glass-mono::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(70, 70, 70, 0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(70, 70, 70, 0.18) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.55;
          z-index: 0;
        }

        .lp-bg-matrix-glass-mono::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, rgba(255, 255, 255, 0.02), transparent 42%),
            linear-gradient(300deg, rgba(255, 255, 255, 0.015), transparent 46%),
            radial-gradient(circle at 50% -10%, rgba(255, 255, 255, 0.02), transparent 45%);
          z-index: 1;
        }

        .lp-bg-matrix-glass-mono .vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at center, transparent 34%, rgba(0, 0, 0, 0.45) 100%);
          pointer-events: none;
          z-index: 2;
        }
      `}</style>
    </>
  )
}
