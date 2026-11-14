/**
 * Keeps an unfinished review in the visitor's own browser, so nothing is lost
 * when they leave to sign in with Google and come back. Nothing here is sent anywhere.
 *
 * The answers go into localStorage. The proof file is too big for that, so it
 * goes into IndexedDB (the browser's small built-in database).
 */
const DRAFT_KEY = "review-draft-v1";
const DB_NAME = "review-draft";
const STORE = "files";
const FILE_KEY = "proof";

export type StoredDraft<T> = { values: T; step: number; savedAt: number; extra?: Record<string, unknown> };

/** Drafts older than this are thrown away. */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function saveDraft<T>(draft: Omit<StoredDraft<T>, "savedAt">): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // Private mode or a full disk: the form still works, just without a saved draft.
  }
}

export function loadDraft<T>(): StoredDraft<T> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as StoredDraft<T>;
    if (!draft || typeof draft !== "object" || Date.now() - draft.savedAt > MAX_AGE_MS) return null;
    return draft;
  } catch {
    return null;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
  try {
    const db = await openDb();
    return await new Promise<unknown>((resolve) => {
      const request = run(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveDraftFile(file: File | null): Promise<void> {
  await withStore("readwrite", (store) => (file ? store.put(file, FILE_KEY) : store.delete(FILE_KEY)));
}

export async function loadDraftFile(): Promise<File | null> {
  const file = await withStore("readonly", (store) => store.get(FILE_KEY));
  return file instanceof File ? file : null;
}

export async function clearDraft(): Promise<void> {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
  await saveDraftFile(null);
}
