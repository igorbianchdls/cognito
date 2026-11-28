// Legendas automáticas: o navegador manda o áudio do clipe em pedaços curtos (WAV mono de 16 kHz, menos de 2 MB cada,
// abaixo do limite de corpo das funções) e aqui cada pedaço vira palavras com o tempo de cada uma (Whisper da OpenAI,
// com marcação por palavra). Sem a chave no servidor, responde que a função está desligada.
import { EditorError } from './http'

export type Palavra = { palavra: string; inicio: number; fim: number }
const LIMITE = 4 * 1024 * 1024

/** Palavras de exemplo para os testes de tela (só fora de produção, com EDITOR_TRANSCRICAO_TESTE=1). */
function deTeste(segundos: number): Palavra[] {
  const frase = 'Olá pessoal este é um teste de legenda automática no editor do Otto'.split(' ')
  const passo = Math.max(0.25, Math.min(0.5, segundos / frase.length))
  return frase.map((palavra, i) => ({ palavra, inicio: i * passo, fim: i * passo + passo * 0.9 })).filter(p => p.fim <= segundos + 0.01)
}

export async function transcrever(audio: File, segundos: number): Promise<Palavra[]> {
  if (audio.size > LIMITE) throw new EditorError('Trecho de áudio grande demais.', 413)
  if (process.env.NODE_ENV !== 'production' && process.env.EDITOR_TRANSCRICAO_TESTE === '1') return deTeste(segundos)
  const chave = process.env.OPENAI_API_KEY
  if (!chave) throw new EditorError('As legendas automáticas ainda não foram ligadas no servidor.', 503)
  const form = new FormData()
  form.append('file', audio, 'trecho.wav')
  form.append('model', 'whisper-1')
  form.append('language', 'pt')
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'word')
  const resposta = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { authorization: `Bearer ${chave}` }, body: form, signal: AbortSignal.timeout(55_000) })
  if (!resposta.ok) {
    console.error(JSON.stringify({ scope: 'editor', code: 'transcricao', status: resposta.status, message: (await resposta.text()).slice(0, 300) }))
    throw new EditorError(resposta.status === 429 ? 'Muitas legendas ao mesmo tempo. Tente de novo em instantes.' : 'Não foi possível ouvir o áudio agora.', 502)
  }
  const dados = await resposta.json() as { words?: { word: string; start: number; end: number }[] }
  return (dados.words ?? []).map(w => ({ palavra: w.word.trim(), inicio: w.start, fim: w.end })).filter(p => p.palavra)
}
