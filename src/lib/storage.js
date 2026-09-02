// אחסון מקומי בטלפון: IndexedDB. ההקלטות נשמרות כ-Blob (בלי base64), אז אין בעיית גודל.
const DB_NAME = "vaad-bait";
const DB_VERSION = 1;
const STORE_REC = "recordings";
const STORE_KV = "kv";

export const DEFAULT_SETTINGS = {
  playChoices: true,   // לנגן את ההקלטות של התשובות שלך
  autoAdvance: true,   // לעבור לשורה הבאה לבד כשההקלטה נגמרת
  muted: false,        // טקסט בלבד
  studioAutoNext: false, // באולפן: אחרי הקלטה לקפוץ לשורה הבאה שלא הוקלטה
};

let dbPromise = null;

export function hasIDB() {
  return typeof indexedDB !== "undefined";
}

function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE_REC)) d.createObjectStore(STORE_REC);
        if (!d.objectStoreNames.contains(STORE_KV)) d.createObjectStore(STORE_KV);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("indexedDB open failed"));
      req.onblocked = () => reject(new Error("indexedDB blocked"));
    });
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
}

function run(store, mode, fn) {
  return db().then(
    (d) =>
      new Promise((resolve, reject) => {
        const t = d.transaction(store, mode);
        let req;
        try { req = fn(t.objectStore(store)); } catch (e) { reject(e); return; }
        t.oncomplete = () => resolve(req ? req.result : undefined);
        t.onerror = () => reject(t.error || new Error("transaction failed"));
        t.onabort = () => reject(t.error || new Error("transaction aborted"));
      })
  );
}

export const kvGet = (key) => run(STORE_KV, "readonly", (s) => s.get(key));
export const kvSet = (key, value) => run(STORE_KV, "readwrite", (s) => s.put(value, key));
export const kvDel = (key) => run(STORE_KV, "readwrite", (s) => s.delete(key));

export const recSet = (id, value) => run(STORE_REC, "readwrite", (s) => s.put(value, id));
export const recDel = (id) => run(STORE_REC, "readwrite", (s) => s.delete(id));
export const recClear = () => run(STORE_REC, "readwrite", (s) => s.clear());

export function recAll() {
  return db().then(
    (d) =>
      new Promise((resolve, reject) => {
        const out = {};
        const t = d.transaction(STORE_REC, "readonly");
        const req = t.objectStore(STORE_REC).openCursor();
        req.onsuccess = () => {
          const c = req.result;
          if (c) { out[c.key] = c.value; c.continue(); }
          else resolve(out);
        };
        req.onerror = () => reject(req.error || new Error("cursor failed"));
      })
  );
}
