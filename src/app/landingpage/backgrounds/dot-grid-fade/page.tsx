'use client'

export default function LandingBackgroundDotGridFadePage() {
  return (
    <>
      <div className="lp-bg-dot-grid-fade" aria-hidden="true">
        <div className="vignette" />
      </div>
      <style jsx global>{`
        .lp-bg-dot-grid-fade {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            linear-gradient(180deg, #070707 0%, #0a0a0a 52%, #060606 100%);
          isolation: isolate;
        }

        .lp-bg-dot-grid-fade::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(115, 115, 115, 0.46) 0.7px, transparent 0.95px);
          background-size: 18px 18px;
          opacity: 0.42;
          mask-image: radial-gradient(circle at center, transparent 14%, black 42%, black 58%, transparent 92%);
          -webkit-mask-image: radial-gradient(circle at center, transparent 14%, black 42%, black 58%, transparent 92%);
          z-index: 0;
        }

        .lp-bg-dot-grid-fade::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at center, rgba(255, 255, 255, 0.02), transparent 55%);
          z-index: 1;
        }

        .lp-bg-dot-grid-fade .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 34%, rgba(0, 0, 0, 0.42) 100%);
          pointer-events: none;
          z-index: 2;
        }
      `}</style>
    </>
  )
}
