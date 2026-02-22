export type JsonObject = Record<string, unknown>

export type MessageAttachmentInput = {
  filename?: string
  contentType?: string
  contentDisposition?: string
  contentId?: string
  content?: string
  url?: string
}

export type MessageComposePayload = {
  to?: string[]
  cc?: string[]
  bcc?: string[]
  labels?: string[]
  subject?: string
  text?: string
  html?: string
  attachments?: MessageAttachmentInput[]
}

export type MessageLabelsPatchPayload = {
  addLabels?: string[]
  removeLabels?: string[]
}

export type RouteParamsLike = { id?: string } | undefined

export type RouteContextLike =
  | { params?: RouteParamsLike | Promise<RouteParamsLike> }
  | undefined
