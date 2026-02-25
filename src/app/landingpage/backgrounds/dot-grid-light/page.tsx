'use client'

export default function LandingBackgroundDotGridLightPage() {
  return (
    <>
      <div className="lp-bg-dot-grid-light" aria-hidden="true">
        <div className="vignette" />
      </div>
      <style jsx global>{`
        .lp-bg-dot-grid-light {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.7), transparent 40%),
            linear-gradient(180deg, #f4f5f7 0%, #eef0f3 55%, #e9ecf0 100%);
          isolation: isolate;
        }

        .lp-bg-dot-grid-light::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(97, 103, 113, 0.3) 0.8px, transparent 1px);
          background-size: 18px 18px;
          opacity: 0.5;
          z-index: 0;
        }

        .lp-bg-dot-grid-light::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(120deg, rgba(255, 255, 255, 0.45), transparent 42%),
            linear-gradient(300deg, rgba(255, 255, 255, 0.35), transparent 46%);
          z-index: 1;
        }

        .lp-bg-dot-grid-light .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 42%, rgba(87, 93, 104, 0.1) 100%);
          pointer-events: none;
          z-index: 2;
        }
      `}</style>
    </>
  )
}
