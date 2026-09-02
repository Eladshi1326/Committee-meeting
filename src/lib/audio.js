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

// ניגון הקלטה. אם ה-blob URL נכשל, מנסים data URL. מדווח: סיום / חסימה / כישלון.
export function playRec(a, rec, onEnd, onBlocked, onFail) {
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
