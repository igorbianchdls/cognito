import { atom } from 'nanostores';

export const $lastQueryData = atom<any[] | null>(null);

export function setLastQueryData(data: any[]) {
  $lastQueryData.set(data);
}

export function clearLastQueryData() {
  $lastQueryData.set(null);
}