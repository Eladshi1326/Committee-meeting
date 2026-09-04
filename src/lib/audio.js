export function pickMime() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  const list = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus", "audio/aac"];
  return list.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(",");
  const head = dataUrl.slice(0, comma);
  const b64 = dataUrl.slice(comma + 1);
  const m = head.match(/data:([^;]+)/);
  const mime = (m && m[1]) || "audio/webm";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// קובץ WAV שקט קצר. מנגנים אותו בתוך לחיצה של המשתמש כדי ש-iOS ירשה
// אחר כך לנגן שורות אוטומטית באותו אלמנט אודיו.
export function makeSilentWav() {
  const rate = 8000;
  const samples = 800;
  const buf = new ArrayBuffer(44 + samples * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + samples * 2, true); w(8, "WAVE"); w(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, "data"); v.setUint32(40, samples * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

export function unlockAudio(a, silentUrl) {
  if (!a || !silentUrl) return;
  try {
    a.src = silentUrl;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* לא קריטי */ }
}


// ---- דילוג על שקט ----
// אנשים לוחצים "הקלט" ואז חושבים שנייה לפני שהם מדברים. במקום לחתוך את
// הקובץ (מה שמאלץ פורמט לא דחוס וגדול), מודדים פעם אחת איפה הקול מתחיל
// ונגמר, שומרים שני מספרים, ומנגנים רק את הקטע הזה.

let _ctx = null;
export function getCtx() {
  if (_ctx) return _ctx;
  const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  try { _ctx = new AC(); } catch (e) { _ctx = null; }
  return _ctx;
}

// חייבים לקרוא מתוך לחיצה של המשתמש, אחרת iOS לא ירשה לנגן
export function resumeCtx() {
  const c = getCtx();
  if (c && c.state === "suspended") { try { c.resume(); } catch (e) { /* ignore */ } }
}

const _bufCache = new Map();

async function decode(blob) {
  const c = getCtx();
  if (!c) return null;
  const buf = await blob.arrayBuffer();
  return await new Promise((res, rej) => {
    const p = c.decodeAudioData(buf, res, rej);
    if (p && p.then) p.then(res, rej);
  });
}

async function bufferFor(rec) {
  if (!rec || !(rec.blob instanceof Blob)) return null;
  if (_bufCache.has(rec.blob)) return _bufCache.get(rec.blob);
  let b = null;
  try { b = await decode(rec.blob); } catch (e) { b = null; }
  if (b) _bufCache.set(rec.blob, b);
  return b;
}

// סורק את גל הקול בחלונות של 20ms ומחזיר איפה באמת מדברים
export async function analyzeTrim(blob) {
  let buf;
  try { buf = await decode(blob); } catch (e) { return null; }
  if (!buf || !buf.length) return null;
  const data = buf.getChannelData(0);
  const rate = buf.sampleRate;
  const win = Math.max(1, Math.floor(rate * 0.02));
  const rms = [];
  let peak = 0;
  for (let i = 0; i < data.length; i += win) {
    let sum = 0;
    const end = Math.min(i + win, data.length);
    for (let j = i; j < end; j++) sum += data[j] * data[j];
    const v = Math.sqrt(sum / Math.max(1, end - i));
    rms.push(v);
    if (v > peak) peak = v;
  }
  if (peak < 0.008) return null; // הכל שקט, לא נוגעים
  const thr = Math.max(peak * 0.09, 0.004);
  let first = -1, last = -1;
  for (let i = 0; i < rms.length; i++) if (rms[i] >= thr) { if (first < 0) first = i; last = i; }
  if (first < 0) return null;
  const dur = buf.duration;
  const start = Math.max(0, (first * win) / rate - 0.06);   // קצת לפני, שלא ייחתך עיצור
  const end = Math.min(dur, ((last + 1) * win) / rate + 0.12);
  if (end - start < 0.12) return null;                       // קצר מדי, כנראה רעש
  if (start < 0.05 && dur - end < 0.05) return null;          // אין מה לחסוך
  return { start, end, dur };
}

// ניגון קטע מתוך הקלטה דרך Web Audio. מדויק, ולא תלוי במטא-דאטה של webm
// שלרוב חסרה ושוברת קפיצה בתוך אלמנט audio רגיל.
// מפענחים הקלטה מראש (בזמן שמשהו אחר מתנגן), כדי שכשיגיע התור שלה
// היא תתחיל בלי השהיית פענוח.
export function prewarmRec(rec) {
  if (!rec || !getCtx()) return;
  try { bufferFor(rec); } catch (e) { /* ignore */ }
}

function playTrimmed(rec, onEnd, onFail) {
  const c = getCtx();
  if (!c) { onFail(); return null; }
  let src = null;
  let dead = false;
  bufferFor(rec).then((buf) => {
    if (dead) return;
    if (!buf) { onFail(); return; }
    const t = rec.trim;
    const from = t ? Math.min(Math.max(0, t.start), buf.duration) : 0;
    const len = t ? Math.max(0.05, Math.min(t.end, buf.duration) - from) : buf.duration;
    try {
      src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.onended = () => { if (!dead) { dead = true; onEnd(); } };
      src.start(0, from, len);
    } catch (e) { onFail(); }
  }, () => { if (!dead) onFail(); });
  return () => {
    dead = true;
    if (src) { try { src.onended = null; src.stop(); } catch (e) { /* ignore */ } }
  };
}

// ניגון הקלטה. אם ה-blob URL נכשל, מנסים data URL. מדווח: סיום / חסימה / כישלון.
export function playRec(a, rec, onEnd, onBlocked, onFail) {
  // יש סימון של איפה מדברים? מנגנים רק את זה.
  if (rec && rec.trim && getCtx()) {
    let fellBack = null;
    const stop = playTrimmed(rec, onEnd, () => {
      fellBack = playRaw(a, rec, onEnd, onBlocked, onFail);
    });
    return () => { if (stop) stop(); if (fellBack) fellBack(); };
  }
  return playRaw(a, rec, onEnd, onBlocked, onFail);
}

function playRaw(a, rec, onEnd, onBlocked, onFail) {
  let usedData = false;
  const tryData = () => {
    if (usedData || !rec.dataUrl) { onFail(); return; }
    usedData = true;
    a.src = rec.dataUrl;
    attempt();
  };
  const attempt = () => {
    let p;
    try { p = a.play(); } catch (e) { tryData(); return; }
    if (p && p.catch) {
      p.catch((e) => {
        const n = e && e.name;
        if (n === "AbortError") return;
        if (n === "NotAllowedError") { onBlocked(); return; }
        tryData();
      });
    }
  };
  a.onended = () => onEnd();
  a.onerror = () => tryData();
  a.src = rec.url || rec.dataUrl;
  attempt();
  return () => { a.onended = null; a.onerror = null; };
}

// זיהוי סביבה להצעת ההתקנה
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
