// Sample data until spaces are backed by Supabase (phase 2).

export type FileKind = 'video' | 'image' | 'audio' | 'text'
/** folderId null means the file sits at the root of its space. */
export type MediaFile = { id: string; spaceId: string; folderId: string | null; name: string; kind: FileKind; size: number; duration?: number; width: number; height: number; createdAt: string; tone: string }
/** parentId null means the folder sits at the root of its space. */
export type Folder = { id: string; spaceId: string; parentId: string | null; name: string; description: string; tags: string[]; createdAt: string; updatedAt: string }
export type Space = { id: string; name: string }

export const spaces: Space[] = [
  { id: 'otto', name: 'Otto ERP' },
  { id: 'lumen', name: 'Lumen Hotel' },
  { id: 'pessoal', name: 'Pessoal' },
]

export const tagTone: Record<string, string> = { Reels: 'blue', Vendas: 'blue', Marketing: 'gray', Anúncios: 'red', Bastidores: 'green', Institucional: 'gray', Rascunhos: 'amber' }

export const folders: Folder[] = [
  { id: 'reels', spaceId: 'otto', parentId: null, name: 'Reels publicados', description: 'Vídeos que já foram ao ar no @otto.erp.', tags: ['Reels', 'Marketing'], createdAt: '2026-09-02', updatedAt: '2026-10-31' },
  { id: 'brutos', spaceId: 'otto', parentId: null, name: 'Vídeos brutos', description: 'Gravações originais antes da edição.', tags: ['Bastidores'], createdAt: '2026-08-14', updatedAt: '2026-10-29' },
  { id: 'artes', spaceId: 'otto', parentId: null, name: 'Artes e carrosséis', description: 'Imagens para feed e carrosséis.', tags: ['Marketing'], createdAt: '2026-08-20', updatedAt: '2026-10-25' },
  { id: 'stories', spaceId: 'otto', parentId: null, name: 'Stories', description: 'Formatos verticais de 15 segundos.', tags: ['Marketing'], createdAt: '2026-09-11', updatedAt: '2026-10-30' },
  { id: 'anuncios', spaceId: 'otto', parentId: null, name: 'Anúncios', description: 'Criativos para campanhas pagas.', tags: ['Anúncios', 'Vendas'], createdAt: '2026-09-21', updatedAt: '2026-10-27' },
  { id: 'ideias', spaceId: 'otto', parentId: null, name: 'Ideias e roteiros', description: 'Roteiros, ganchos e legendas.', tags: ['Rascunhos'], createdAt: '2026-08-01', updatedAt: '2026-10-31' },
  { id: 'hotel-fotos', spaceId: 'lumen', parentId: null, name: 'Fotos do hotel', description: 'Quartos, piscina e áreas comuns.', tags: ['Institucional'], createdAt: '2026-07-10', updatedAt: '2026-10-12' },
  { id: 'hotel-reels', spaceId: 'lumen', parentId: null, name: 'Reels do app', description: 'Gravações de tela do app no celular.', tags: ['Reels'], createdAt: '2026-10-28', updatedAt: '2026-10-30' },
  { id: 'pessoal-geral', spaceId: 'pessoal', parentId: null, name: 'Geral', description: 'Arquivos soltos.', tags: [], createdAt: '2026-06-01', updatedAt: '2026-10-01' },
  { id: 'reels-chatgpt', spaceId: 'otto', parentId: 'reels', name: 'Série ChatGPT', description: 'Reels da série ChatGPT + Otto.', tags: ['Reels'], createdAt: '2026-10-20', updatedAt: '2026-10-31' },
  { id: 'brutos-out', spaceId: 'otto', parentId: 'brutos', name: 'Outubro', description: 'Gravações de outubro.', tags: [], createdAt: '2026-10-01', updatedAt: '2026-10-29' },
]

const tones = ['sand', 'blue', 'rose', 'green', 'violet', 'amber']
const MB = 1024 * 1024
let n = 0
const spaceOf = (folderId: string) => folders.find(f => f.id === folderId)!.spaceId
const file = (folderId: string, name: string, kind: FileKind, sizeMb: number, duration?: number, w = 1080, h = 1920): MediaFile =>
  ({ id: `f${++n}`, spaceId: spaceOf(folderId), folderId, name, kind, size: Math.round(sizeMb * MB), duration, width: w, height: h, createdAt: `2026-10-${String(30 - (n % 28)).padStart(2, '0')}`, tone: tones[n % tones.length] })

export const files: MediaFile[] = [
  file('reels', 'ChatGPT emite nota fiscal (A).mp4', 'video', 8.1, 49),
  file('reels', 'ChatGPT cobra seus clientes.mp4', 'video', 8.5, 48),
  file('reels', 'Funcionária de R$ 0.mp4', 'video', 6.5, 40),
  file('reels', 'ChatGPT matou o Conta Azul.mp4', 'video', 4.0, 30),
  file('reels', 'Agora o ChatGPT pode — lucro.mp4', 'video', 5.5, 34),
  file('reels', 'Otto preocupa os contadores.mp4', 'video', 11.4, 31),
  file('reels', 'Notas fiscais (tela real).mp4', 'video', 11.6, 70),
  file('reels', 'Financeiro (tela real).mp4', 'video', 13.2, 75),
  file('reels', 'Substituir o sistema difícil.mp4', 'video', 5.3, 33),
  file('reels', 'Fazer tudo conversando.mp4', 'video', 5.3, 32),
  file('reels', 'Ser seu sistema de gestão.mp4', 'video', 5.1, 32),
  file('reels', 'Emite várias notas (B).mp4', 'video', 8.7, 50),
  file('brutos', 'Gravação apresentador 01.mov', 'video', 412, 312, 3840, 2160),
  file('brutos', 'Gravação apresentador 02.mov', 'video', 388, 287, 3840, 2160),
  file('brutos', 'Tela ChatGPT iPhone.mov', 'video', 96, 142),
  file('brutos', 'B-roll escritório.mp4', 'video', 220, 96, 3840, 2160),
  file('artes', 'Carrossel 5 sinais de caixa apertado.png', 'image', 2.4, undefined, 1080, 1350),
  file('artes', 'Capa — Nota fiscal no ChatGPT.png', 'image', 1.1, undefined, 1080, 1350),
  file('artes', 'Post lançamento Otto.jpg', 'image', 0.9, undefined, 1080, 1080),
  file('artes', 'Comparativo Otto x ERP.png', 'image', 1.6, undefined, 1080, 1350),
  file('stories', 'Story enquete planilha.mp4', 'video', 3.2, 15),
  file('stories', 'Story bastidores.mp4', 'video', 4.1, 15),
  file('anuncios', 'Anúncio 9x16 — Comenta NOTA.mp4', 'video', 7.9, 22),
  file('anuncios', 'Anúncio 1x1 — Sistema.mp4', 'video', 5.6, 20, 1080, 1080),
  file('ideias', 'Roteiros novembro.txt', 'text', 0.02),
  file('ideias', 'Ganchos que funcionaram.txt', 'text', 0.01),
  file('hotel-fotos', 'Piscina pôr do sol.jpg', 'image', 3.2, undefined, 1920, 1080),
  file('hotel-fotos', 'Suíte vista mar.jpg', 'image', 2.8, undefined, 1920, 1080),
  file('hotel-reels', 'Lumen Hotel no celular.mp4', 'video', 6.2, 24),
]


export const STORAGE_LIMIT = 5 * 1024 * MB

export const folderFiles = (folderId: string) => files.filter(f => f.folderId === folderId)
export const folderSize = (folderId: string) => folderFiles(folderId).reduce((v, f) => v + f.size, 0)
