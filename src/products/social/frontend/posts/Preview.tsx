'use client'

// How the post will look on each network: Instagram Reels, Feed, Story and TikTok.
import { useState } from 'react'
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Music2, Plus, Send, Share2 } from 'lucide-react'
import type { DFile } from '@/products/editor/frontend/spaces/store'
import { Thumb } from '@/products/editor/frontend/spaces/Thumb'
import { IG_VISIBLE, networksOf } from './rules'
import { type PostFormat } from './data'
import { getAccounts } from './accounts'
import p from './posts.module.css'

type View = 'ig-reel' | 'ig-feed' | 'ig-story' | 'tiktok'
const viewLabel: Record<View, string> = { 'ig-reel': 'Reels', 'ig-feed': 'Feed', 'ig-story': 'Story', tiktok: 'TikTok' }

export function PostPreview({ files, caption, accountIds, format }: { files: DFile[]; caption: string; accountIds: string[]; format: PostFormat }) {
  const nets = networksOf(accountIds)
  const views: View[] = [...(nets.includes('instagram') ? [format === 'feed' ? 'ig-feed' : format === 'story' ? 'ig-story' : 'ig-reel'] as View[] : []), ...(nets.includes('tiktok') ? ['tiktok'] as View[] : [])]
  const [pick, setPick] = useState<View | null>(null)
  const view = pick && views.includes(pick) ? pick : views[0] ?? 'ig-reel'
  const handle = (net: 'instagram' | 'tiktok') => getAccounts().find(a => a.network === net && accountIds.includes(a.id))?.handle ?? '@sua.conta'
  const [slide, setSlide] = useState(0)
  const current = files[Math.min(slide, Math.max(0, files.length - 1))]
  const media = current ? <Thumb file={{ ...current, duration: undefined }} showKind={false} className={p.media} /> : <span className={p.mediaEmpty}>Escolha um arquivo</span>
  const text = caption.trim() || 'A legenda aparece aqui.'
  const short = text.length > IG_VISIBLE ? text.slice(0, IG_VISIBLE).trimEnd() : text
  return <div className={p.previewWrap}>
    {views.length > 1 && <div className={p.viewTabs}>{views.map(v => <button key={v} className={v === view ? p.viewOn : ''} onClick={() => setPick(v)}>{viewLabel[v]}</button>)}</div>}
    <div className={p.phone}><div className={`${p.screen} ${view === 'ig-feed' ? p.screenFeed : ''}`}>
      {view === 'ig-feed' ? <div className={p.feed}>
        <div className={p.feedTop}><b>Instagram</b><span><Heart size={18} /><Send size={18} /></span></div>
        <div className={p.feedHead}><span className={p.avatar}>O</span><b>{handle('instagram').replace('@', '')}</b><MoreHorizontal size={16} /></div>
        <div className={p.feedMedia}>{media}{files.length > 1 && <i className={p.counter}>{slide + 1}/{files.length}</i>}</div>
        {files.length > 1 && <div className={p.dots}>{files.map((f, i) => <button key={f.id} className={i === slide ? p.dotOn : ''} onClick={() => setSlide(i)} aria-label={`Foto ${i + 1}`} />)}</div>}
        <div className={p.feedActions}><Heart size={22} /><MessageCircle size={22} /><Send size={22} /><span className={p.grow} /><Bookmark size={22} /></div>
        <p className={p.feedCaption}><b>{handle('instagram').replace('@', '')}</b> {short}{text.length > IG_VISIBLE && <span className={p.more}>… mais</span>}</p>
      </div> : <>
        {media}
        <div className={p.shade} />
        {view === 'ig-story' && <>
          <div className={p.storyBars}>{(files.length ? files : [null]).map((_, i) => <i key={i} className={i === 0 ? p.barOn : ''} />)}</div>
          <div className={p.storyHead}><span className={p.avatar}>O</span><b>{handle('instagram').replace('@', '')}</b><small>agora</small></div>
          <div className={p.storyReply}><span>Enviar mensagem</span><Heart size={20} /><Send size={20} /></div>
        </>}
        {view === 'ig-reel' && <>
          <span className={p.reelTop}>Reels</span>
          <div className={p.side}><span><Heart size={22} />0</span><span><MessageCircle size={22} />0</span><span><Send size={22} /></span><span><MoreHorizontal size={20} /></span></div>
          <div className={p.bottom}><b><span className={p.avatar}>O</span>{handle('instagram').replace('@', '')}<em>Seguir</em></b><p>{short}{text.length > IG_VISIBLE && <span className={p.more}>… mais</span>}</p><small><Music2 size={11} />Áudio original</small></div>
        </>}
        {view === 'tiktok' && <>
          <span className={p.reelTop}>Seguindo · <b>Para você</b></span>
          <div className={p.side}><span className={p.ttAvatar}><span className={p.avatar}>O</span><Plus size={12} /></span><span><Heart size={24} fill="#fff" />0</span><span><MessageCircle size={24} fill="#fff" />0</span><span><Bookmark size={22} fill="#fff" />0</span><span><Share2 size={22} />0</span></div>
          <div className={p.bottom}><b>{handle('tiktok')}</b><p className={p.ttCaption}>{text}</p><small><Music2 size={11} />som original - {handle('tiktok')}</small></div>
        </>}
      </>}
    </div></div>
  </div>
}
