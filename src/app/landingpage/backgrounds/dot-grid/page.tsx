'use client'

export default function LandingBackgroundDotGridPage() {
  return (
    <>
      <div className="lp-bg-dot-grid" aria-hidden="true">
        <div className="vignette" />
      </div>
      <style jsx global>{`
        .lp-bg-dot-grid {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.03), transparent 45%),
            linear-gradient(180deg, #070707 0%, #0a0a0a 52%, #060606 100%);
          isolation: isolate;
        }

        .lp-bg-dot-grid::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(110, 110, 110, 0.45) 0.7px, transparent 0.9px);
          background-size: 18px 18px;
          background-position: 0 0;
          opacity: 0.38;
          z-index: 0;
        }

        .lp-bg-dot-grid::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 15% 10%, rgba(255, 255, 255, 0.025), transparent 35%),
            radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.02), transparent 35%);
          z-index: 1;
        }

        .lp-bg-dot-grid .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 38%, rgba(0, 0, 0, 0.4) 100%);
          pointer-events: none;
          z-index: 2;
        }
      `}</style>
    </>
  )
}
