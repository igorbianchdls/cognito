import {useEffect, useState, type ReactNode} from 'react'
import {AbsoluteFill, continueRender, delayRender, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion'

import {OttoAccountsPayableMobilePanel, OttoInvoiceEmissionMobilePanel} from '@/assets/remotion/compositions/OttoInvoiceChatGptTvContent'
import {IOS_REMOTION_DISPLAY_FONT_STACK, IOS_REMOTION_FONT_STACK, loadSfProFonts} from '@/assets/remotion/fonts/sfPro'

export const CHATGPT_MOBILE_EXACT_REPLICA_DURATION = 1120

const INK = '#171717'
const ICON = '#666666'
const BUBBLE = '#f3f3f3'

function SignalIcon() {
  return <svg height="30" viewBox="0 0 42 30" width="36"><rect fill="#000" height="10" rx="2" width="6" x="1" y="18" /><rect fill="#000" height="15" rx="2" width="6" x="10" y="13" /><rect fill="#bfc1c4" height="21" rx="2" width="6" x="19" y="7" /><rect fill="#bfc1c4" height="27" rx="2" width="6" x="28" y="1" /></svg>
}

function WifiIcon() {
  return <svg fill="none" height="31" viewBox="0 0 38 31" width="34"><path d="M3 10.5C12.2 2.9 25.8 2.9 35 10.5" stroke="#000" strokeLinecap="round" strokeWidth="5" /><path d="M9.5 17.2c5.5-4.6 13.5-4.6 19 0" stroke="#000" strokeLinecap="round" strokeWidth="5" /><path d="M16.2 24c1.7-1.4 3.9-1.4 5.6 0L19 27z" fill="#000" /></svg>
}

function BatteryIcon() {
  return <svg height="31" viewBox="0 0 58 31" width="58"><rect fill="#f3f3f3" height="28" rx="7" stroke="#c8c8c8" width="51" x="1" y="1.5" /><path d="M54 10v11c2.3-.6 3.5-2.2 3.5-5.5S56.3 10.6 54 10z" fill="#c8c8c8" /><rect fill="#f0cf4a" height="24" rx="5" width="44" x="3" y="3.5" /><text fill="#111" fontFamily={IOS_REMOTION_FONT_STACK} fontSize="22" fontWeight="600" textAnchor="middle" x="25.5" y="23">5</text></svg>
}

function MenuIcon() {
  return <svg fill="none" height="40" viewBox="0 0 48 40" width="48"><path d="M2 11h21M2 28h21" stroke="#111" strokeLinecap="round" strokeWidth="4" /><circle cx="34" cy="9" fill="#1687eb" r="8" /></svg>
}

function ComposeIcon() {
  return <svg fill="none" height="43" viewBox="0 0 43 43" width="43">
    <path d="M25.5 7.5H12.2a6.2 6.2 0 0 0-6.2 6.2v17.1a6.2 6.2 0 0 0 6.2 6.2h17.1a6.2 6.2 0 0 0 6.2-6.2V18" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.35" />
    <path d="m18.5 28.2 2.1-8.1L34.3 6.4a4.15 4.15 0 0 1 5.9 5.9L26.5 26z" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.35" />
  </svg>
}

function DotsIcon({color = ICON, size = 34}: {color?: string; size?: number}) {
  return <svg height={size} viewBox="0 0 40 32" width={size * 1.25}><circle cx="7" cy="16" fill={color} r="3.8" /><circle cx="20" cy="16" fill={color} r="3.8" /><circle cx="33" cy="16" fill={color} r="3.8" /></svg>
}

function CopyIcon() {
  return <svg fill="none" height="32" viewBox="0 0 34 34" width="32"><rect height="21" rx="5" stroke={ICON} strokeWidth="3.7" width="21" x="10" y="3" /><rect fill="#fff" height="21" rx="5" stroke={ICON} strokeWidth="3.7" width="21" x="3" y="10" /></svg>
}

function ThumbIcon({down = false}: {down?: boolean}) {
  return <svg fill="none" height="27" style={{transform: down ? 'scaleY(-1)' : undefined}} viewBox="0 0 35 35" width="27"><path d="M12 15 17 5c.8-1.7 3.2-2.1 4.5-.8.8.8 1.1 2 .8 3.1L21 13h6.7c3.4 0 5.8 3.3 4.8 6.5l-2 7A4.8 4.8 0 0 1 26 30H13" stroke={ICON} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" /><rect height="16" rx="3" stroke={ICON} strokeWidth="3.5" width="8" x="3" y="14" /></svg>
}

function ShareIcon() {
  return <svg fill="none" height="33" viewBox="0 0 36 36" width="33"><path d="M18 3v21M11 10l7-7 7 7" stroke={ICON} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" /><path d="M8 17H5v13h26V17h-3" stroke={ICON} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" /></svg>
}

function PlusIcon() {
  return <svg fill="none" height="42" viewBox="0 0 42 42" width="42"><path d="M21 5v32M5 21h32" stroke="#111" strokeLinecap="round" strokeWidth="4" /></svg>
}

function MicrophoneIcon() {
  return <svg fill="none" height="43" viewBox="0 0 42 48" width="38"><rect height="27" rx="10" stroke="#050505" strokeWidth="4" width="17" x="12.5" y="2" /><path d="M5 22c0 9 7.2 16 16 16s16-7 16-16M21 38v8M14 46h14" stroke="#050505" strokeLinecap="round" strokeWidth="4" /></svg>
}

function VoiceIcon() {
  const bars = [16, 29, 39, 25, 13]
  return <svg fill="none" height="45" viewBox="0 0 50 45" width="50">{bars.map((height, index) => <rect fill="#fff" height={height} key={height} rx="2.5" width="5" x={5 + index * 10} y={(45 - height) / 2} />)}</svg>
}

function ActionRow({top}: {top: number}) {
  return <div style={{height: 34, left: 34, position: 'absolute', top, width: 220}}>
    <span style={{display: 'flex', left: 0, position: 'absolute', top: 0}}><CopyIcon /></span>
    <span style={{display: 'flex', left: 57, position: 'absolute', top: 2}}><ThumbIcon /></span>
    <span style={{display: 'flex', left: 88, position: 'absolute', top: 2}}><ThumbIcon down /></span>
    <span style={{display: 'flex', left: 123, position: 'absolute', top: 0}}><ShareIcon /></span>
    <span style={{display: 'flex', left: 181, position: 'absolute', top: 1}}><DotsIcon size={30} /></span>
  </div>
}

function UserBubble({children, height, right = 32, top, width}: {children: ReactNode; height: number; right?: number; top: number; width: number}) {
  return <div style={{alignItems: 'center', background: BUBBLE, borderRadius: 46, boxSizing: 'border-box', display: 'flex', fontSize: 32, fontWeight: 400, height, letterSpacing: '-0.01em', lineHeight: 1.48, padding: '0 30px', position: 'absolute', right, top, width}}>{children}</div>
}

function AssistantText({children, top}: {children: ReactNode; top: number}) {
  return <div style={{fontSize: 34, fontWeight: 400, left: 33, letterSpacing: '-0.018em', lineHeight: 1.3, position: 'absolute', top}}>{children}</div>
}

function TypedAssistantText({end, start, text, top}: {end?: number; start: number; text: string; top: number}) {
  const frame = useCurrentFrame()
  const visibleCharacters = Math.max(0, Math.min(text.length, Math.floor((frame - start + 1) * 5)))
  const opacity = end === undefined ? 1 : interpolate(frame, [end, end + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})

  return <div style={{opacity}}><AssistantText top={top}>{text.slice(0, visibleCharacters)}</AssistantText></div>
}

function TypedEmojiCrop({boundaries, height, left, sourceX, sourceY, start, top, width}: {boundaries: number[]; height: number; left: number; sourceX: number; sourceY: number; start: number; top: number; width: number}) {
  const frame = useCurrentFrame()
  const visibleCharacters = Math.max(0, Math.min(boundaries.length, Math.floor(frame - start + 1)))
  const visibleWidth = visibleCharacters === 0 ? 0 : boundaries[visibleCharacters - 1]

  return <div style={{height, left, overflow: 'hidden', position: 'absolute', top, width: visibleWidth}}>
    <Img src={staticFile('remotion/references/chatgpt-mobile-exact-reference.png')} style={{height: 1792, left: -sourceX, maxWidth: 'none', position: 'absolute', top: -sourceY, width: 828}} />
  </div>
}

function Reveal({children, start}: {children: ReactNode; start: number}) {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  const entrance = spring({
    config: {damping: 22, mass: 0.7, stiffness: 180},
    delay: start,
    fps,
    frame,
  })
  const opacity = interpolate(frame, [start, start + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return <AbsoluteFill style={{opacity, pointerEvents: 'none', transform: `translateY(${(1 - entrance) * 14}px)`}}>{children}</AbsoluteFill>
}

function ConversationTrack({children}: {children: ReactNode}) {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  const scrollStep = (start: number) => spring({
    config: {damping: 26, mass: 0.85, stiffness: 120},
    delay: start,
    fps,
    frame,
  })
  const previousConversationScroll = -340 * (scrollStep(218) + scrollStep(273) + scrollStep(328) + scrollStep(383) + scrollStep(438))
  const invoiceEntranceScroll = -520 * scrollStep(480)
  const invoiceGrowthScroll = -75 * ([529, 553, 577, 601, 625, 649, 673].reduce((total, start) => total + scrollStep(start), 0))
  const invoiceCompletionScroll = -200 * scrollStep(710)
  const accountsPromptScroll = -450 * scrollStep(760)
  const accountsEntranceScroll = -500 * scrollStep(800)
  const accountsGrowthScroll = -75 * ([849, 873, 897, 921, 945, 969, 993].reduce((total, start) => total + scrollStep(start), 0))
  const accountsCompletionScroll = -200 * scrollStep(1030)
  const scrollY = previousConversationScroll + invoiceEntranceScroll + invoiceGrowthScroll + invoiceCompletionScroll + accountsPromptScroll + accountsEntranceScroll + accountsGrowthScroll + accountsCompletionScroll

  return <AbsoluteFill style={{clipPath: 'inset(230px 0 188px 0)', zIndex: 1}}>
    <AbsoluteFill style={{transform: `translateY(${scrollY}px)`}}>{children}</AbsoluteFill>
  </AbsoluteFill>
}

export function ChatGptMobileExactReplica() {
  const [fontReady, setFontReady] = useState(false)
  const [fontHandle] = useState(() => delayRender('Carregando SF Pro'))

  useEffect(() => {
    let active = true

    Promise.resolve(loadSfProFonts())
      .then(async () => {
        if (typeof document !== 'undefined') await document.fonts.ready
        if (active) setFontReady(true)
      })
      .finally(() => continueRender(fontHandle))

    return () => {
      active = false
    }
  }, [fontHandle])

  if (!fontReady) return <AbsoluteFill style={{background: '#fff'}} />

  return <AbsoluteFill className="chatgpt-mobile-exact" style={{background: '#fff', color: INK, fontFamily: IOS_REMOTION_FONT_STACK, overflow: 'hidden'}}>
    <style>{`
      .chatgpt-mobile-exact,
      .chatgpt-mobile-exact * {
        font-family: ${IOS_REMOTION_FONT_STACK} !important;
      }
      .chatgpt-mobile-exact .chatgpt-mobile-display,
      .chatgpt-mobile-exact .chatgpt-mobile-invoice-title {
        font-family: ${IOS_REMOTION_DISPLAY_FONT_STACK} !important;
      }
      .chatgpt-mobile-exact .chatgpt-mobile-invoice-title {
        font-size: 40px !important;
        font-weight: 650 !important;
        letter-spacing: -0.025em !important;
        line-height: 1.03 !important;
      }
    `}</style>
    <div style={{background: '#fff', height: 205, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 20}}>
      <div className="chatgpt-mobile-display" style={{fontFamily: IOS_REMOTION_DISPLAY_FONT_STACK, fontSize: 35, fontWeight: 600, left: 58, letterSpacing: '0.01em', position: 'absolute', top: 29}}>02:36</div>
      <div style={{alignItems: 'center', display: 'flex', gap: 7, position: 'absolute', right: 34, top: 36}}><SignalIcon /><WifiIcon /><BatteryIcon /></div>
      <div style={{left: 58, position: 'absolute', top: 121}}><MenuIcon /></div>
      <div style={{position: 'absolute', right: 137, top: 121}}><ComposeIcon /></div>
      <div style={{position: 'absolute', right: 56, top: 124}}><DotsIcon color="#050505" size={37} /></div>
    </div>

    <ConversationTrack>
      <Reveal start={10}><UserBubble height={92} top={245} width={582}>Pergunte pra mim o que eu quero</UserBubble></Reveal>
      <TypedAssistantText start={32} text="O que você quer?" top={409} />
      <Reveal start={37}><ActionRow top={482} /></Reveal>

      <Reveal start={65}><UserBubble height={92} top={585} width={524}>Pergunte cm um emoii no final</UserBubble></Reveal>
      <TypedAssistantText start={87} text="O que você quer?" top={750} />
      <TypedEmojiCrop boundaries={[46]} height={42} left={308} sourceX={308} sourceY={750} start={90} top={750} width={46} />
      <Reveal start={93}><ActionRow top={822} /></Reveal>

      <Reveal start={120}><UserBubble height={144} top={925} width={491}><span>Pergunte com vários emojis<br />no final</span></UserBubble></Reveal>
      <TypedAssistantText start={142} text="O que você quer?" top={1145} />
      <TypedEmojiCrop boundaries={[50, 96, 143, 185, 234, 279, 326, 374, 421, 481]} height={44} left={307} sourceX={307} sourceY={1138} start={145} top={1138} width={481} />
      <Reveal start={157}><ActionRow top={1217} /></Reveal>

      <Reveal start={175}><UserBubble height={90} top={1317} width={286}>Menos emojis</UserBubble></Reveal>
      <TypedAssistantText start={197} text="O que você quer?" top={1486} />
      <TypedEmojiCrop boundaries={[50, 93, 138]} height={44} left={308} sourceX={308} sourceY={1480} start={200} top={1480} width={138} />
      <Reveal start={205}><ActionRow top={1554} /></Reveal>

      <Reveal start={230}><UserBubble height={90} top={1657} width={330}>Agora sem emojis</UserBubble></Reveal>
      <TypedAssistantText start={252} text="O que você quer?" top={1826} />
      <Reveal start={257}><ActionRow top={1894} /></Reveal>

      <Reveal start={285}><UserBubble height={92} top={1997} width={535}>Pergunte com mais educação</UserBubble></Reveal>
      <TypedAssistantText start={307} text="O que você gostaria?" top={2166} />
      <Reveal start={312}><ActionRow top={2234} /></Reveal>

      <Reveal start={340}><UserBubble height={92} top={2337} width={450}>Agora seja mais direto</UserBubble></Reveal>
      <TypedAssistantText start={362} text="Como posso ajudar?" top={2506} />
      <Reveal start={367}><ActionRow top={2574} /></Reveal>

      <Reveal start={395}><UserBubble height={90} top={2677} width={360}>Perfeito, obrigado</UserBubble></Reveal>
      <TypedAssistantText start={417} text="Por nada!" top={2846} />
      <Reveal start={421}><ActionRow top={2914} /></Reveal>

      <Reveal start={450}><UserBubble height={144} top={3017} width={690}><span>Chat, emita as notas fiscais das vendas de hoje e envie para cada cliente.</span></UserBubble></Reveal>
      <TypedAssistantText start={472} text="Perfeito! Vou emitir as notas fiscais das oito vendas." top={3237} />
      <OttoInvoiceEmissionMobilePanel start={492} top={3335} />

      <TypedAssistantText start={728} text="Pronto! As 8 notas fiscais foram emitidas e enviadas." top={4350} />
      <Reveal start={743}><ActionRow top={4500} /></Reveal>

      <Reveal start={770}><UserBubble height={144} top={4595} width={690}><span>Agora busque as contas a pagar deste mês e organize por vencimento.</span></UserBubble></Reveal>
      <TypedAssistantText end={1022} start={792} text="Perfeito! Vou buscar e organizar suas contas a pagar." top={4815} />
      <OttoAccountsPayableMobilePanel start={812} top={4913} />

      <TypedAssistantText start={1048} text="Pronto! Encontrei e organizei as 8 contas a pagar." top={5935} />
      <Reveal start={1063}><ActionRow top={6085} /></Reveal>
    </ConversationTrack>

    <div style={{background: '#fff', bottom: 0, height: 188, left: 0, position: 'absolute', right: 0, zIndex: 20}}>
      <div style={{alignItems: 'center', background: '#f2f2f2', borderRadius: 52, bottom: 68, display: 'flex', height: 96, left: 68, padding: '0 16px 0 27px', position: 'absolute', right: 68}}>
        <PlusIcon />
        <span style={{color: '#969696', fontSize: 32, fontWeight: 400, letterSpacing: '-0.01em', marginLeft: 28}}>Perguntar ao ChatGPT</span>
        <span style={{marginLeft: 'auto'}}><MicrophoneIcon /></span>
        <span style={{alignItems: 'center', background: '#000', borderRadius: 999, display: 'flex', height: 64, justifyContent: 'center', marginLeft: 45, width: 64}}><VoiceIcon /></span>
      </div>
      <div style={{background: '#000', borderRadius: 999, bottom: 15, height: 11, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 296}} />
    </div>
  </AbsoluteFill>
}
