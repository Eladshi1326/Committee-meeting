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
  studioBlind: false,    // הקלטה עיוורת: סדר אקראי, בלי שמות וסצנות
  studioSeed: 0,         // הזרע של הערבוב, כדי שהסדר יישאר קבוע
  storyId: "s1",         // איזה סיפור פעיל
  players: [],           // שמות השחקנים. ריק או אחד = משחק יחיד
  playerIds: [],         // מזהה יציב לכל שחקן. מחיקה מהאמצע לא מזיזה הקלטות של אחרים
  splitMode: "line",     // "line" = שורות אקראיות לכל אחד, "char" = דמות שלמה לכל אחד
  splitSeed: 0,          // זרע החלוקה בין השחקנים
  setupDone: false,      // עברו את מסך הפתיחה (כמה אתם + איזה סיפור)
  adultUnlocked: false,  // המדף של 18+ נפתח
  realNames: true,       // השמות של השחקנים נכנסים לסיפור במקום שמות הדמויות
  turns: true,           // במשחק קבוצתי: כל צומת מישהו אחר מחליט
  wordSeed: 0,           // הזרע של משחק המילים
  skipSilence: true,     // לדלג על השקט בהתחלה ובסוף של כל הקלטה
  mode: "story",         // "story" = סיפור כתוב, "words" = סיפור מהמילים שלכם
  narrator: -1,          // מי מקריא את הסיפור בקול. -1 = אין מקריא
  wordSetId: null,       // הערכה שננעלה בשביל המקריא (הוא מקליט את כל הטקסטים שלה)
  playerGenders: [],     // "m" / "f" לכל שחקן — קובע זכר/נקבה בטקסט של משחק המילים
  textSpeed: 1,          // קצב הטקסט בסיפור מהמילים: 1.4 איטי, 1 רגיל, 0.7 מהיר
  tts: false,            // הקראה אוטומטית: הטלפון מקריא את הטקסט של הסיפור בקול
  ttsVoice: "",          // איזה קול (voiceURI). ריק = הקול העברי של המכשיר
  ttsRate: 1,            // מהירות הדיבור של ההקראה
  liveRead: false,       // מישהו מקריא בשידור חי: הטקסט מחכה להקשה במקום לשעון
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
