export default function LandingBackgroundBlueprintPage() {
  return (
    <>
      <div className="lp-bg-blueprint" aria-hidden="true">
        <div className="scanline scanline-a" />
        <div className="scanline scanline-b" />
      </div>
      <style jsx global>{`
        .lp-bg-blueprint {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(circle at 15% 18%, rgba(56, 189, 248, 0.16), transparent 36%),
            radial-gradient(circle at 84% 22%, rgba(14, 165, 233, 0.14), transparent 40%),
            radial-gradient(circle at 70% 82%, rgba(59, 130, 246, 0.12), transparent 42%),
            linear-gradient(180deg, #04111f 0%, #030c16 45%, #02070d 100%);
          isolation: isolate;
        }

        .lp-bg-blueprint::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(125, 211, 252, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(125, 211, 252, 0.045) 1px, transparent 1px),
            linear-gradient(rgba(14, 165, 233, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(14, 165, 233, 0.03) 1px, transparent 1px);
          background-size:
            72px 72px,
            72px 72px,
            18px 18px,
            18px 18px;
          z-index: 0;
        }

        .lp-bg-blueprint::after {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at center, rgba(148, 163, 184, 0.06), transparent 55%),
            linear-gradient(135deg, rgba(56, 189, 248, 0.05), transparent 45%, rgba(59, 130, 246, 0.04));
          z-index: 0;
        }

        .lp-bg-blueprint .scanline {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .lp-bg-blueprint .scanline-a {
          background: repeating-linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.015) 0px,
            rgba(255, 255, 255, 0.015) 1px,
            transparent 1px,
            transparent 4px
          );
          opacity: 0.4;
        }

        .lp-bg-blueprint .scanline-b {
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(56, 189, 248, 0.05) 50%,
            transparent 100%
          );
          transform: translateY(-100%);
          animation: lp-blueprint-scan 10s linear infinite;
          opacity: 0.5;
        }

        @keyframes lp-blueprint-scan {
          to {
            transform: translateY(100%);
          }
        }
      `}</style>
    </>
  )
}

