// E-mail through Amazon SES (API v2), signed with AWS Signature V4 by hand (no SDK).
// Off until the server has INBOX_SES_REGION, INBOX_SES_ACCESS_KEY_ID and INBOX_SES_SECRET_ACCESS_KEY.
import { createHash, createHmac } from 'node:crypto'

export class EmailError extends Error {}

export type SesConfig = { region: string; accessKeyId: string; secretAccessKey: string; endpoint?: string }
export function sesConfig(): SesConfig | null {
  const region = process.env.INBOX_SES_REGION, accessKeyId = process.env.INBOX_SES_ACCESS_KEY_ID, secretAccessKey = process.env.INBOX_SES_SECRET_ACCESS_KEY
  if (!region || !accessKeyId || !secretAccessKey) return null
  return { region, accessKeyId, secretAccessKey, endpoint: process.env.INBOX_SES_ENDPOINT || undefined }
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
const hmac = (k: Buffer | string, s: string) => createHmac('sha256', k).update(s).digest()

/** Headers for a signed AWS request (service "ses"). Exported for the test. */
export function signAws(cfg: SesConfig, method: string, url: URL, body: string, now = new Date()) {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const day = amzDate.slice(0, 8)
  const headers: Record<string, string> = { 'content-type': 'application/json', host: url.host, 'x-amz-date': amzDate }
  const names = Object.keys(headers).sort()
  const canonical = [method, url.pathname, url.searchParams.toString(), names.map(n => `${n}:${headers[n]}\n`).join(''), names.join(';'), sha256(body)].join('\n')
  const scope = `${day}/${cfg.region}/ses/aws4_request`
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonical)].join('\n')
  const key = hmac(hmac(hmac(hmac('AWS4' + cfg.secretAccessKey, day), cfg.region), 'ses'), 'aws4_request')
  const signature = createHmac('sha256', key).update(toSign).digest('hex')
  return { ...headers, authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}` }
}

export type OutgoingEmail = { from: string; to: string; replyTo?: string | null; subject: string; html: string; text: string; unsubscribeUrl: string }

/** Sends one e-mail; returns the SES message id. */
export async function sendEmail(send: typeof fetch, cfg: SesConfig, m: OutgoingEmail) {
  const url = new URL('/v2/email/outbound-emails', cfg.endpoint ?? `https://email.${cfg.region}.amazonaws.com`)
  const body = JSON.stringify({
    FromEmailAddress: m.from,
    Destination: { ToAddresses: [m.to] },
    ...(m.replyTo ? { ReplyToAddresses: [m.replyTo] } : {}),
    Content: { Simple: {
      Subject: { Data: m.subject, Charset: 'UTF-8' },
      Body: { Html: { Data: m.html, Charset: 'UTF-8' }, Text: { Data: m.text, Charset: 'UTF-8' } },
      Headers: [{ Name: 'List-Unsubscribe', Value: `<${m.unsubscribeUrl}>` }, { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' }],
    } },
  })
  const response = await send(url, { method: 'POST', headers: signAws(cfg, 'POST', url, body), body, signal: AbortSignal.timeout(15000) }).catch(() => null)
  if (!response) throw new EmailError('O serviço de e-mail não respondeu.')
  const data = await response.json().catch(() => ({})) as { MessageId?: string; message?: string; Message?: string }
  if (!response.ok) throw new EmailError(`O serviço de e-mail recusou: ${(data.message ?? data.Message ?? `HTTP ${response.status}`).slice(0, 200)}`)
  return data.MessageId ?? ''
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/** Plain text written by the team → simple HTML (paragraphs, line breaks, links) with the legal footer. */
export function emailHtml(text: string, footer: { address?: string | null; unsubscribeUrl: string }) {
  const paragraphs = text.trim().split(/\n{2,}/).map(p => `<p style="margin:0 0 16px">${esc(p).replace(/https?:\/\/[^\s<]+/g, u => `<a href="${u}">${u}</a>`).replace(/\n/g, '<br>')}</p>`).join('')
  const foot = `${footer.address ? esc(footer.address) + '<br>' : ''}<a href="${esc(footer.unsubscribeUrl)}" style="color:#888">Não quero mais receber estes e-mails</a>`
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6f6"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:28px;font:15px/1.55 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#222">${paragraphs}</div><p style="max-width:560px;margin:16px auto 0;font:12px/1.5 Arial,sans-serif;color:#888;text-align:center">${foot}</p></body></html>`
}
export const emailText = (text: string, footer: { address?: string | null; unsubscribeUrl: string }) =>
  `${text.trim()}\n\n--\n${footer.address ? footer.address + '\n' : ''}Para não receber mais: ${footer.unsubscribeUrl}`
