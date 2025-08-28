import { atom } from 'nanostores';

export const $lastQueryData = atom<Array<Record<string, unknown>> | null>(null);

export function setLastQueryData(data: Array<Record<string, unknown>>) {
  $lastQueryData.set(data);
}

export function clearLastQueryData() {
  $lastQueryData.set(null);
}