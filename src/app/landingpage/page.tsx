'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'

const NODE_IDS = ['n-erp', 'n-google', 'n-meta', 'n-gads', 'n-tele', 'n-crm', 'n-comm', 'n-analytics']
const NODE_COLORS = ['#00d4ff', '#ea4335', '#1877f2', '#fbbc04', '#10b981', '#a855f7', '#6366f1', '#f59e0b']

function nodeCardStyle(color: string): CSSProperties {
  return { ['--node-color' as string]: color } as CSSProperties
}

export default function LandingPage() {
  const diagramRef = useRef<HTMLDivElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    const diagram = diagramRef.current
    if (!svg || !diagram) return

    const getCenter = (el: Element) => {
      const pr = diagram.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      return {
        x: ((r.left + r.width / 2 - pr.left) / pr.width) * 900,
        y: ((r.top + r.height / 2 - pr.top) / pr.height) * 580,
      }
    }

    const drawConnections = () => {
      const svgEl = svgRef.current
      const diagramEl = diagramRef.current
      if (!svgEl || !diagramEl) return

      svgEl.innerHTML = ''
      const coreEl = diagramEl.querySelector('.core')
      if (!coreEl) return
      const core = getCenter(coreEl)

      NODE_IDS.forEach((id, i) => {
        const el = document.getElementById(id)
        if (!el) return
        const p = getCenter(el)
        const color = NODE_COLORS[i]

        const dx = p.x - core.x
        const dy = p.y - core.y
        const mx = core.x + dx * 0.5
        const my = core.y + dy * 0.5

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        const pathId = `landing-conn-${i}`
        const d = `M ${core.x} ${core.y} Q ${mx + dy * 0.15} ${my - dx * 0.15} ${p.x} ${p.y}`
        path.setAttribute('id', pathId)
        path.setAttribute('d', d)
        path.setAttribute('stroke', color)
        path.setAttribute('stroke-width', '1.2')
        path.setAttribute('stroke-opacity', '0.35')
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke-dasharray', '4 6')
        svgEl.appendChild(path)

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('r', '3')
        circle.setAttribute('fill', color)
        circle.setAttribute('filter', `drop-shadow(0 0 4px ${color})`)
        svgEl.appendChild(circle)

        const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion')
        anim.setAttribute('dur', `${2.5 + i * 0.4}s`)
        anim.setAttribute('repeatCount', 'indefinite')
        anim.setAttribute('begin', `${i * 0.3}s`)
        const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath')
        mpath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`)
        anim.appendChild(mpath)
        circle.appendChild(anim)

        const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle2.setAttribute('r', '2')
        circle2.setAttribute('fill', color)
        circle2.setAttribute('opacity', '0.5')
        svgEl.appendChild(circle2)

        const anim2 = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion')
        anim2.setAttribute('dur', `${3 + i * 0.35}s`)
        anim2.setAttribute('repeatCount', 'indefinite')
        anim2.setAttribute('begin', `${1.2 + i * 0.25}s`)
        anim2.setAttribute('keyPoints', '1;0')
        anim2.setAttribute('keyTimes', '0;1')
        anim2.setAttribute('calcMode', 'linear')
        const mpath2 = document.createElementNS('http://www.w3.org/2000/svg', 'mpath')
        mpath2.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${pathId}`)
        anim2.appendChild(mpath2)
        circle2.appendChild(anim2)
      })
    }

    const t1 = window.setTimeout(drawConnections, 100)
    const onResize = () => window.setTimeout(drawConnections, 50)
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(t1)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <>
      <div className="landingpage-root">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="header">
          <div className="logo-badge">AI-Powered · Enterprise OS</div>
          <h1>NEXUS OS</h1>
          <p className="subtitle">// tudo conectado. um único sistema operacional de negócios</p>
        </div>

        <div className="diagram" id="diagram" ref={diagramRef}>
          <svg className="connections" id="svg-connections" ref={svgRef} viewBox="0 0 900 580" />

          <div className="core" style={{ left: '50%', top: '50%' }}>
            <div className="core-ring">
              <div className="core-dot" />
            </div>
            <div className="core-ring" />
            <div className="core-ring" />
            <div className="core-inner">
              <div className="core-ai">AI</div>
              <div className="core-label">
                NEXUS
                <br />
                ENGINE
              </div>
            </div>
          </div>

          <div className="node" id="n-erp" style={{ left: '50%', top: '10%' }}>
            <div className="node-card" style={nodeCardStyle('rgba(0,212,255,0.4)')}>
              <span className="node-icon">🏢</span>
              <div className="node-name">ERP Core</div>
              <div className="node-sub">Financeiro · RH · Estoque</div>
              <div className="node-status">LIVE</div>
            </div>
          </div>

          <div className="node" id="n-google" style={{ left: '83%', top: '20%' }}>
            <div className="node-card" style={nodeCardStyle('rgba(234,67,53,0.4)')}>
              <span className="node-icon">📧</span>
              <div className="node-name">Google</div>
              <div className="node-sub">Gmail · Drive · Calendar</div>
              <div className="node-status">LIVE</div>
            </div>
          </div>

          <div className="node" id="n-meta" style={{ left: '93%', top: '52%' }}>
            <div className="node-card" style={nodeCardStyle('rgba(24,119,242,0.4)')}>
              <span className="node-icon">📣</span>
              <div className="node-name">Meta Ads</div>
              <div className="node-sub">Facebook · Instagram</div>
              <div className="node-status">LIVE</div>
            </div>
          </div>

          <div className="node" id="n-gads" style={{ left: '78%', top: '82%' }}>
            <div className="node-card" style={nodeCardStyle('rgba(251,188,4,0.4)')}>
              <span className="node-icon">🎯</span>
              <div className="node-name">Google Ads</div>
              <div className="node-sub">Search · Display · YT</div>
              <div className="node-status">LIVE</div>
            </div>
          </div>

          <div className="node" id="n-tele" style={{ left: '37%', top: '90%' }}>
            <div className="node-card" style={nodeCardStyle('rgba(16,185,129,0.4)')}>
              <span className="node-icon">📡</span>
              <div className="node-name">Telemetria</div>
              <div className="node-sub">IoT · Sensores · GPS</div>
              <div className="node-status">LIVE</div>
            </div>
          </div>

          <div className="node" id="n-crm" style={{ left: '10%', top: '78%' }}>
            <div className="node-card" style={nodeCardStyle('rgba(168,85,247,0.4)')}>
              <span className="node-icon">🤝</span>
              <div className="node-name">CRM</div>
              <div className="node-sub">Pipeline · Leads · NPS</div>
              <div className="node-status">LIVE</div>
            </div>
          </div>

          <div className="node" id="n-comm" style={{ left: '6%', top: '46%' }}>
            <div className="node-card" style={nodeCardStyle('rgba(99,102,241,0.4)')}>
              <span className="node-icon">💬</span>
              <div className="node-name">Comunicação</div>
              <div className="node-sub">Slack · WhatsApp · SMS</div>
              <div className="node-status">LIVE</div>
            </div>
          </div>

          <div className="node" id="n-analytics" style={{ left: '18%', top: '18%' }}>
            <div className="node-card" style={nodeCardStyle('rgba(245,158,11,0.4)')}>
              <span className="node-icon">📊</span>
              <div className="node-name">Analytics</div>
              <div className="node-sub">BI · Dashboards · KPIs</div>
              <div className="node-status">LIVE</div>
            </div>
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat">
            <div className="stat-value">8+</div>
            <div className="stat-label">Plataformas Conectadas</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-value">∞</div>
            <div className="stat-label">Fluxos de Dados</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-value">1</div>
            <div className="stat-label">Lugar só</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-value">AI</div>
            <div className="stat-label">Inteligência Central</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

        .landingpage-root {
          --bg: #030508;
          --surface: #0a0e18;
          --border: rgba(100, 180, 255, 0.12);
          --glow: #00d4ff;
          --glow2: #7c3aed;
          --glow3: #10b981;
          --text: #e2eeff;
          --muted: #4a6080;
          --accent: #00d4ff;

          background: var(--bg);
          font-family: 'Syne', sans-serif;
          color: var(--text);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          overflow: hidden;
          position: relative;
          isolation: isolate;
        }

        .landingpage-root * {
          box-sizing: border-box;
        }

        .landingpage-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .landingpage-root .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          opacity: 0.18;
          z-index: 0;
        }
        .landingpage-root .blob-1 {
          width: 600px;
          height: 600px;
          background: var(--glow2);
          top: -200px;
          left: -200px;
        }
        .landingpage-root .blob-2 {
          width: 500px;
          height: 500px;
          background: var(--glow);
          bottom: -150px;
          right: -100px;
        }
        .landingpage-root .blob-3 {
          width: 400px;
          height: 400px;
          background: var(--glow3);
          bottom: 100px;
          left: 30%;
          opacity: 0.1;
        }

        .landingpage-root .header {
          text-align: center;
          margin-bottom: 60px;
          position: relative;
          z-index: 10;
        }

        .landingpage-root .logo-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 212, 255, 0.08);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 100px;
          padding: 6px 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--glow);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .landingpage-root .logo-badge::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--glow);
          border-radius: 50%;
          animation: landing-pulse 2s infinite;
        }

        .landingpage-root h1 {
          font-size: clamp(42px, 7vw, 80px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          background: linear-gradient(135deg, #e2eeff 0%, #00d4ff 50%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 16px;
        }

        .landingpage-root .subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--muted);
          letter-spacing: 0.08em;
          margin: 0;
        }

        .landingpage-root .diagram {
          position: relative;
          width: min(900px, 100%);
          aspect-ratio: 900 / 580;
          z-index: 5;
        }

        .landingpage-root svg.connections {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
          z-index: 1;
        }

        .landingpage-root .core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
          width: 160px;
          height: 160px;
        }

        .landingpage-root .core-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(0, 212, 255, 0.3);
          animation: landing-spin 20s linear infinite;
        }
        .landingpage-root .core-ring:nth-child(2) {
          inset: 12px;
          border-color: rgba(124, 58, 237, 0.4);
          animation-duration: 15s;
          animation-direction: reverse;
        }
        .landingpage-root .core-ring:nth-child(3) {
          inset: 24px;
          border-color: rgba(16, 185, 129, 0.3);
          animation-duration: 10s;
        }

        .landingpage-root .core-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          background: var(--glow);
          border-radius: 50%;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 12px var(--glow);
        }

        .landingpage-root .core-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 96px;
          height: 96px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, rgba(10, 14, 24, 0.9) 70%);
          border-radius: 50%;
          border: 1px solid rgba(0, 212, 255, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 40px rgba(0, 212, 255, 0.2), inset 0 0 30px rgba(0, 212, 255, 0.05);
        }

        .landingpage-root .core-label {
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--glow);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.4;
        }

        .landingpage-root .core-ai {
          font-size: 20px;
          font-weight: 800;
          background: linear-gradient(135deg, #00d4ff, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 4px;
        }

        .landingpage-root .node {
          position: absolute;
          z-index: 4;
          transform: translate(-50%, -50%);
        }

        .landingpage-root .node-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px 16px;
          min-width: 120px;
          text-align: center;
          cursor: default;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .landingpage-root .node-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--node-color, rgba(0, 212, 255, 0.05)), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .landingpage-root .node-card:hover {
          border-color: var(--node-color, var(--glow));
          transform: scale(1.05);
          box-shadow: 0 0 24px var(--node-color, rgba(0, 212, 255, 0.3));
        }

        .landingpage-root .node-card:hover::before {
          opacity: 1;
        }

        .landingpage-root .node-icon {
          font-size: 22px;
          margin-bottom: 6px;
          display: block;
        }

        .landingpage-root .node-name {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text);
        }

        .landingpage-root .node-sub {
          font-size: 9px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--muted);
          margin-top: 2px;
        }

        .landingpage-root .node-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          color: var(--glow3);
        }

        .landingpage-root .node-status::before {
          content: '';
          width: 4px;
          height: 4px;
          background: var(--glow3);
          border-radius: 50%;
          animation: landing-pulse 2s infinite;
        }

        .landingpage-root .particle {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          z-index: 3;
          pointer-events: none;
        }

        .landingpage-root .stats-bar {
          display: flex;
          gap: 32px;
          margin-top: 48px;
          position: relative;
          z-index: 10;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }

        .landingpage-root .stat {
          text-align: center;
        }

        .landingpage-root .stat-value {
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #00d4ff, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .landingpage-root .stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .landingpage-root .stat-divider {
          width: 1px;
          background: var(--border);
          align-self: stretch;
          min-height: 36px;
        }

        .landingpage-root .chip {
          position: absolute;
          background: rgba(0, 212, 255, 0.06);
          border: 1px solid rgba(0, 212, 255, 0.15);
          border-radius: 100px;
          padding: 3px 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          color: var(--glow);
          letter-spacing: 0.08em;
          z-index: 6;
          animation: landing-float 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes landing-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.4);
          }
        }

        @keyframes landing-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes landing-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @media (max-width: 900px) {
          .landingpage-root {
            justify-content: flex-start;
            padding: 28px 14px 32px;
          }

          .landingpage-root .header {
            margin-bottom: 24px;
          }

          .landingpage-root .subtitle {
            font-size: 11px;
            letter-spacing: 0.04em;
          }

          .landingpage-root .diagram {
            width: min(900px, 100vw - 16px);
          }

          .landingpage-root .node-card {
            min-width: 94px;
            padding: 8px 10px;
            border-radius: 12px;
          }

          .landingpage-root .node-icon {
            font-size: 18px;
            margin-bottom: 4px;
          }

          .landingpage-root .node-name {
            font-size: 9px;
          }

          .landingpage-root .node-sub {
            display: none;
          }

          .landingpage-root .node-status {
            font-size: 7px;
            margin-top: 4px;
          }

          .landingpage-root .core {
            width: 120px;
            height: 120px;
          }

          .landingpage-root .core-inner {
            width: 72px;
            height: 72px;
          }

          .landingpage-root .core-ai {
            font-size: 16px;
          }

          .landingpage-root .core-label {
            font-size: 8px;
          }

          .landingpage-root .stats-bar {
            gap: 12px;
            margin-top: 20px;
          }

          .landingpage-root .stat-value {
            font-size: 18px;
          }

          .landingpage-root .stat-label {
            font-size: 7px;
          }

          .landingpage-root .stat-divider {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
