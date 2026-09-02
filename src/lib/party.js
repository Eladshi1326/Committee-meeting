import { seededRandom } from "./script.js";

// מחלק את השורות בין השחקנים. החלוקה נגזרת מזרע, אז היא קבועה בין כניסות
// ואף אחד לא מקבל פתאום שורות של מישהו אחר באמצע ההקלטה.
//
// mode "line" — חלוקה אקראית שווה. כל דמות תישמע בכל פעם בקול אחר. זו הבדיחה.
// mode "char" — כל דמות שייכת לשחקן אחד, אז הקול שלה קבוע. פחות הוגן בחלוקה.
export function assignLines(lines, playerCount, mode, seed, _chars) {
  const out = {};
  if (!lines || !lines.length) return out;
  if (!playerCount || playerCount < 2) {
    lines.forEach((l) => { out[l.id] = 0; });
    return out;
  }
  const rnd = seededRandom(seed || 1);
  const deal = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    a.forEach((l, i) => { out[l.id] = i % playerCount; });
  };

  if (mode === "char") {
    const byChar = {};
    const mine = [];
    lines.forEach((l) => {
      if (l.speaker === "you") mine.push(l);
      else (byChar[l.speaker] = byChar[l.speaker] || []).push(l);
    });
    // הדמות הגדולה ביותר הולכת לשחקן הכי פנוי, וכן הלאה
    const load = new Array(playerCount).fill(0);
    Object.keys(byChar)
      .map((k) => byChar[k])
      .sort((a, b) => b.length - a.length)
      .forEach((group) => {
        let p = 0;
        for (let i = 1; i < playerCount; i++) if (load[i] < load[p]) p = i;
        load[p] += group.length;
        group.forEach((l) => { out[l.id] = p; });
      });
    deal(mine); // התשובות שלך מתחלקות שווה בשווה בכל מקרה
  } else {
    deal(lines);
  }
  return out;
}

// כמה יש לכל שחקן וכמה כבר הקליט
export function playerProgress(lines, assign, recordings, playerCount) {
  const c = Array.from({ length: playerCount }, () => ({ total: 0, done: 0 }));
  lines.forEach((l) => {
    const p = assign[l.id];
    if (p == null || !c[p]) return;
    c[p].total++;
    if (recordings[l.id]) c[p].done++;
  });
  return c;
}
