// Bytes of uploaded files, in IndexedDB, until they go to Supabase Storage (phase 2).
const DB = 'otto-editor-files', STORE = 'blobs'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const putBlob = (id: string, blob: Blob) => run('readwrite', s => s.put(blob, id)).catch(() => undefined)
export const getBlob = (id: string) => run<Blob | undefined>('readonly', s => s.get(id)).catch(() => undefined)
export const deleteBlob = (id: string) => run('readwrite', s => s.delete(id)).catch(() => undefined)
export async function copyBlob(from: string, to: string) { const b = await getBlob(from); if (b) await putBlob(to, b) }

export async function downloadBlob(id: string, name: string) {
  const b = await getBlob(id)
  if (!b) return false
  const url = URL.createObjectURL(b), a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
