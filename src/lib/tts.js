// הקראה אוטומטית בקול של הטלפון (Web Speech API).
// חינם לגמרי, מובנה בדפדפן, לא שולח כלום לשרת, ובאנדרואיד/אייפון גם עובד בלי אינטרנט.
// משמש כשאין מקריא אנושי: הטקסט של הסיפור מוקרא, וההקלטות של השחקנים
// (המילים והשמות) מנוגנות כרגיל — אותן אף פעם לא מקריאים.

let cache = [];
let warmed = false;

export function ttsSupported() {
  return typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined";
}

export function getVoices() {
  if (!ttsSupported()) return [];
  try {
    const v = window.speechSynthesis.getVoices() || [];
    if (v.length) cache = v;
  } catch (e) { /* ignore */ }
  return cache;
}

// רשימת הקולות נטענת בעצלתיים בחלק מהדפדפנים, ולפעמים מגיעה באיחור.
export function onVoices(cb) {
  if (!ttsSupported()) { cb([]); return () => {}; }
  const fire = () => cb(getVoices());
  fire();
  const h = () => fire();
  try { window.speechSynthesis.addEventListener("voiceschanged", h); }
  catch (e) { window.speechSynthesis.onvoiceschanged = h; }
  const t1 = setTimeout(fire, 300);
  const t2 = setTimeout(fire, 1200);
  const t3 = setTimeout(fire, 3000);
  return () => {
    clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    try { window.speechSynthesis.removeEventListener("voiceschanged", h); } catch (e) { /* ignore */ }
  };
}

export function isHebrew(v) {
  return /^(he|iw)/i.test((v && v.lang) || "");
}

export function hebrewVoices(list) {
  return (list || getVoices()).filter(isHebrew);
}

// קול מועדף: מה שהמשתמש בחר, אחרת קול עברי שמותקן במכשיר (עובד בלי רשת), אחרת כל עברי.
export function pickVoice(uri) {
  const all = getVoices();
  if (!all.length) return null;
  const chosen = uri && all.find((v) => v.voiceURI === uri);
  if (chosen) return chosen;
  const he = hebrewVoices(all);
  return he.find((v) => v.localService) || he[0] || null;
}

export function hasHebrewVoice() {
  return hebrewVoices().length > 0;
}

// באייפון מותר להשמיע רק אחרי נגיעה של המשתמש. קוראים לזה בתוך הלחיצה על "להשמיע".
export function warmTTS() {
  if (!ttsSupported()) return;
  try {
    window.speechSynthesis.cancel();
    if (warmed) return;
    const u = new window.SpeechSynthesisUtterance(" ");
    u.volume = 0;
    u.rate = 2;
    window.speechSynthesis.speak(u);
    warmed = true;
  } catch (e) { /* ignore */ }
}

export function stopTTS() {
  if (!ttsSupported()) return;
  try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
}

// מקריא טקסט אחד. מחזיר פונקציית עצירה.
// onEnd נקרא כשסיים, onFail אם הדפדפן סירב — ואז המסך ממשיך לפי שעון, כמו קודם.
export function speak(text, opts) {
  const o = opts || {};
  const onEnd = o.onEnd || function () {};
  const onFail = o.onFail || function () {};
  const clean = (text || "").replace(/־\s*$/, "").trim();
  if (!ttsSupported() || !clean) { onFail(); return () => {}; }

  const rate = o.rate || 1;
  let done = false;
  let guard = null;
  let start = null;
  const finish = (fn) => {
    if (done) return;
    done = true;
    if (guard) clearTimeout(guard);
    if (start) clearTimeout(start);
    fn();
  };

  try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }

  const u = new window.SpeechSynthesisUtterance(clean);
  const v = pickVoice(o.voiceURI);
  if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = "he-IL"; }
  u.rate = rate;
  u.pitch = 1;
  u.onend = () => finish(onEnd);
  u.onerror = () => finish(onFail);

  // חלק מהדפדפנים לא יורים onend אף פעם. שומר זמן לפי אורך הטקסט, שהמשחק לא ייתקע.
  guard = setTimeout(() => finish(onEnd), Math.min(20000, 1500 + (clean.length * 150) / rate));
  // כרום מפיל הקראה שמתחילה מיד אחרי cancel. 60 מילישניות פותרות את זה.
  start = setTimeout(() => {
    if (done) return;
    try { window.speechSynthesis.speak(u); } catch (e) { finish(onFail); }
  }, 60);

  return () => {
    if (!done) { done = true; if (guard) clearTimeout(guard); if (start) clearTimeout(start); }
    stopTTS();
  };
}
