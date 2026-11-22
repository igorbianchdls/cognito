'use client'

import type { PlayerSettings } from '../shared/settings'

const Toggle = ({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-start gap-2.5 text-[14px] text-[#222]">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-1" />
    <span>{label}{hint ? <span className="block text-[12px] text-[#888]">{hint}</span> : null}</span>
  </label>
)

/** Look and behavior of the player: used for the company default and for one video. */
export function SettingsForm({ value, onChange, disabled }: { value: PlayerSettings; onChange: (v: PlayerSettings) => void; disabled?: boolean }) {
  const set = (patch: Partial<PlayerSettings>) => onChange({ ...value, ...patch })
  const setCtl = (k: keyof PlayerSettings['controles'], v: boolean) => onChange({ ...value, controles: { ...value.controles, [k]: v } })
  return (
    <fieldset disabled={disabled} className="grid gap-5 disabled:opacity-60">
      <div className="grid gap-3">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#888]">Início</h3>
        <Toggle label="Autoplay sem som, com aviso para ouvir" hint="Recomendado para vídeos de venda: o vídeo começa sozinho e a pessoa clica para ativar o som." checked={value.autoplay_mudo} onChange={v => set({ autoplay_mudo: v })} />
        {value.autoplay_mudo ? (
          <div className="grid gap-2 pl-6 sm:grid-cols-2">
            <label className="grid gap-1 text-[13px] text-[#555]">Título do aviso<input maxLength={80} value={value.texto_som} onChange={e => set({ texto_som: e.target.value })} className="h-9 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" /></label>
            <label className="grid gap-1 text-[13px] text-[#555]">Texto menor<input maxLength={80} value={value.subtexto_som} onChange={e => set({ subtexto_som: e.target.value })} className="h-9 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" /></label>
            <div className="sm:col-span-2"><Toggle label="Ao ativar o som, voltar ao começo" checked={value.voltar_ao_inicio} onChange={v => set({ voltar_ao_inicio: v })} /></div>
          </div>
        ) : null}
        <Toggle label="Perguntar se quer continuar de onde parou" checked={value.continuar} onChange={v => set({ continuar: v })} />
      </div>
      <div className="grid gap-3">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#888]">Barra de progresso</h3>
        <div role="radiogroup" className="flex flex-wrap gap-2">
          {([['acelerada', 'Acelerada', 'anda mais rápido no começo'], ['normal', 'Normal', ''], ['oculta', 'Oculta', '']] as const).map(([k, l, h]) => (
            <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[14px] ${value.barra === k ? 'border-[#111] bg-[#111] text-white' : 'border-[#e2e2e2] bg-white text-[#333]'}`}>
              <input type="radio" name="barra" className="sr-only" checked={value.barra === k} onChange={() => set({ barra: k })} />{l}{h ? <span className="text-[12px] opacity-70">({h})</span> : null}
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-[#888]">Controles para quem assiste</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Pausar e continuar" checked={value.controles.play_pausar} onChange={v => setCtl('play_pausar', v)} />
          <Toggle label="Som" checked={value.controles.volume} onChange={v => setCtl('volume', v)} />
          <Toggle label="Tela cheia" checked={value.controles.tela_cheia} onChange={v => setCtl('tela_cheia', v)} />
          <Toggle label="Velocidade" checked={value.controles.velocidade} onChange={v => setCtl('velocidade', v)} />
          <Toggle label="Avançar e voltar pela barra" hint="Em vídeo de venda, costuma ficar desligado." checked={value.controles.avancar} onChange={v => setCtl('avancar', v)} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-[13px] text-[#555]">Cor principal
          <span className="flex items-center gap-2"><input type="color" value={value.cor} onChange={e => set({ cor: e.target.value })} className="h-9 w-12 rounded border border-[#e2e2e2]" /><code className="text-[13px]">{value.cor}</code></span>
        </label>
        <label className="grid gap-1 text-[13px] text-[#555]">Cantos arredondados: {value.arredondamento}px
          <input type="range" min={0} max={32} value={value.arredondamento} onChange={e => set({ arredondamento: Number(e.target.value) })} />
        </label>
      </div>
    </fieldset>
  )
}
