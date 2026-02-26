'use client'

import DashboardBackgroundPreview from '../_components/DashboardBackgroundPreview'

export default function LandingBackgroundOrbitalPage() {
  return (
    <>
      <div className="lp-bg-orbital" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <DashboardBackgroundPreview tone="dark" title="Orbital Grid" />
      <style jsx global>{`
        .lp-bg-orbital {
          --bg: #030508;
          --glow: #00d4ff;
          --glow2: #7c3aed;
          --glow3: #10b981;
          position: relative;
          min-height: 100vh;
          background: var(--bg);
          overflow: hidden;
          isolation: isolate;
        }

        .lp-bg-orbital::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          z-index: 0;
        }

        .lp-bg-orbital::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.08), transparent 42%),
            radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.06), transparent 60%);
          z-index: 0;
        }

        .lp-bg-orbital .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.18;
          z-index: 0;
        }
        .lp-bg-orbital .blob-1 {
          width: 600px;
          height: 600px;
          background: var(--glow2);
          top: -200px;
          left: -200px;
        }
        .lp-bg-orbital .blob-2 {
          width: 500px;
          height: 500px;
          background: var(--glow);
          bottom: -150px;
          right: -100px;
        }
        .lp-bg-orbital .blob-3 {
          width: 400px;
          height: 400px;
          background: var(--glow3);
          bottom: 100px;
          left: 30%;
          opacity: 0.1;
        }
      `}</style>
    </>
  )
}
