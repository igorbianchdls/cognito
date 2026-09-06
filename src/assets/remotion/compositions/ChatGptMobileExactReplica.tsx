import type {ReactNode} from 'react'
import {AbsoluteFill, Img, staticFile} from 'remotion'

import {IOS_REMOTION_DISPLAY_FONT_STACK, IOS_REMOTION_FONT_STACK, loadSfProFonts} from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const CHATGPT_MOBILE_EXACT_REPLICA_DURATION = 90

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
  return <svg fill="none" height="43" viewBox="0 0 43 43" width="43"><path d="M26 7H11a6 6 0 0 0-6 6v19a6 6 0 0 0 6 6h19a6 6 0 0 0 6-6V18" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5" /><path d="m19 27 2-8L34.7 5.3a4.4 4.4 0 0 1 6.2 6.2L27 25z" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5" /></svg>
}

function DotsIcon({color = ICON, size = 34}: {color?: string; size?: number}) {
  return <svg height={size} viewBox="0 0 40 32" width={size * 1.25}><circle cx="7" cy="16" fill={color} r="3.8" /><circle cx="20" cy="16" fill={color} r="3.8" /><circle cx="33" cy="16" fill={color} r="3.8" /></svg>
}

function CopyIcon() {
  return <svg fill="none" height="32" viewBox="0 0 34 34" width="32"><rect height="21" rx="5" stroke={ICON} strokeWidth="3.7" width="21" x="10" y="3" /><rect fill="#fff" height="21" rx="5" stroke={ICON} strokeWidth="3.7" width="21" x="3" y="10" /></svg>
}

function ThumbIcon({down = false}: {down?: boolean}) {
  return <svg fill="none" height="32" style={{transform: down ? 'scaleY(-1)' : undefined}} viewBox="0 0 35 35" width="32"><path d="M12 15 17 5c.8-1.7 3.2-2.1 4.5-.8.8.8 1.1 2 .8 3.1L21 13h6.7c3.4 0 5.8 3.3 4.8 6.5l-2 7A4.8 4.8 0 0 1 26 30H13" stroke={ICON} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" /><rect height="16" rx="3" stroke={ICON} strokeWidth="3.5" width="8" x="3" y="14" /></svg>
}

function ShareIcon() {
  return <svg fill="none" height="33" viewBox="0 0 36 36" width="33"><path d="M18 3v21M11 10l7-7 7 7" stroke={ICON} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" /><path d="M8 17H5v13h26V17h-3" stroke={ICON} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" /></svg>
}

function DownIcon() {
  return <svg fill="none" height="38" viewBox="0 0 40 40" width="38"><path d="M20 6v26M10 22l10 10 10-10" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" /></svg>
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
  return <div style={{alignItems: 'center', display: 'flex', gap: 22, left: 34, position: 'absolute', top}}><CopyIcon /><div style={{display: 'flex', width: 47}}><ThumbIcon /><span style={{display: 'flex', marginLeft: -13}}><ThumbIcon down /></span></div><ShareIcon /><DotsIcon size={30} /></div>
}

function UserBubble({children, height, right = 32, top, width}: {children: ReactNode; height: number; right?: number; top: number; width: number}) {
  return <div style={{alignItems: 'center', background: BUBBLE, borderRadius: 46, boxSizing: 'border-box', display: 'flex', fontSize: 32, fontWeight: 400, height, lineHeight: 1.48, padding: '0 30px', position: 'absolute', right, top, width}}>{children}</div>
}

function AssistantText({children, top}: {children: ReactNode; top: number}) {
  return <div style={{fontSize: 34, fontWeight: 400, left: 33, letterSpacing: '-0.018em', lineHeight: 1.3, position: 'absolute', top}}>{children}</div>
}

function EmojiCrop({height, left, sourceX, sourceY, top, width}: {height: number; left: number; sourceX: number; sourceY: number; top: number; width: number}) {
  return <div style={{background: '#fff', height, left, overflow: 'hidden', position: 'absolute', top, width}}><Img src={staticFile('remotion/references/chatgpt-mobile-exact-reference.png')} style={{height: 1792, left: -sourceX, maxWidth: 'none', position: 'absolute', top: -sourceY, width: 828}} /></div>
}

export function ChatGptMobileExactReplica() {
  return <AbsoluteFill style={{background: '#fff', color: INK, fontFamily: IOS_REMOTION_FONT_STACK, overflow: 'hidden'}}>
    <div style={{fontFamily: IOS_REMOTION_DISPLAY_FONT_STACK, fontSize: 35, fontWeight: 600, left: 58, letterSpacing: '0.01em', position: 'absolute', top: 29}}>02:36</div>
    <div style={{alignItems: 'center', display: 'flex', gap: 7, position: 'absolute', right: 34, top: 36}}><SignalIcon /><WifiIcon /><BatteryIcon /></div>

    <div style={{left: 58, position: 'absolute', top: 121}}><MenuIcon /></div>
    <div style={{position: 'absolute', right: 137, top: 121}}><ComposeIcon /></div>
    <div style={{position: 'absolute', right: 56, top: 124}}><DotsIcon color="#050505" size={37} /></div>

    <div style={{color: '#989898', fontSize: 27, fontWeight: 600, height: 13, left: 0, overflow: 'hidden', position: 'absolute', textAlign: 'center', top: 179, width: '100%'}}><div style={{transform: 'translateY(-14px)'}}>sexta-feira 17:00</div></div>

    <UserBubble height={92} top={245} width={582}>Pergunte pra mim o que eu quero</UserBubble>
    <AssistantText top={409}>O que você quer?</AssistantText>
    <ActionRow top={482} />

    <UserBubble height={92} top={585} width={524}>Pergunte cm um emoii no final</UserBubble>
    <AssistantText top={750}>O que você quer?</AssistantText>
    <EmojiCrop height={42} left={308} sourceX={308} sourceY={750} top={750} width={46} />
    <ActionRow top={822} />

    <UserBubble height={144} top={925} width={491}><span>Pergunte com vários emojis<br />no final</span></UserBubble>
    <AssistantText top={1145}>O que você quer?</AssistantText>
    <EmojiCrop height={44} left={307} sourceX={307} sourceY={1138} top={1138} width={481} />
    <ActionRow top={1217} />

    <UserBubble height={90} top={1317} width={286}>Menos emojis</UserBubble>
    <AssistantText top={1486}>O que você quer?</AssistantText>
    <EmojiCrop height={44} left={308} sourceX={308} sourceY={1480} top={1480} width={138} />
    <ActionRow top={1554} />

    <div style={{alignItems: 'center', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 999, boxShadow: '0 4px 15px rgba(0,0,0,.16)', display: 'flex', height: 68, justifyContent: 'center', left: '50%', position: 'absolute', top: 1533, transform: 'translateX(-50%)', width: 68}}><DownIcon /></div>

    <div style={{alignItems: 'center', background: '#f2f2f2', borderRadius: 52, bottom: 68, display: 'flex', height: 96, left: 68, padding: '0 16px 0 27px', position: 'absolute', right: 68}}>
      <PlusIcon />
      <span style={{color: '#969696', fontSize: 32, fontWeight: 400, marginLeft: 28}}>Perguntar ao ChatGPT</span>
      <span style={{marginLeft: 'auto'}}><MicrophoneIcon /></span>
      <span style={{alignItems: 'center', background: '#000', borderRadius: 999, display: 'flex', height: 64, justifyContent: 'center', marginLeft: 45, width: 64}}><VoiceIcon /></span>
    </div>
    <div style={{background: '#000', borderRadius: 999, bottom: 15, height: 11, left: '50%', position: 'absolute', transform: 'translateX(-50%)', width: 296}} />
  </AbsoluteFill>
}
