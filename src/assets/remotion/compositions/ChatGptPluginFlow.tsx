import { AtSign, ChevronDown, ChevronLeft, ChevronRight, Clock, CloudCog, Ellipsis, Folder, Github, LayoutGrid, LibraryBig, MessageCircle, Plus, Search, Settings, SquarePen, SquareTerminal, X } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Easing, Img, interpolate, staticFile } from 'remotion'

import { Composer, StatusBar, TEXT, TopBar, iv } from './ChatGptVendasCardReplica'

/**
 * "Install the Otto plugin" in the ChatGPT iOS app (replica of the user's prints, Otto in place of Notion):
 * side menu → Plugins → search "otto" → Otto page (already installed) → "Testar no chat".
 * Drawn in the reel's logical screen (828 × screenH); `t` is seconds since the scene started.
 */

/** Seconds the plugin narration needs on screen ("Primeiro, instala o plugin do Otto…" + a beat). */
export const PLUGIN_FLOW_LENGTH = 8.9

/** Cues in the plugin narration take. */
const C = {
  drawer: 0.1, // "Primeiro"
  tapPlugins: 4.35, // "Plugins"
  tapSearch: 5.05,
  typing: [5.3, 5.9], // "buscar Otto"
  tapOtto: 6.5, // "pronto"
  tapTest: 7.7, // "usar no chat"
}

const MUTED = '#8e8e8e'
const BORDER = '#e7e7e7'
const BLUE = '#2f7cf6'

const ease = (t: number, from: number, to: number) => interpolate(t, [from, to], [0, 1], { easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

function Tap({ at, t, x, y }: { at: number; t: number; x: number; y: number }) {
  if (t < at || t > at + 0.5) return null
  const r = ease(t, at, at + 0.45)
  const size = 40 + r * 120
  return <div style={{ background: 'rgba(0,0,0,0.14)', borderRadius: 99, height: size, left: x - size / 2, opacity: 1 - r * 0.8, position: 'absolute', top: y - size / 2, width: size, zIndex: 9 }} />
}

const abs = (style: CSSProperties): CSSProperties => ({ position: 'absolute', ...style })

// ─── App logos (simplified) ──────────────────────────────────────────────────

const OttoLogo = ({ size }: { size: number }) => <Img src={staticFile('logoOttoIcon.svg')} style={{ height: size, objectFit: 'contain', width: size }} />

const GmailLogo = () => (
  <svg height={44} viewBox="0 0 48 36" width={58}>
    <path d="M4 34 V8 L24 22 L44 8 V34" fill="none" stroke="#ea4335" strokeLinejoin="round" strokeWidth={7} />
    <path d="M4 34 V10" stroke="#4285f4" strokeLinecap="round" strokeWidth={7} />
    <path d="M44 34 V10" stroke="#34a853" strokeLinecap="round" strokeWidth={7} />
  </svg>
)

const DriveLogo = ({ size = 56 }: { size?: number }) => (
  <svg height={size} viewBox="0 0 48 42" width={size}>
    <path d="M16 2 H32 L46 26 H30 Z" fill="#ffba00" />
    <path d="M16 2 L30 26 L22 40 L2 26 Z" fill="#0f9d58" opacity={0.95} />
    <path d="M2 26 H46 L38 40 H10 Z" fill="#4285f4" opacity={0.95} />
  </svg>
)

const HealthLogo = () => (
  <svg height={52} viewBox="0 0 48 48" width={52}>
    {[0, 72, 144, 216, 288].map((a) => (
      <circle cx={24 + 10 * Math.cos(((a - 90) * Math.PI) / 180)} cy={24 + 10 * Math.sin(((a - 90) * Math.PI) / 180)} fill="#e8202a" key={a} r={11} />
    ))}
    <path d="M24 31 C16 25 17 19 21 19 C23 19 24 21 24 21 C24 21 25 19 27 19 C31 19 32 25 24 31 Z" fill="#fff" />
  </svg>
)

const FigmaLike = () => (
  <svg height={60} viewBox="0 0 40 40" width={60}>
    <rect fill="#36c5f0" height={14} rx={4} width={14} x={4} y={4} />
    <rect fill="#ff7262" height={14} rx={4} transform="rotate(45 27 11)" width={14} x={20} y={4} />
    <rect fill="#1abcfe" height={14} rx={4} width={14} x={4} y={20} />
    <rect fill="#ffd600" height={14} rx={4} width={14} x={20} y={20} />
  </svg>
)

function Tile({ children, size = 96 }: { children: ReactNode; size?: number }) {
  return <span style={{ alignItems: 'center', background: '#fff', border: `2px solid ${BORDER}`, borderRadius: size * 0.25, display: 'flex', flex: 'none', height: size, justifyContent: 'center', width: size }}>{children}</span>
}

// ─── Screens ─────────────────────────────────────────────────────────────────

const MENU = [
  { icon: <LibraryBig color={TEXT} size={38} strokeWidth={2} style={iv(38, 2)} />, label: 'Biblioteca' },
  { icon: <Folder color={TEXT} size={38} strokeWidth={2} style={iv(38, 2)} />, label: 'Projetos' },
  { icon: <AtSign color={TEXT} size={38} strokeWidth={2} style={iv(38, 2)} />, label: 'Plugins' },
  { icon: <Clock color={TEXT} size={38} strokeWidth={2} style={iv(38, 2)} />, label: 'Agendado' },
  { icon: <SquareTerminal color={TEXT} size={38} strokeWidth={2} style={iv(38, 2)} />, label: 'Codex' },
  { icon: <LayoutGrid color={TEXT} size={38} strokeWidth={2} style={iv(38, 2)} />, label: 'Explorar' },
]

const PINNED = ['Fluxo de caixa de outubro', 'Notas fiscais da semana', 'Despesas do mês', 'Clientes em atraso', 'Metas de vendas']

function Drawer({ screenH, t }: { screenH: number; t: number }) {
  const pressed = t >= C.tapPlugins - 0.05
  return (
    <div style={abs({ background: '#f9f9f9', bottom: 0, left: 0, top: 0, width: 620 })}>
      <StatusBar />
      <span style={abs({ color: TEXT, fontSize: 42, fontWeight: 700, left: 66, letterSpacing: '-0.02em', top: 112 })}>ChatGPT</span>
      <span style={abs({ left: 506, top: 118 })}>
        <Search color={TEXT} size={42} strokeWidth={2.2} style={iv(42, 2.2)} />
      </span>
      {MENU.map((item, i) => (
        <div key={item.label} style={abs({ alignItems: 'center', background: item.label === 'Plugins' && pressed ? '#ececec' : 'transparent', borderRadius: 24, display: 'flex', gap: 30, height: 88, left: 20, padding: '0 0 0 48px', right: 20, top: 244 - 44 + i * 96 })}>
          {item.icon}
          <span style={{ color: TEXT, fontSize: 32 }}>{item.label}</span>
        </div>
      ))}
      <span style={abs({ color: TEXT, fontSize: 32, fontWeight: 600, left: 66, top: 824 })}>Fixado</span>
      {PINNED.map((title, i) => (
        <div key={title} style={abs({ alignItems: 'center', display: 'flex', gap: 30, left: 68, top: 940 - 22 + i * 96 })}>
          <MessageCircle color={TEXT} size={38} strokeWidth={2} style={iv(38, 2)} />
          <span style={{ color: TEXT, fontSize: 32 }}>{title}</span>
        </div>
      ))}
      <div style={abs({ background: 'linear-gradient(rgba(249,249,249,0), #f9f9f9 40%)', bottom: 0, height: 220, left: 0, right: 0 })} />
      <div style={abs({ alignItems: 'center', background: '#0d0d0d', borderRadius: 48, color: '#fff', display: 'flex', fontSize: 33, fontWeight: 600, gap: 18, height: 96, left: 68, padding: '0 40px', top: screenH - 1792 + 1628 })}>
        <SquarePen color="#fff" size={36} strokeWidth={2.2} style={iv(36, 2.2)} /> Chat
      </div>
      <span style={abs({ alignItems: 'center', background: '#fff', borderRadius: 99, boxShadow: '0 6px 20px rgba(0,0,0,0.08)', display: 'flex', height: 96, justifyContent: 'center', left: 476, top: screenH - 1792 + 1628, width: 96 })}>
        <Settings color={TEXT} size={40} strokeWidth={2} style={iv(40, 2)} />
      </span>
      <Tap at={C.tapPlugins} t={t} x={300} y={436} />
    </div>
  )
}

/** Empty new chat (same chrome as the conversation scenes). */
function EmptyChat({ screenH }: { screenH: number }) {
  return (
    <div style={abs({ background: '#fff', inset: 0, overflow: 'hidden' })}>
      <StatusBar />
      <TopBar />
      <span style={abs({ color: MUTED, fontSize: 40, fontWeight: 500, left: 0, right: 0, textAlign: 'center', top: 640 })}>Em que posso ajudar?</span>
      <div style={abs({ inset: 0, transform: `translateY(${screenH - 1792}px)` })}>
        <Composer frame={0} messages={[]} />
        <div style={abs({ background: TEXT, borderRadius: 99, height: 9, left: 267, top: 1764, width: 294 })} />
      </div>
    </div>
  )
}

const SectionTitle = ({ children, top }: { children: string; top: number }) => (
  <span style={abs({ alignItems: 'center', color: MUTED, display: 'flex', fontSize: 34, fontWeight: 600, gap: 10, left: 33, top: top - 22 })}>
    {children} <ChevronRight color={MUTED} size={34} strokeWidth={2.6} style={iv(34, 2.6)} />
  </span>
)

function PluginRow({ action, icon, sub, title, top }: { action: 'add' | 'more'; icon: ReactNode; sub: string; title: string; top: number }) {
  return (
    <div style={abs({ alignItems: 'center', display: 'flex', gap: 32, left: 33, right: 46, top: top - 48 })}>
      <Tile>{icon}</Tile>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color: TEXT, display: 'block', fontSize: 33 }}>{title}</span>
        <span style={{ color: MUTED, display: 'block', fontSize: 26, marginTop: 6, whiteSpace: 'nowrap' }}>{sub}</span>
      </div>
      {action === 'add' ? <Plus color="#6b6b6b" size={40} strokeWidth={2} style={iv(40, 2)} /> : <Ellipsis color="#6b6b6b" size={40} strokeWidth={2.6} style={iv(40, 2.6)} />}
    </div>
  )
}

function PluginsHeader() {
  return (
    <>
      <StatusBar />
      <svg height={26} style={abs({ left: 48, top: 127 })} viewBox="0 0 44 26" width={44}>
        <line stroke={TEXT} strokeLinecap="round" strokeWidth={4} x1={2} x2={42} y1={4} y2={4} />
        <line stroke={TEXT} strokeLinecap="round" strokeWidth={4} x1={2} x2={30} y1={22} y2={22} />
      </svg>
      <span style={abs({ alignItems: 'center', color: TEXT, display: 'flex', fontSize: 33, fontWeight: 600, gap: 22, left: 0, justifyContent: 'center', right: 0, top: 118 })}>
        Plugins <ChevronDown color="#6b6b6b" size={34} strokeWidth={2.4} style={iv(34, 2.4)} />
      </span>
    </>
  )
}

function PluginsPage({ screenH, t }: { screenH: number; t: number }) {
  const searching = t >= C.typing[0]
  const typed = 'otto'.slice(0, Math.ceil(4 * ease(t, C.typing[0], C.typing[1])))
  const pillTop = screenH - 1792 + 1628
  const pressed = t >= C.tapSearch && t < C.tapSearch + 0.15
  return (
    <div style={abs({ background: '#fff', inset: 0, overflow: 'hidden' })}>
      <PluginsHeader />
      {searching ? (
        <PluginRow action="more" icon={<OttoLogo size={60} />} sub="ERP e financeiro da sua empresa" title="Otto" top={288} />
      ) : (
        <>
          <SectionTitle top={252}>Instalados</SectionTitle>
          <div style={abs({ display: 'flex', gap: 24, left: 33, top: 325 })}>
            <Tile>
              <OttoLogo size={60} />
            </Tile>
            <Tile>
              <FigmaLike />
            </Tile>
            <Tile>
              <DriveLogo />
            </Tile>
            <Tile>
              <CloudCog color="#3d3d3d" size={48} strokeWidth={2} style={iv(48, 2)} />
            </Tile>
            <Tile>
              <CloudCog color="#3d3d3d" size={48} strokeWidth={2} style={iv(48, 2)} />
            </Tile>
            <span style={{ alignItems: 'center', background: '#ececec', borderRadius: 24, color: '#5d5d5d', display: 'flex', fontSize: 33, fontWeight: 500, height: 96, justifyContent: 'center', width: 96 }}>+5</span>
          </div>
          <SectionTitle top={508}>Populares</SectionTitle>
          <PluginRow action="add" icon={<GmailLogo />} sub="Read and manage Gmail" title="Gmail" top={628} />
          <PluginRow action="more" icon={<DriveLogo />} sub="Drive, Docs, Sheets or Slides" title="Google Drive" top={788} />
          <PluginRow action="add" icon={<HealthLogo />} sub="Explore your health data in ChatGPT" title="Health" top={948} />
          <PluginRow action="add" icon={<Github color={TEXT} size={56} strokeWidth={2} style={iv(56, 2)} />} sub="Triage PRs, issues, CI, and publish flows" title="GitHub" top={1108} />
          <SectionTitle top={1276}>Novos e imperdíveis</SectionTitle>
        </>
      )}
      <div style={abs({ background: 'linear-gradient(rgba(255,255,255,0), #fff 50%)', bottom: 0, height: 200, left: 0, right: 0 })} />
      {/* search pill (shrinks and gets a close button while searching) */}
      <div style={abs({ alignItems: 'center', background: '#fff', borderRadius: 48, boxShadow: '0 8px 30px rgba(0,0,0,0.08)', display: 'flex', gap: 22, height: 96, left: 68, padding: '0 26px 0 28px', right: searching ? 188 : 68, top: pillTop, transform: `scale(${pressed ? 0.97 : 1})` })}>
        <Search color={MUTED} size={40} strokeWidth={2} style={iv(40, 2)} />
        <span style={{ color: typed ? TEXT : MUTED, flex: 1, fontSize: 33 }}>
          {typed || 'Pesquisar plugins'}
          {t >= C.tapSearch && t < C.typing[1] + 0.3 && Math.floor(t * 4) % 2 === 0 ? <span style={{ background: BLUE, display: 'inline-block', height: 38, marginLeft: 2, verticalAlign: 'middle', width: 3 }} /> : null}
        </span>
        {searching ? (
          <span style={{ alignItems: 'center', background: '#4d4d4d', borderRadius: 99, display: 'flex', height: 42, justifyContent: 'center', width: 42 }}>
            <X color="#fff" size={26} strokeWidth={3} style={iv(26, 3)} />
          </span>
        ) : null}
      </div>
      {searching ? (
        <span style={abs({ alignItems: 'center', background: '#fff', borderRadius: 99, boxShadow: '0 8px 30px rgba(0,0,0,0.08)', display: 'flex', height: 96, justifyContent: 'center', left: 664, top: pillTop, width: 96 })}>
          <X color="#3d3d3d" size={42} strokeWidth={2} style={iv(42, 2)} />
        </span>
      ) : null}
      <div style={abs({ background: TEXT, borderRadius: 99, height: 9, left: 267, top: screenH - 28, width: 294 })} />
      <Tap at={C.tapSearch} t={t} x={300} y={pillTop + 48} />
      <Tap at={C.tapOtto} t={t} x={300} y={288} />
    </div>
  )
}

const SKILLS = ['emitir-notas-fiscais', 'classificar-despesas', 'conciliacao-bancaria']

function SkillCube() {
  return (
    <svg height={38} viewBox="0 0 32 36" width={34}>
      <path d="M16 2 L30 10 L16 18 L2 10 Z" fill="#f4a24c" />
      <path d="M2 10 L16 18 V34 L2 26 Z" fill="#e8584f" />
      <path d="M30 10 L16 18 V34 L30 26 Z" fill="#8a6cf0" />
    </svg>
  )
}

function OttoPluginPage({ screenH, t }: { screenH: number; t: number }) {
  const buttonTop = screenH - 1792 + 1606
  const pressed = t >= C.tapTest && t < C.tapTest + 0.15
  return (
    <div style={abs({ background: '#fff', inset: 0, overflow: 'hidden' })}>
      <StatusBar />
      <span style={abs({ left: 30, top: 116 })}>
        <ChevronLeft color={BLUE} size={52} strokeWidth={2.4} style={iv(52, 2.4)} />
      </span>
      <span style={abs({ color: TEXT, fontSize: 33, fontWeight: 600, left: 0, right: 0, textAlign: 'center', top: 118 })}>Otto</span>
      <span style={abs({ left: 734, top: 116 })}>
        <Settings color={BLUE} size={48} strokeWidth={2} style={iv(48, 2)} />
      </span>
      <span style={abs({ left: 40, top: 216 })}>
        <Tile size={110}>
          <OttoLogo size={70} />
        </Tile>
      </span>
      <span style={abs({ color: TEXT, fontSize: 54, fontWeight: 500, left: 40, top: 378 })}>Otto</span>
      <span style={abs({ color: '#6b6b6b', fontSize: 31, left: 40, top: 462 })}>ERP e financeiro da sua empresa</span>
      <p style={abs({ color: '#6b6b6b', fontSize: 30, left: 40, lineHeight: '44px', margin: 0, right: 40, top: 576 })}>
        Conecte o Otto ao ChatGPT para trabalhar com os dados da sua empresa: vendas, notas fiscais, despesas, banco e <span style={{ color: BLUE }}>Mais</span>
      </p>
      <span style={abs({ color: TEXT, fontSize: 32, fontWeight: 600, left: 40, top: 790 })}>Aplicativo</span>
      <div style={abs({ alignItems: 'center', display: 'flex', gap: 32, left: 40, top: 870 })}>
        <Tile>
          <OttoLogo size={58} />
        </Tile>
        <div>
          <span style={{ color: TEXT, display: 'block', fontSize: 31 }}>Otto</span>
          <span style={{ color: '#6b6b6b', display: 'block', fontSize: 31, marginTop: 6 }}>contato@suaempresa.com.br</span>
        </div>
      </div>
      <span style={abs({ color: TEXT, fontSize: 32, fontWeight: 600, left: 40, top: 1022 })}>Habilidades</span>
      {SKILLS.map((skill, i) => (
        <span key={skill} style={abs({ alignItems: 'center', border: `2px solid ${BORDER}`, borderRadius: 44, color: TEXT, display: 'flex', fontSize: 31, gap: 16, height: 84, left: 40, padding: '0 34px 0 28px', top: 1086 + i * 108 })}>
          <SkillCube /> {skill}
        </span>
      ))}
      <div style={abs({ background: 'linear-gradient(rgba(255,255,255,0), #fff 45%)', bottom: 0, height: 230, left: 0, right: 0 })} />
      <div style={abs({ alignItems: 'center', background: '#0d0d0d', borderRadius: 54, color: '#fff', display: 'flex', fontSize: 33, fontWeight: 500, height: 106, justifyContent: 'center', left: 64, right: 64, top: buttonTop, transform: `scale(${pressed ? 0.97 : 1})` })}>Testar no chat</div>
      <div style={abs({ background: TEXT, borderRadius: 99, height: 9, left: 267, top: screenH - 28, width: 294 })} />
      <Tap at={C.tapTest} t={t} x={414} y={buttonTop + 53} />
    </div>
  )
}

export function ChatGptPluginFlow({ screenH, t }: { screenH: number; t: number }) {
  const open = ease(t, C.drawer, C.drawer + 0.45)
  /** Tapping Plugins closes the menu onto the Plugins page. */
  const close = ease(t, C.tapPlugins + 0.1, C.tapPlugins + 0.5)
  const drawer = open * (1 - close)
  const page = ease(t, C.tapOtto + 0.08, C.tapOtto + 0.45)
  const toChat = ease(t, C.tapTest + 0.15, C.tapTest + 0.55)

  return (
    <div style={abs({ background: '#fff', inset: 0, overflow: 'hidden' })}>
      {/* main screen: empty chat, then the Plugins page; pushed right while the menu is open */}
      <div style={abs({ borderRadius: drawer > 0.01 ? 60 : 0, boxShadow: drawer > 0.01 ? '-10px 0 40px rgba(0,0,0,0.12)' : 'none', inset: 0, overflow: 'hidden', transform: `translateX(${drawer * 620}px)` })}>
        {t < C.tapPlugins + 0.1 ? <EmptyChat screenH={screenH} /> : <PluginsPage screenH={screenH} t={t} />}
      </div>
      {drawer > 0.01 ? (
        <div style={abs({ inset: 0, transform: `translateX(${(drawer - 1) * 620}px)`, width: 620 })}>
          <Drawer screenH={screenH} t={t} />
        </div>
      ) : null}
      {/* Otto plugin page slides in from the right */}
      {page > 0 ? (
        <div style={abs({ boxShadow: '-10px 0 40px rgba(0,0,0,0.1)', inset: 0, transform: `translateX(${(1 - page) * 828}px)` })}>
          <OttoPluginPage screenH={screenH} t={t} />
        </div>
      ) : null}
      {/* "Testar no chat" → back to an empty chat */}
      {toChat > 0 ? (
        <div style={abs({ inset: 0, opacity: toChat })}>
          <EmptyChat screenH={screenH} />
        </div>
      ) : null}
    </div>
  )
}
