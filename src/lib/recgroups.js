// קיבוץ ההקלטות לקבוצות שאפשר למחוק בנפרד, כדי שלא צריך למחוק הכל
// רק בשביל להחליף אדם אחד או להקליט מחדש סיפור אחד.
import { ALL_STORIES } from "../data/stories.js";
import { flattenLines } from "./script.js";
import { STORY_SETS, WORD_PROMPTS, NAME_PROMPT, RULE_PARTS, ruleRecId } from "../data/wordgame.js";

// wg_<playerId>_<promptId>            מילה של שחקן
// wg_r3                               חוק
// wg_n_<playerId>_<setId>_<ci>_<pi>   קטע סיפור שהמקריא הקליט
export function parseRecId(id) {
  const p = String(id || "").split("_");
  if (p[0] !== "wg") return { kind: "line", id };
  if (p.length === 2) return { kind: "rule", id, ruleId: p[1] };
  if (p[1] === "n" && p.length >= 5) return { kind: "narr", id, player: p[2], set: p[3] };
  if (p.length === 3) return { kind: "word", id, player: p[1], prompt: p[2] };
  return { kind: "other", id };
}

function many(n, one, more) {
  return n === 1 ? one : n + " " + more;
}

function setTitle(setKey) {
  const base = String(setKey || "").replace(/r\d+$/, "");
  const s = STORY_SETS.find((x) => x.id === base);
  return s ? s.title : "ערכה " + base;
}

// מחזיר רשימת קבוצות: { key, title, note, ids, tone }
export function recordingGroups(recordings, roster) {
  const ids = Object.keys(recordings || {});
  const used = new Set();
  const groups = [];
  const people = (roster || []).filter((r) => r && r.id);

  const wordIds = {};   // playerId -> ids
  const narrIds = {};   // playerId|set -> ids
  const ruleIds = [];
  ids.forEach((id) => {
    const p = parseRecId(id);
    if (p.kind === "word") { (wordIds[p.player] = wordIds[p.player] || []).push(id); used.add(id); }
    else if (p.kind === "narr") { const k = p.player + "|" + p.set; (narrIds[k] = narrIds[k] || []).push(id); used.add(id); }
    else if (p.kind === "rule") { ruleIds.push(id); used.add(id); }
  });

  const perPlayer = WORD_PROMPTS.length + 1; // 20 מילים + השם
  people.forEach((r) => {
    const mine = wordIds[r.id] || [];
    if (!mine.length) return;
    groups.push({
      key: "words:" + r.id, section: "משחק המילים", title: r.name,
      note: mine.length + " מתוך " + perPlayer + " הקלטות", ids: mine,
    });
    delete wordIds[r.id];
  });
  // שחקנים שכבר לא ברשימה — בדיוק המקרה של "החלפתי אנשים"
  Object.keys(wordIds).forEach((pid) => {
    groups.push({
      key: "words:" + pid, section: "משחק המילים", title: "שחקן שכבר לא במשחק",
      note: many(wordIds[pid].length, "הקלטה אחת שנשארה", "הקלטות שנשארו") + " מאדם שהוסר", ids: wordIds[pid], stale: true,
    });
  });
  if (ruleIds.length) {
    groups.push({
      key: "rules", section: "משחק המילים", title: "החוקים בהתחלה",
      note: ruleIds.length + " מתוך " + RULE_PARTS.length + " קטעים", ids: ruleIds,
    });
  }
  Object.keys(narrIds).forEach((k) => {
    const [pid, setKey] = k.split("|");
    const who = (people.find((r) => r.id === pid) || {}).name;
    groups.push({
      key: "narr:" + k, section: "הקראות של המקריא",
      title: (who || "מקריא קודם") + " · " + setTitle(setKey),
      note: many(narrIds[k].length, "קטע אחד מוקלט", "קטעים מוקלטים"), ids: narrIds[k], stale: !who,
    });
  });

  // סיפורים כתובים: לפי שיוך של ה-id לסיפור
  ALL_STORIES.forEach((st) => {
    const mine = flattenLines(st).map((l) => l.id).filter((id) => recordings[id]);
    if (!mine.length) return;
    mine.forEach((id) => used.add(id));
    groups.push({
      key: "story:" + st.id, section: "סיפורים כתובים", title: st.title || st.id,
      note: many(mine.length, "שורה אחת מוקלטת", "שורות מוקלטות"), ids: mine,
    });
  });

  const rest = ids.filter((id) => !used.has(id));
  if (rest.length) {
    groups.push({ key: "rest", section: "שונות", title: "הקלטות ישנות", note: many(rest.length, "הקלטה אחת שלא שייכת", "הקלטות שלא שייכות") + " לשום סיפור פעיל", ids: rest, stale: true });
  }
  return groups;
}

export function groupSections(groups) {
  const out = [];
  groups.forEach((g) => {
    let s = out.find((x) => x.name === g.section);
    if (!s) { s = { name: g.section, items: [] }; out.push(s); }
    s.items.push(g);
  });
  return out;
}
