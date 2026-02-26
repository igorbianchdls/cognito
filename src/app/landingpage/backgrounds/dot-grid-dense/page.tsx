'use client'

import DashboardBackgroundPreview from '../_components/DashboardBackgroundPreview'

export default function LandingBackgroundDotGridDensePage() {
  return (
    <>
      <div className="lp-bg-dot-grid-dense" aria-hidden="true">
        <div className="vignette" />
      </div>
      <DashboardBackgroundPreview tone="dark" title="Dot Grid Dense" />
      <style jsx global>{`
        .lp-bg-dot-grid-dense {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            linear-gradient(180deg, #060606 0%, #090909 55%, #050505 100%);
          isolation: isolate;
        }

        .lp-bg-dot-grid-dense::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(118, 118, 118, 0.42) 0.6px, transparent 0.8px);
          background-size: 12px 12px;
          opacity: 0.45;
          z-index: 0;
        }

        .lp-bg-dot-grid-dense::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.02), transparent 42%),
            radial-gradient(circle at 50% 85%, rgba(255, 255, 255, 0.015), transparent 48%);
          z-index: 1;
        }

        .lp-bg-dot-grid-dense .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 36%, rgba(0, 0, 0, 0.44) 100%);
          pointer-events: none;
          z-index: 2;
        }
      `}</style>
    </>
  )
}
