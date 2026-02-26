'use client'

import Link from 'next/link'

const ITEMS = [
  { href: '/landingpage/backgrounds/orbital', title: 'Orbital Grid' },
  { href: '/landingpage/backgrounds/blueprint', title: 'Blueprint Scan' },
  { href: '/landingpage/backgrounds/aurora', title: 'Aurora Executive' },
  { href: '/landingpage/backgrounds/matrix-glass', title: 'Matrix Glass (Color)' },
  { href: '/landingpage/backgrounds/matrix-glass-mono', title: 'Matrix Glass Mono' },
  { href: '/landingpage/backgrounds/matrix-glass-light', title: 'Matrix Glass Light' },
]

export default function LandingBackgroundIndexPage() {
  return (
    <>
      <main className="lp-bg-index">
        <div className="wrap">
          <h1>Backgrounds</h1>
          <p>Subrotas de fundos para reutilizar em dashboards.</p>
          <div className="grid">
            {ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="card">
                <span>{item.title}</span>
                <code>{item.href}</code>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <style jsx global>{`
        .lp-bg-index {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 32px;
          background:
            radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.12), transparent 30%),
            radial-gradient(circle at 90% 15%, rgba(56, 189, 248, 0.1), transparent 30%),
            #07090f;
          color: #e5ecf8;
        }
        .lp-bg-index .wrap {
          width: min(980px, 100%);
        }
        .lp-bg-index h1 {
          margin: 0 0 8px;
          font-size: clamp(28px, 4vw, 44px);
          font-family: var(--font-geist-sans), Geist, sans-serif;
        }
        .lp-bg-index p {
          margin: 0 0 20px;
          color: #93a4bd;
        }
        .lp-bg-index .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .lp-bg-index .card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.03);
          text-decoration: none;
          color: inherit;
        }
        .lp-bg-index .card code {
          color: #7dd3fc;
          font-size: 12px;
        }
      `}</style>
    </>
  )
}
