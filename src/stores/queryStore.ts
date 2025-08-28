import { atom } from 'nanostores';

export const $lastQueryData = atom<Array<Record<string, unknown>> | null>(null);

export function setLastQueryData(data: Array<Record<string, unknown>>) {
  console.log('🔧 QUERY STORE: Saving data to store:', data.length, 'rows');
  console.log('🔧 QUERY STORE: First row sample:', data[0]);
  console.log('🔧 QUERY STORE: Data type:', typeof data, 'isArray:', Array.isArray(data));
  $lastQueryData.set(data);
  console.log('🔧 QUERY STORE: Data saved successfully');
}

export function clearLastQueryData() {
  console.log('🔧 QUERY STORE: Clearing data from store');
  $lastQueryData.set(null);
}

export function getLastQueryDataWithLog() {
  const data = $lastQueryData.get();
  console.log('🔧 QUERY STORE: Getting data from store:', data ? data.length : 'null', 'rows');
  if (data && data.length > 0) {
    console.log('🔧 QUERY STORE: Sample data:', data[0]);
  }
  return data;
}