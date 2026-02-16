import { atom } from 'nanostores'

export const $driveSearch = atom<string>('')
export const $driveActiveWorkspaceId = atom<string | null>(null)
