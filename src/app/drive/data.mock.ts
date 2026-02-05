import type { DriveItem } from '@/components/drive/types'

export type DriveFolder = {
  id: string
  name: string
  filesCount: number
  size: string
}

// Sample files (public URLs)
const IMAGES: DriveItem[] = [
  { id: 'img1', name: 'Beach.jpg', mime: 'image/jpeg', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80' },
  { id: 'img2', name: 'Mountains.png', mime: 'image/png', url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80' },
]

const PDFS: DriveItem[] = [
  { id: 'pdf1', name: 'Dummy.pdf', mime: 'application/pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
]

const VIDEOS: DriveItem[] = [
  { id: 'vid1', name: 'Big Buck Bunny.mp4', mime: 'video/mp4', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
]

const AUDIOS: DriveItem[] = [
  { id: 'aud1', name: 'Sample.mp3', mime: 'audio/mpeg', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
]

const RECENT_MOCKS: DriveItem[] = [
  { id: 'rc1', name: 'Onboarding-Guide.pdf', mime: 'application/pdf', url: PDFS[0].url, size: '2.4 MB', addedAt: '2026-02-04T13:15:00Z', addedBy: 'kevin@mail.com' },
  { id: 'rc2', name: 'Product-Roadmap.pdf', mime: 'application/pdf', url: PDFS[0].url, size: '4.7 MB', addedAt: '2026-02-04T09:48:00Z', addedBy: 'antowe@gmail.com' },
  { id: 'rc3', name: 'Summer-Campaign.jpg', mime: 'image/jpeg', url: IMAGES[0].url, size: '6.1 MB', addedAt: '2026-02-03T17:20:00Z', addedBy: 'igor@creatto.ai' },
  { id: 'rc4', name: 'Hero-Banner.png', mime: 'image/png', url: IMAGES[1].url, size: '3.8 MB', addedAt: '2026-02-03T11:03:00Z', addedBy: 'dani@workspace.com' },
  { id: 'rc5', name: 'Launch-Teaser.mp4', mime: 'video/mp4', url: VIDEOS[0].url, size: '186 MB', addedAt: '2026-02-02T19:42:00Z', addedBy: 'ops@team.io' },
  { id: 'rc6', name: 'Podcast-Ep07.mp3', mime: 'audio/mpeg', url: AUDIOS[0].url, size: '34 MB', addedAt: '2026-02-02T10:05:00Z', addedBy: 'kevin@mail.com' },
  { id: 'rc7', name: 'Quarterly-Notes.txt', mime: 'text/plain', size: '88 KB', addedAt: '2026-02-01T15:00:00Z', addedBy: 'antowe@gmail.com' },
  { id: 'rc8', name: 'Client-Checklist.pdf', mime: 'application/pdf', url: PDFS[0].url, size: '1.9 MB', addedAt: '2026-02-01T08:21:00Z', addedBy: 'igor@creatto.ai' },
  { id: 'rc9', name: 'Moodboard-Set-A.jpg', mime: 'image/jpeg', url: IMAGES[0].url, size: '5.0 MB', addedAt: '2026-01-31T14:18:00Z', addedBy: 'dani@workspace.com' },
  { id: 'rc10', name: 'Campaign-Storyboard.png', mime: 'image/png', url: IMAGES[1].url, size: '7.2 MB', addedAt: '2026-01-31T09:09:00Z', addedBy: 'ops@team.io' },
  { id: 'rc11', name: 'Interview-Raw-Cut.mp4', mime: 'video/mp4', url: VIDEOS[0].url, size: '242 MB', addedAt: '2026-01-30T22:11:00Z', addedBy: 'kevin@mail.com' },
  { id: 'rc12', name: 'Brand-Voice.mp3', mime: 'audio/mpeg', url: AUDIOS[0].url, size: '28 MB', addedAt: '2026-01-30T16:37:00Z', addedBy: 'antowe@gmail.com' },
  { id: 'rc13', name: 'Pipeline-Export.csv', mime: 'text/csv', size: '540 KB', addedAt: '2026-01-29T12:05:00Z', addedBy: 'igor@creatto.ai' },
  { id: 'rc14', name: 'Release-Checklist.pdf', mime: 'application/pdf', url: PDFS[0].url, size: '3.3 MB', addedAt: '2026-01-29T09:40:00Z', addedBy: 'dani@workspace.com' },
]

export const itemsByFolder: Record<string, DriveItem[]> = {
  f1: [...IMAGES, ...PDFS],
  f2: [...VIDEOS, ...IMAGES],
  f3: [...AUDIOS, ...PDFS],
  f4: [...IMAGES],
  f5: [...PDFS],
  f6: [...VIDEOS],
}

export const folders: DriveFolder[] = [
  { id: 'f1', name: 'Brand Assets', filesCount: itemsByFolder.f1.length, size: '732 MB' },
  { id: 'f2', name: 'Neuralink Space', filesCount: itemsByFolder.f2.length, size: '22.7 GB' },
  { id: 'f3', name: 'Olympic Games', filesCount: itemsByFolder.f3.length, size: '3.9 GB' },
  { id: 'f4', name: 'Design System', filesCount: itemsByFolder.f4.length, size: '1.4 GB' },
  { id: 'f5', name: 'Contracts', filesCount: itemsByFolder.f5.length, size: '918 MB' },
  { id: 'f6', name: 'Sprint Docs', filesCount: itemsByFolder.f6.length, size: '403 MB' },
]

export const recentItems: DriveItem[] = [
  ...RECENT_MOCKS,
]
