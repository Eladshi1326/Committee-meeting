import { T } from "../theme.js";

export function getChar(chars, key) {
  return (chars && chars[key]) || { name: key || "?", role: "", emoji: "🗣️", color: "#a5978a" };
}

// כל השורות והאפשרויות בסדר הקלטה נוח: צומת אחרי צומת
export function flattenLines(script) {
  const out = [];
  const nodes = (script && script.nodes) || {};
  Object.keys(nodes).forEach((nodeId, nodeIndex) => {
    const n = nodes[nodeId] || {};
    (n.lines || []).forEach((l) =>
      out.push({ id: l.id, kind: "line", speaker: l.speaker, text: l.text, nodeId, nodeIndex, scene: n.scene || "" })
    );
    (n.choices || []).forEach((c) =>
      out.push({ id: c.id, kind: "choice", speaker: "you", text: c.text, nodeId, nodeIndex, scene: n.scene || "" })
    );
  });
  return out;
}

export function countLines(lines, recordings) {
  const c = { total: lines.length, recorded: 0, npcTotal: 0, npcRecorded: 0, choiceTotal: 0, choiceRecorded: 0 };
  lines.forEach((l) => {
    const done = !!recordings[l.id];
    if (done) c.recorded++;
    if (l.kind === "choice") { c.choiceTotal++; if (done) c.choiceRecorded++; }
    else { c.npcTotal++; if (done) c.npcRecorded++; }
  });
  return c;
}

export function updateLineText(script, id, text) {
  const nodes = {};
  Object.keys(script.nodes || {}).forEach((k) => {
    const n = script.nodes[k];
    const next = { ...n, lines: (n.lines || []).map((l) => (l.id === id ? { ...l, text } : l)) };
    if (n.choices) next.choices = n.choices.map((c) => (c.id === id ? { ...c, text } : c));
    nodes[k] = next;
  });
  return { ...script, nodes };
}

export function endingIds(script) {
  const nodes = (script && script.nodes) || {};
  return Object.keys(nodes).filter((k) => nodes[k] && nodes[k].ending);
}

export function choiceAvailable(choice, flags) {
  const req = choice.requires;
  if (!req) return true;
  const list = Array.isArray(req) ? req : [req];
  return list.every((f) => flags.includes(f));
}

export function applyChoiceFlags(choice, flags) {
  let next = flags.slice();
  (choice.sets || []).forEach((f) => { if (!next.includes(f)) next.push(f); });
  (choice.clears || []).forEach((f) => { next = next.filter((x) => x !== f); });
  return next;
}

export function fmtSecs(s) {
  const t = Math.max(0, Math.round(s || 0));
  return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
}

// כמה זמן להשאיר שורה שאין לה הקלטה על המסך
export function textDurationMs(text) {
  return Math.min(7000, 1400 + (text || "").length * 55);
}

export function sanityColor(s) {
  return s >= 60 ? T.ok : s >= 30 ? T.lamp : T.rec;
}

export function sanityVerdict(s) {
  if (s >= 75) return "מרשים. יצאת מזה בן אדם.";
  if (s >= 45) return "סביר. תישן פחות, אבל תישן.";
  if (s >= 20) return "אתה מדבר עם המעלית. היא לא עונה. עדיין.";
  return "שולה גאה בך. זה הדבר הכי גרוע שיכול לקרות.";
}

// בדיקה בסיסית של תסריט שהודבק בעורך
export function validateScript(s) {
  if (!s || typeof s !== "object") return "זה לא אובייקט JSON";
  if (!s.nodes || typeof s.nodes !== "object") return "חסר השדה nodes";
  if (!s.start || !s.nodes[s.start]) return "השדה start חייב להצביע על צומת קיים";
  const ids = new Set();
  for (const k of Object.keys(s.nodes)) {
    const n = s.nodes[k];
    for (const item of [...(n.lines || []), ...(n.choices || [])]) {
      if (!item.id) return "יש שורה בלי id בצומת " + k;
      if (ids.has(item.id)) return "ה-id ״" + item.id + "״ מופיע פעמיים";
      ids.add(item.id);
    }
    for (const c of n.choices || []) {
      if (!c.next || !s.nodes[c.next]) return "האפשרות ״" + (c.text || c.id) + "״ מצביעה על צומת שלא קיים: " + c.next;
    }
    if (!n.ending && !(n.choices && n.choices.length)) return "הצומת " + k + " צריך choices או ending";
  }
  return "";
}
