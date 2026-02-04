export function timeAgo(input: string | number | Date): string {
  const date = input instanceof Date ? input : new Date(input)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  if (isNaN(diffMs)) return ''
  const sec = Math.floor(diffMs / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  const month = Math.floor(day / 30)
  const year = Math.floor(day / 365)

  if (sec < 60) return `há ${sec} segundo${sec === 1 ? '' : 's'}`
  if (min < 60) return `há ${min} minuto${min === 1 ? '' : 's'}`
  if (hr < 24) return `há ${hr} hora${hr === 1 ? '' : 's'}`
  if (day < 30) return `há ${day} dia${day === 1 ? '' : 's'}`
  if (month < 12) return `há ${month} mese${month === 1 ? '' : 's'}`
  return `há ${year} ano${year === 1 ? '' : 's'}`
}

