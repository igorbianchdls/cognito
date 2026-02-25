'use client'

export default function LandingBackgroundMatrixGlassPage() {
  return (
    <>
      <div className="lp-bg-matrix-glass" aria-hidden="true">
        <div className="panel p1" />
        <div className="panel p2" />
        <div className="panel p3" />
        <div className="vignette" />
      </div>
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

        .lp-bg-matrix-glass .panel {
          position: absolute;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.06),
            rgba(255, 255, 255, 0.02)
          );
          box-shadow:
            0 18px 80px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          z-index: 1;
        }

        .lp-bg-matrix-glass .p1 {
          width: 34vw;
          height: 32vh;
          min-width: 300px;
          min-height: 210px;
          left: -4%;
          top: 12%;
          transform: rotate(-6deg);
        }

        .lp-bg-matrix-glass .p2 {
          width: 42vw;
          height: 26vh;
          min-width: 360px;
          min-height: 190px;
          right: 4%;
          top: 20%;
          transform: rotate(4deg);
        }

        .lp-bg-matrix-glass .p3 {
          width: 52vw;
          height: 28vh;
          min-width: 420px;
          min-height: 200px;
          left: 22%;
          bottom: 8%;
          transform: rotate(-2deg);
        }

        .lp-bg-matrix-glass .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.42) 100%);
          z-index: 2;
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .lp-bg-matrix-glass .p1,
          .lp-bg-matrix-glass .p2,
          .lp-bg-matrix-glass .p3 {
            min-width: 0;
            width: 76vw;
            left: 12%;
            right: auto;
            transform: none;
          }

          .lp-bg-matrix-glass .p1 {
            top: 10%;
            height: 18vh;
            min-height: 130px;
          }
          .lp-bg-matrix-glass .p2 {
            top: 34%;
            height: 20vh;
            min-height: 150px;
          }
          .lp-bg-matrix-glass .p3 {
            top: 60%;
            bottom: auto;
            height: 18vh;
            min-height: 130px;
          }
        }
      `}</style>
    </>
  )
}
