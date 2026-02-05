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

export function isText(mime?: string) {
  return !!mime && /^(text\/|application\/(json|xml|x-yaml))/i.test(mime)
}

