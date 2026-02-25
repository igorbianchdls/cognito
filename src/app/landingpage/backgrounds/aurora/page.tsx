'use client'

export default function LandingBackgroundAuroraPage() {
  return (
    <>
      <div className="lp-bg-aurora" aria-hidden="true">
        <div className="aurora a1" />
        <div className="aurora a2" />
        <div className="aurora a3" />
        <div className="grain" />
      </div>
      <style jsx global>{`
        .lp-bg-aurora {
          position: relative;
          min-height: 100vh;
          background: #07080d;
          overflow: hidden;
          isolation: isolate;
        }

        .lp-bg-aurora::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 10%, rgba(16, 185, 129, 0.08), transparent 30%),
            radial-gradient(circle at 80% 15%, rgba(59, 130, 246, 0.09), transparent 35%),
            radial-gradient(circle at 50% 100%, rgba(168, 85, 247, 0.08), transparent 40%);
          z-index: 0;
        }

        .lp-bg-aurora::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(circle at center, black 35%, transparent 95%);
          z-index: 0;
        }

        .lp-bg-aurora .aurora {
          position: absolute;
          width: 60vw;
          height: 60vw;
          min-width: 520px;
          min-height: 520px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.22;
          mix-blend-mode: screen;
          animation: lp-aurora-drift 20s ease-in-out infinite alternate;
          z-index: 1;
        }

        .lp-bg-aurora .a1 {
          background: radial-gradient(circle, rgba(16, 185, 129, 0.9), rgba(16, 185, 129, 0));
          left: -10%;
          top: 10%;
        }
        .lp-bg-aurora .a2 {
          background: radial-gradient(circle, rgba(59, 130, 246, 0.9), rgba(59, 130, 246, 0));
          right: -15%;
          top: 5%;
          animation-duration: 24s;
          animation-direction: alternate-reverse;
        }
        .lp-bg-aurora .a3 {
          background: radial-gradient(circle, rgba(168, 85, 247, 0.9), rgba(168, 85, 247, 0));
          left: 20%;
          bottom: -15%;
          animation-duration: 28s;
        }

        .lp-bg-aurora .grain {
          position: absolute;
          inset: -50%;
          background-image:
            radial-gradient(rgba(255, 255, 255, 0.06) 0.8px, transparent 0.8px);
          background-size: 6px 6px;
          opacity: 0.04;
          transform: rotate(8deg);
          z-index: 2;
        }

        @keyframes lp-aurora-drift {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(6%, -4%, 0) scale(1.08);
          }
        }
      `}</style>
    </>
  )
}
