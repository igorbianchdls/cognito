export function isPdf(mime?: string) {
  return !!mime && /application\/pdf/i.test(mime)
}

export function isImage(mime?: string) {
  return !!mime && /^image\//i.test(mime)
}

export function isVideo(mime?: string) {
  return !!mime && /^video\//i.test(mime)
}

export function isAudio(mime?: string) {
  return !!mime && /^audio\//i.test(mime)
}

const TEXT_EXTENSIONS_RE = /\.(txt|md|markdown|csv|tsv|json|xml|yml|yaml|log|sql|js|ts|jsx|tsx|css|scss|html|htm)$/i

export function isText(mime?: string, name?: string) {
  if (!!mime && /^(text\/|application\/(json|xml|x-yaml))/i.test(mime)) {
    return true
  }
  if (name && TEXT_EXTENSIONS_RE.test(name)) {
    return true
  }
  return false
}
