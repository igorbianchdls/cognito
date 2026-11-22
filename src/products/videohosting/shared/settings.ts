// The player's settings: what the company sets as default (presets) and each video can override (videos.settings).
// Shared by the screens (forms), the server (what the page receives) and the tests.
import { z } from 'zod'

export const controlsSchema = z.object({
  play_pausar: z.boolean().describe('Pausar e continuar clicando no vídeo e no botão.'),
  volume: z.boolean().describe('Botão de som.'),
  tela_cheia: z.boolean().describe('Botão de tela cheia.'),
  velocidade: z.boolean().describe('Escolher velocidade (1x, 1,5x, 2x).'),
  avancar: z.boolean().describe('Clicar na barra para avançar ou voltar.'),
})
export const settingsSchema = z.object({
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).describe('Cor principal (botões e barra).'),
  autoplay_mudo: z.boolean().describe('Começa a tocar sem som, com o aviso para ativar o som.'),
  texto_som: z.string().max(80).describe('Título do aviso de som.'),
  subtexto_som: z.string().max(80).describe('Texto menor do aviso de som.'),
  voltar_ao_inicio: z.boolean().describe('Ao ativar o som, o vídeo volta ao começo.'),
  barra: z.enum(['acelerada', 'normal', 'oculta']).describe('Barra de progresso: acelerada (anda mais rápido no começo), normal ou oculta.'),
  continuar: z.boolean().describe('Pergunta se quer continuar de onde parou.'),
  arredondamento: z.number().int().min(0).max(32).describe('Cantos arredondados, em pixels.'),
  controles: controlsSchema,
}).strict()
export type PlayerSettings = z.infer<typeof settingsSchema>

export const DEFAULT_SETTINGS: PlayerSettings = {
  cor: '#2563eb', autoplay_mudo: true, texto_som: 'Seu vídeo já começou', subtexto_som: 'Clique para ouvir', voltar_ao_inicio: true,
  barra: 'acelerada', continuar: true, arredondamento: 12,
  controles: { play_pausar: true, volume: true, tela_cheia: true, velocidade: false, avancar: false },
}

/** Default ← company preset ← video, keeping only valid values (a bad stored value falls back to the one below it). */
export function mergeSettings(...layers: unknown[]): PlayerSettings {
  let out: PlayerSettings = structuredClone(DEFAULT_SETTINGS)
  for (const layer of layers) {
    if (!layer || typeof layer !== 'object') continue
    const l = layer as Record<string, unknown>
    const next = { ...out, ...l, controles: { ...out.controles, ...(typeof l.controles === 'object' && l.controles ? l.controles : {}) } }
    const parsed = settingsSchema.safeParse(next)
    if (parsed.success) { out = parsed.data; continue }
    // Apply field by field so one bad value doesn't drop the rest.
    for (const [k, v] of Object.entries(l)) {
      const tryOne = settingsSchema.safeParse({ ...out, [k]: k === 'controles' && typeof v === 'object' && v ? { ...out.controles, ...v } : v })
      if (tryOne.success) out = tryOne.data
    }
  }
  return out
}

/** "https://www.loja.com.br/x" → "www.loja.com.br"; invalid → null. */
export const cleanDomain = (d: string) => {
  const v = d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return /^([a-z0-9-]+\.)+[a-z]{2,}$|^localhost(:\d+)?$/.test(v) ? v : null
}
export const domainAllowed = (domains: string[], host: string) => domains.some(d => host === d || host.endsWith('.' + d))
