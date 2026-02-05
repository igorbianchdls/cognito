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
  IMAGES[0],
  PDFS[0],
  VIDEOS[0],
  IMAGES[1],
  AUDIOS[0],
]

