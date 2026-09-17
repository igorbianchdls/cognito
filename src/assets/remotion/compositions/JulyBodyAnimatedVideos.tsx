import type {ReactNode} from 'react'
import {Bot, Check, Landmark, MessageCircle, ReceiptText, RefreshCw, Tags, WalletCards} from 'lucide-react'
import {AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion'

import {IOS_REMOTION_FONT_STACK, loadSfProFonts} from '@/assets/remotion/fonts/sfPro'

loadSfProFonts()

export const JULY_BODY_VIDEO_1_DURATION = 1091
export const JULY_BODY_VIDEO_2_DURATION = 904

const FONT = IOS_REMOTION_FONT_STACK
const GREEN = '#16845b'
const INK = '#111111'

type CaptionCue = {
  end: number
  start: number
  text: string
}

const firstCaptions: CaptionCue[] = [
  {start: 0, end: 97, text: 'Essa IA está deixando os contadores preocupados.'},
  {start: 97, end: 150, text: 'O nome dela é Otto.'},
  {start: 150, end: 299, text: 'Ela permite emitir notas fiscais diretamente pelo ChatGPT e pelo Claude.'},
  {start: 299, end: 403, text: 'O Otto é um sistema completo de gestão e nota fiscal.'},
  {start: 403, end: 537, text: 'Ele centraliza vendas, notas fiscais, financeiro e contabilidade.'},
  {start: 537, end: 573, text: 'E não para por aí.'},
  {start: 573, end: 646, text: 'O Otto também concilia movimentações bancárias,'},
  {start: 646, end: 685, text: 'classifica despesas,'},
  {start: 685, end: 740, text: 'controla contas a pagar e a receber'},
  {start: 740, end: 790, text: 'e ainda cobra quem está em atraso.'},
  {start: 790, end: 837, text: 'Tudo isso sem planilhas,'},
  {start: 837, end: 895, text: 'sem ficar pulando entre vários sistemas'},
  {start: 895, end: 942, text: 'e sem trabalho manual.'},
  {start: 942, end: 974, text: 'Quer conhecer?'},
  {start: 974, end: 1032, text: 'Comenta Otto aqui embaixo.'},
  {start: 1032, end: 1091, text: 'Que eu te chamo no direct.'},
]

const secondCaptions: CaptionCue[] = [
  {start: 0, end: 170, text: 'Se liga nisso aqui. Esse é o Otto, um funcionário de IA que cuida do financeiro da sua empresa.'},
  {start: 170, end: 222, text: 'E não para por aí.'},
  {start: 222, end: 371, text: 'Ele registra vendas, controla contas a pagar e a receber e emite notas fiscais.'},
  {start: 371, end: 454, text: 'Faz conciliação bancária, classifica despesas e ainda cobra seus clientes.'},
  {start: 454, end: 650, text: 'E o melhor: funciona diretamente dentro do seu ChatGPT, sem planilhas e sem trabalho manual.'},
  {start: 650, end: 786, text: 'Quer colocar o financeiro da sua empresa nos trilhos, de um jeito simples?'},
  {start: 786, end: 904, text: 'Comenta Otto aqui embaixo, que eu te chamo no direct.'},
]

function p(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
}

function TopBrand() {
  return (
    <div style={{alignItems: 'center', background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(255,255,255,0.72)', borderRadius: 7, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', display: 'flex', gap: 10, left: 34, padding: '10px 14px', position: 'absolute', top: 28}}>
      <Img src={staticFile('logoOttoIcon.svg')} style={{height: 25, width: 25}} />
      <div><strong style={{display: 'block', fontSize: 15, fontWeight: 750}}>Otto</strong><span style={{color: '#747474', display: 'block', fontSize: 10, marginTop: 1}}>Financeiro operado por IA</span></div>
    </div>
  )
}

function CaptionBand({cues}: {cues: CaptionCue[]}) {
  const frame = useCurrentFrame()
  const cue = cues.find((item) => frame >= item.start && frame < item.end) ?? cues[cues.length - 1]
  const enter = p(frame, cue.start, cue.start + 8)
  const exit = p(frame, cue.end - 7, cue.end, [1, 0])
  const words = cue.text.split(' ')
  const revealed = Math.ceil(p(frame, cue.start + 1, Math.min(cue.end - 8, cue.start + 22), [0, words.length]))

  return (
    <div style={{bottom: 26, left: 38, opacity: Math.min(enter, exit), position: 'absolute', right: 38, transform: `translateY(${(1 - enter) * 10}px)`, zIndex: 20}}>
      <div style={{background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,0.78)', borderRadius: 8, boxShadow: '0 18px 50px rgba(0,0,0,0.18)', color: INK, fontSize: 31, fontWeight: 680, lineHeight: 1.16, padding: '18px 24px', textAlign: 'center'}}>
        {words.map((word, index) => <span key={`${word}-${index}`} style={{opacity: index < revealed ? 1 : 0.18}}>{word}{index < words.length - 1 ? ' ' : ''}</span>)}
      </div>
    </div>
  )
}

function FloatingCard({children, end, side = 'right', start, top = 120, width = 276}: {children: ReactNode; end: number; side?: 'left' | 'right'; start: number; top?: number; width?: number}) {
  const frame = useCurrentFrame()
  const enter = p(frame, start, start + 16)
  const exit = p(frame, end - 12, end, [1, 0])

  return (
    <div style={{background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 8, boxShadow: '0 20px 56px rgba(0,0,0,0.18)', opacity: Math.min(enter, exit), padding: 18, position: 'absolute', top, transform: `translateX(${(1 - enter) * (side === 'right' ? 24 : -24)}px)`, width, ...(side === 'right' ? {right: 34} : {left: 34})}}>
      {children}
    </div>
  )
}

function ProductLogo({label, src}: {label: string; src: string}) {
  return <div style={{alignItems: 'center', background: '#f5f5f5', border: '1px solid #e7e7e7', borderRadius: 7, display: 'flex', gap: 9, padding: '10px 12px'}}><Img src={staticFile(src)} style={{height: 24, objectFit: 'contain', width: 24}} /><strong style={{fontSize: 13}}>{label}</strong></div>
}

const operationItems = [
  {icon: RefreshCw, label: 'Conciliação bancária'},
  {icon: Tags, label: 'Classificação de despesas'},
  {icon: WalletCards, label: 'Contas a pagar e receber'},
  {icon: MessageCircle, label: 'Cobranças automáticas'},
]

function OperationsCard({end, start}: {end: number; start: number}) {
  const frame = useCurrentFrame()
  return (
    <FloatingCard end={end} side="left" start={start} top={118} width={292}>
      <span style={{color: '#6b6b6b', display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 11, textTransform: 'uppercase'}}>Operações automatizadas</span>
      <div style={{display: 'grid', gap: 8}}>
        {operationItems.map((item, index) => {
          const Icon = item.icon
          const show = p(frame, start + 12 + index * 10, start + 24 + index * 10)
          return <div key={item.label} style={{alignItems: 'center', display: 'grid', gap: 10, gridTemplateColumns: '27px 1fr 18px', opacity: show, transform: `translateY(${(1 - show) * 7}px)`}}><span style={{alignItems: 'center', background: '#ecf6f1', borderRadius: 6, color: GREEN, display: 'flex', height: 27, justifyContent: 'center', width: 27}}><Icon size={15} strokeWidth={2.1} /></span><span style={{fontSize: 12.5, fontWeight: 650}}>{item.label}</span><Check color={GREEN} size={15} strokeWidth={2.4} /></div>
        })}
      </div>
    </FloatingCard>
  )
}

function IntegrationsCard({end, start}: {end: number; start: number}) {
  return (
    <FloatingCard end={end} start={start} top={122} width={254}>
      <span style={{color: '#6b6b6b', display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase'}}>Direto na conversa</span>
      <div style={{display: 'grid', gap: 8}}><ProductLogo label="ChatGPT" src="gptLogo.svg" /><ProductLogo label="Claude" src="claudeLogo.svg" /></div>
      <div style={{alignItems: 'center', color: GREEN, display: 'flex', fontSize: 11.5, fontWeight: 700, gap: 6, marginTop: 11}}><ReceiptText size={15} />Notas fiscais integradas</div>
    </FloatingCard>
  )
}

function CleanWorkflowCard({end, start}: {end: number; start: number}) {
  return (
    <FloatingCard end={end} start={start} top={128} width={260}>
      <div style={{alignItems: 'center', display: 'flex', gap: 9}}><span style={{alignItems: 'center', background: '#ecf6f1', borderRadius: 7, color: GREEN, display: 'flex', height: 34, justifyContent: 'center', width: 34}}><Bot size={19} /></span><div><strong style={{display: 'block', fontSize: 14}}>Tudo centralizado</strong><span style={{color: '#777', fontSize: 11}}>Converse. A Otto executa.</span></div></div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 13}}>{['Sem planilhas', 'Sem retrabalho', 'Sem trocar de sistema'].map((label) => <span key={label} style={{background: '#f3f4f3', borderRadius: 6, color: '#444', fontSize: 10.5, fontWeight: 650, padding: '7px 8px'}}>{label}</span>)}</div>
    </FloatingCard>
  )
}

function IntroCard({end, start}: {end: number; start: number}) {
  return (
    <FloatingCard end={end} start={start} top={128} width={260}>
      <div style={{alignItems: 'center', display: 'flex', gap: 11}}><span style={{alignItems: 'center', background: '#111', borderRadius: 7, color: '#fff', display: 'flex', height: 40, justifyContent: 'center', width: 40}}><Landmark size={21} /></span><div><span style={{color: '#777', display: 'block', fontSize: 11}}>Funcionário de IA</span><strong style={{display: 'block', fontSize: 18}}>Financeiro Otto</strong></div></div>
      <div style={{background: '#ecf6f1', borderRadius: 6, color: GREEN, fontSize: 11.5, fontWeight: 700, marginTop: 13, padding: '9px 10px'}}>Operando sua empresa agora</div>
    </FloatingCard>
  )
}

function CtaCard({end, start}: {end: number; start: number}) {
  const frame = useCurrentFrame()
  const enter = p(frame, start, start + 18)
  const exit = p(frame, end - 10, end, [1, 0])
  return (
    <div style={{alignItems: 'center', background: '#111111', borderRadius: 8, boxShadow: '0 22px 58px rgba(0,0,0,0.28)', color: '#fff', display: 'flex', gap: 13, left: '50%', opacity: Math.min(enter, exit), padding: '14px 18px', position: 'absolute', top: 38, transform: `translateX(-50%) scale(${0.94 + enter * 0.06})`, whiteSpace: 'nowrap'}}>
      <Img src={staticFile('logoOttoIcon.svg')} style={{filter: 'brightness(0) invert(1)', height: 26, width: 26}} />
      <span style={{fontSize: 15, fontWeight: 650}}>Comente <strong style={{color: '#c9f227'}}>OTTO</strong> para conhecer</span>
    </div>
  )
}

function JulyBodyVideo({duration, source, variant}: {duration: number; source: string; variant: 1 | 2}) {
  const frame = useCurrentFrame()
  const zoom = 1.015 + Math.sin((frame / duration) * Math.PI) * 0.018
  const cues = variant === 1 ? firstCaptions : secondCaptions

  return (
    <AbsoluteFill style={{background: '#111', color: INK, fontFamily: FONT, overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile(source)} style={{height: '100%', objectFit: 'cover', objectPosition: 'center 38%', transform: `scale(${zoom})`, width: '100%'}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,0,0,0.18), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.18))'}} />
      <TopBrand />

      {variant === 1 ? <>
        <Sequence from={0} durationInFrames={150}><IntroCard end={150} start={0} /></Sequence>
        <Sequence from={145} durationInFrames={175}><IntegrationsCard end={175} start={0} /></Sequence>
        <Sequence from={295} durationInFrames={280}><FloatingCard end={280} side="left" start={0} top={120} width={274}><span style={{color: '#777', display: 'block', fontSize: 11}}>Sistema completo</span><strong style={{display: 'block', fontSize: 20, marginTop: 4}}>Gestão + nota fiscal</strong><div style={{color: GREEN, fontSize: 12, fontWeight: 700, marginTop: 10}}>Vendas · Financeiro · Contabilidade</div></FloatingCard></Sequence>
        <Sequence from={570} durationInFrames={235}><OperationsCard end={235} start={0} /></Sequence>
        <Sequence from={785} durationInFrames={170}><CleanWorkflowCard end={170} start={0} /></Sequence>
        <Sequence from={940} durationInFrames={151}><CtaCard end={151} start={0} /></Sequence>
      </> : <>
        <Sequence from={0} durationInFrames={180}><IntroCard end={180} start={0} /></Sequence>
        <Sequence from={165} durationInFrames={305}><OperationsCard end={305} start={0} /></Sequence>
        <Sequence from={445} durationInFrames={220}><IntegrationsCard end={220} start={0} /></Sequence>
        <Sequence from={520} durationInFrames={150}><CleanWorkflowCard end={150} start={0} /></Sequence>
        <Sequence from={645} durationInFrames={259}><CtaCard end={259} start={0} /></Sequence>
      </>}

      <CaptionBand cues={cues} />
    </AbsoluteFill>
  )
}

export function JulyBodyAnimatedVideo1() {
  return <JulyBodyVideo duration={JULY_BODY_VIDEO_1_DURATION} source="remotion/body-july/July1Video.mp4" variant={1} />
}

export function JulyBodyAnimatedVideo2() {
  return <JulyBodyVideo duration={JULY_BODY_VIDEO_2_DURATION} source="remotion/body-july/July2Video.mp4" variant={2} />
}
