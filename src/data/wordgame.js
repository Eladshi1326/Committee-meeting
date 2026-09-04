// משחק המילים: אין תסריט כתוב מראש. כל אחד מקליט בעיוורון מילים בודדות
// לפי קטגוריה, ובזמן המשחק המשפטים נבנים מהמילים האלה בסדר אקראי.
// אף אחד לא יודע לאן המילה שלו הולכת, וזו כל הבדיחה.
// יש כמה ערכות סיפור, ובכל משחק נבחרת אחת באקראי.

// כל שחקן מקליט את השם שלו. זה מנוגן בכל פעם שהשם שלו מופיע בסיפור,
// אז שומעים מי זה ולא רק קוראים.
export const NAME_PROMPT = { id: "myname", label: "השם שלך", prompt: "תגיד את השם שלך. רק את השם.", hint: "בקול ברור" };

export const WORD_PROMPTS = [
  { id: "curse",   label: "קללה",        prompt: "תגיד קללה. מילה אחת, הכי גסה שיש לך.", hint: "מילה אחת" },
  { id: "curse2",  label: "עוד קללה",    prompt: "תגיד קללה אחרת. יותר גרועה מהקודמת.", hint: "מילה אחת" },
  { id: "body",    label: "חלק גוף",     prompt: "תגיד חלק גוף.", hint: "מילה אחת" },
  { id: "body2",   label: "חלק גוף גס",  prompt: "תגיד חלק גוף שלא נעים להגיד בקול.", hint: "מילה אחת" },
  { id: "gross",   label: "משהו דוחה",   prompt: "תגיד משהו דוחה.", hint: "מילה אחת" },
  { id: "verb",    label: "פקודה",       prompt: "תגיד פועל בציווי. משהו שאתה מצווה על מישהו לעשות.", hint: "מילה אחת: תרוץ, תלקק, תשתוק" },
  { id: "animal",  label: "חיה",         prompt: "תגיד חיה.", hint: "מילה אחת" },
  { id: "job",     label: "מקצוע",       prompt: "תגיד מקצוע.", hint: "מילה אחת" },
  { id: "num",     label: "מספר",        prompt: "תגיד מספר. כל מספר שבא לך.", hint: "מילה אחת" },
  { id: "adj",     label: "תואר גס",     prompt: "תגיד תואר. איך אתה מתאר משהו נורא.", hint: "מילה אחת: מזוין, דוחה, רקוב" },
  { id: "object",  label: "חפץ בבית",    prompt: "תגיד חפץ שיש לך בבית.", hint: "מילה אחת" },
  { id: "place",   label: "מקום",        prompt: "תגיד מקום.", hint: "מילה אחת" },
  { id: "food",    label: "אוכל",        prompt: "תגיד אוכל.", hint: "מילה אחת" },
  { id: "fluid",   label: "נוזל",        prompt: "תגיד נוזל. כל נוזל.", hint: "מילה אחת" },
  { id: "insult",  label: "עלבון",       prompt: "תגיד עלבון. איך קוראים למישהו שאתה לא סובל.", hint: "מילה אחת" },
  { id: "clothes", label: "בגד",         prompt: "תגיד פריט לבוש.", hint: "מילה אחת" },
  { id: "noise",   label: "רעש",         prompt: "תעשה רעש בפה. לא מילה, רעש.", hint: "צליל, לא מילה" },
  { id: "shout",   label: "קריאה",       prompt: "תצעק משהו. קריאה, לא משפט.", hint: "יאללה! וואלה! אוי!" },
  { id: "threat",  label: "איום",        prompt: "תגיד איום קצר. משפט אחד.", hint: "משפט קצר" },
  { id: "confess", label: "וידוי",       prompt: "תגיד וידוי מביך עליך. משפט אחד.", hint: "משפט קצר" },
];

// חוקי המשחק, חתוכים לחתיכות. כל שחקן מקליט חלק מהן,
// ובהשמעה שומעים את כולם מסבירים את החוקים בתורות.
export const RULE_PARTS = [
  { id: "r0", text: "ברוכים הבאים. אף אחד פה לא יודע מה הוא מקליט, וזה בכוונה." },
  { id: "r1", text: "כל אחד קיבל את הטלפון לבד והקליט מילים בלי לראות את הסיפור." },
  { id: "r2", text: "אף אחד לא יודע לאן המילה שלו הולכת. גם אני לא ידעתי." },
  { id: "r3", text: "עכשיו הטלפון מרכיב מהמילים שלכם סיפור, וזה ייצא נורא." },
  { id: "r4", text: "החוק היחיד: מי שאמר את המילה שהצחיקה הכי חזק, שותה." },
  { id: "r5", text: "מי שמתבייש במילה שלו, שותה פעמיים ומודה בקול שזאת שלו." },
  { id: "r6", text: "אסור לתקן, אסור להסביר, ואסור להגיד ״לא ככה התכוונתי״." },
  { id: "r7", text: "בסוף לוחצים על סיפור חדש והכל מתערבב מחדש. יאללה." },
];

import { SET_A } from "./wordsets/setA.js";
import { EXTRA_SETS } from "./wordsets/index.js";

export const STORY_SETS = [SET_A, ...EXTRA_SETS];

// תאימות לאחור
export const CHAPTERS = SET_A.chapters;

export const RECORD_LIMIT = 20;

// ---- קטגוריות שמותר להחליף ביניהן ----
// מילה נכנסת רק למקום מהקטגוריה שלה. אם נגמרו, מותר רק "קרוב משפחה" שנשמע
// נכון באותו משפט (עלבון במקום קללה, רעש במקום צעקה). אף פעם לא מספר במקום צעקה.
export const CAT_GROUPS = [
  ["curse", "curse2", "insult"],
  ["body", "body2"],
  ["shout", "noise"],
  ["gross", "fluid"],
  ["object", "clothes"],
  ["threat", "confess"],
];
const GROUP_OF = {};
CAT_GROUPS.forEach((g, i) => g.forEach((c) => { GROUP_OF[c] = "g" + i; }));
export function groupOf(cat) { return GROUP_OF[cat] || cat; }

// ---- זכר / נקבה ----
// בטקסט של הערכות: {זכר|נקבה}. למשל "נשבע{|ה} ש{הוא|היא} מכיר{|ה}".
// הצורה נבחרת לפי השחקן שהשם שלו הופיע אחרון בפרק.
const GENDER_RE = /\{([^{}|]*)\|([^{}]*)\}/g;
export function hasGender(text) { return /\{[^{}|]*\|[^{}]*\}/.test(text || ""); }
export function genderText(text, g) {
  return (text || "").replace(GENDER_RE, (_, m, f) => (g === "f" ? f : m));
}

// ---- בניית מה שצריך להקליט ----
// roster = [{ id, name, g }]. ה-id יציב ולא משתנה כשמוחקים שחקן מהאמצע,
// אחרת ההקלטות של כל מי שאחריו היו נדבקות לאדם הלא נכון. g = "m" | "f".

export function activeRoster(roster, narrator) {
  const r = (roster || []).filter((x) => x && x.id);
  const out = r.filter((_, i) => i !== narrator);
  return out.length ? out : r;
}

export function ruleIdsFor(roster, narrator, index) {
  const act = activeRoster(roster, narrator);
  const me = (roster || [])[index];
  const k = me ? act.findIndex((x) => x.id === me.id) : -1;
  if (k < 0) return [];
  return RULE_PARTS.filter((_, i) => i % act.length === k).map((r) => r.id);
}

export function wordRecId(playerId, promptId) {
  return "wg_" + playerId + "_" + promptId;
}

export function ruleRecId(ruleId) {
  return "wg_" + ruleId;
}

// מה שחקן אחד צריך להקליט. המקריא לא מקליט מילים בכלל — הוא מקליט את הסיפור (למטה).
export function buildPlayerTasks(roster, narrator, index) {
  const me = (roster || [])[index];
  if (!me) return [];
  if (index === narrator) return [];
  const out = [{
    id: wordRecId(me.id, NAME_PROMPT.id),
    kind: "name", cat: NAME_PROMPT.id, speaker: NAME_PROMPT.id,
    text: NAME_PROMPT.prompt, hint: NAME_PROMPT.hint, label: NAME_PROMPT.label,
  }];
  WORD_PROMPTS.forEach((p) => out.push({
    id: wordRecId(me.id, p.id),
    kind: "word", cat: p.id, speaker: p.id,
    text: p.prompt, hint: p.hint, label: p.label,
  }));
  ruleIdsFor(roster, narrator, index).forEach((rid) => {
    const r = RULE_PARTS.find((x) => x.id === rid);
    out.push({
      id: ruleRecId(rid), kind: "rule", cat: "rule", speaker: "rule",
      text: r.text, hint: "תקריא בדיוק ככה", label: "חוק",
    });
  });
  return out;
}

// מה שחייבים כדי לשחק — בלי המקריא
export function allTasks(roster, narrator) {
  const out = [];
  const seen = new Set();
  (roster || []).forEach((_, i) => {
    if (i === narrator) return;
    buildPlayerTasks(roster, narrator, i).forEach((t) => {
      if (!seen.has(t.id)) { seen.add(t.id); out.push(t); }
    });
  });
  return out;
}

export function storyProgress(roster, recordings, narrator) {
  const tasks = allTasks(roster, narrator);
  const done = tasks.filter((t) => recordings[t.id]).length;
  return { total: tasks.length, done };
}

// ---- המקריא ----
// המקריא לא משתתף במילים. אחרי שכולם סיימו הוא מקליט את כל קטעי הטקסט
// של הערכה שנבחרה, בסדר אקראי, ובהשמעה שומעים אותו מספר את הסיפור.
// ההקלטות שלו נשמרות לפי מי הוא ואיזו ערכה, אז החלפת מקריא או ערכה לא מוחקת כלום.

export function getSet(setId) {
  return STORY_SETS.find((s) => s.id === setId) || null;
}

export function pickSetId(seed) {
  const rnd = seeded(seed || Date.now());
  return STORY_SETS[Math.floor(rnd() * STORY_SETS.length)].id;
}

export function nextSetId(setId) {
  const i = STORY_SETS.findIndex((s) => s.id === setId);
  return STORY_SETS[(i + 1) % STORY_SETS.length].id;
}

export function narrTextId(playerId, setId, ci, pi, g) {
  const set = getSet(setId);
  const rev = set && set.rev ? "r" + set.rev : "";
  return "wg_n_" + playerId + "_" + setId + rev + "_" + ci + "_" + pi + (g ? "_" + g : "");
}

// אילו מינים יש בין השחקנים הפעילים (בלי המקריא). ברירת מחדל: זכר.
function gendersIn(roster, narrator) {
  const gs = new Set(activeRoster(roster, narrator).map((p) => (p.g === "f" ? "f" : "m")));
  return gs.size ? Array.from(gs).sort() : ["m"];
}

// כל קטעי הטקסט שהמקריא צריך להקליט: רק פרקים שבכלל יכולים לקרות עם כמות השחקנים הזאת.
// קטע שיש בו זכר/נקבה מוקלט פעם לכל מין שיש בקבוצה, כי לא יודעים מראש איזה שם ייפול שם.
export function narratorTasks(roster, narrator, setId) {
  const me = (roster || [])[narrator];
  const set = getSet(setId);
  if (!me || !set) return [];
  const n = Math.max(1, activeRoster(roster, narrator).length);
  const genders = gendersIn(roster, narrator);
  const out = [];
  const hint = "תקריא בדיוק ככה, כמו מספר סיפורים. בלי לנחש מה בא לפני ואחרי.";
  set.chapters.forEach((c, ci) => {
    if (n < c.min) return;
    c.parts.forEach((p, pi) => {
      if (!p.t || !p.t.trim()) return;
      if (!hasGender(p.t)) {
        out.push({ id: narrTextId(me.id, set.id, ci, pi), kind: "narr", cat: "narr", speaker: "narr", text: p.t, hint, label: "קטע מהסיפור" });
        return;
      }
      genders.forEach((g) => out.push({
        id: narrTextId(me.id, set.id, ci, pi, g), kind: "narr", cat: "narr", speaker: "narr",
        text: genderText(p.t, g), hint, label: g === "f" ? "קטע מהסיפור · על בחורה" : "קטע מהסיפור · על בחור",
      }));
    });
  });
  return out;
}

export function narratorProgress(roster, narrator, recordings, setId) {
  const tasks = narratorTasks(roster, narrator, setId);
  const done = tasks.filter((t) => recordings[t.id]).length;
  return { total: tasks.length, done };
}

// ---- הרכבת הסיפור ----
function seeded(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// כמה מקומות מכל משפחת קטגוריות פרק דורש
function chapterDemand(c) {
  const d = {};
  c.parts.forEach((p) => { if (p.cat) { const g = groupOf(p.cat); d[g] = (d[g] || 0) + 1; } });
  return d;
}

// בוחר ערכה, ממלא כל מקום בהקלטה של מישהו, ומשבץ שמות אמיתיים.
// הכללים: מילה נכנסת רק למקום מהקטגוריה שלה (או קרוב משפחה), אף הקלטה לא נשמעת
// פעמיים, מי שנשמע הכי מעט מקבל עדיפות, והמקריא בחוץ — הוא לא מופיע בסיפור, רק מספר אותו.
// setId = הערכה שננעלה בשביל המקריא. בלי מקריא הערכה מוגרלת מחדש בכל סיפור.
export function buildStory(roster, recordings, seed, narrator, setId) {
  const all = (roster || []).filter((x) => x && x.id);
  const rnd = seeded(seed || 1);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  const act = activeRoster(roster, narrator);
  const n = Math.max(1, act.length);
  const reader = narrator >= 0 && all[narrator] ? all[narrator] : null;

  const rolled = STORY_SETS[Math.floor(rnd() * STORY_SETS.length)] || STORY_SETS[0];
  const set = getSet(setId) || rolled;

  // מאגר לכל קטגוריה, ומאגר לכל משפחה
  const pools = {};
  const groupPools = {};
  WORD_PROMPTS.forEach((w) => {
    const ids = [];
    act.forEach((pl) => {
      const id = wordRecId(pl.id, w.id);
      if (recordings[id]) ids.push({ id, player: pl.id, name: pl.name, cat: w.id });
    });
    pools[w.id] = shuffle(ids);
    const g = groupOf(w.id);
    groupPools[g] = (groupPools[g] || []).concat(pools[w.id]);
  });

  const heard = {};
  const named = {};
  act.forEach((pl) => { heard[pl.id] = 0; named[pl.id] = 0; });
  const usedIds = new Set();

  const pickLeastHeard = (list) => {
    let best = 0;
    for (let i = 1; i < list.length; i++) {
      if (heard[list[i].player] < heard[list[best].player]) best = i;
      else if (heard[list[i].player] === heard[list[best].player] && rnd() < 0.35) best = i;
    }
    return list[best];
  };

  // סדר עדיפויות: אותה קטגוריה שעוד לא נשמעה → קרוב משפחה שעוד לא נשמע →
  // אותה קטגוריה שוב → קרוב משפחה שוב. אף פעם לא קטגוריה זרה.
  const take = (cat) => {
    const g = groupOf(cat);
    const fresh = (list) => (list || []).filter((r) => !usedIds.has(r.id));
    const tries = [
      { list: fresh(pools[cat]), borrowed: false, repeat: false },
      { list: fresh(groupPools[g]), borrowed: true, repeat: false },
      { list: pools[cat] || [], borrowed: false, repeat: true },
      { list: groupPools[g] || [], borrowed: true, repeat: true },
    ];
    for (const t of tries) {
      if (!t.list.length) continue;
      const pick = pickLeastHeard(t.list);
      usedIds.add(pick.id);
      heard[pick.player]++;
      return { ...pick, borrowed: t.borrowed && pick.cat !== cat, repeat: t.repeat };
    }
    return null;
  };

  const takeName = () => {
    let best = act[0];
    act.forEach((pl) => { if (named[pl.id] < named[best.id]) best = pl; });
    named[best.id]++;
    const rid = wordRecId(best.id, "myname");
    return { name: best.name, player: best.id, g: best.g === "f" ? "f" : "m", recId: recordings[rid] ? rid : null };
  };

  // בחירת פרקים: רק פרקים שמתאימים לכמות השחקנים, ורק כאלה שיש להם מספיק
  // הקלטות מהקטגוריות הנכונות — ככה אף מילה לא חוזרת ואף מילה לא נכנסת למקום זר.
  // פרק הסיום שמור מראש, כדי שלסיפור תמיד יהיה סוף.
  const capacity = {};
  Object.keys(groupPools).forEach((g) => { capacity[g] = groupPools[g].length; });
  const fits = (d) => Object.keys(d).every((g) => (capacity[g] || 0) >= d[g]);
  const spend = (d) => Object.keys(d).forEach((g) => { capacity[g] = (capacity[g] || 0) - d[g]; });

  const eligible = set.chapters.map((c, ci) => ({ ...c, ci })).filter((c) => n >= c.min);
  const ending = eligible.length > 1 ? eligible[eligible.length - 1] : null;
  const middle = ending ? eligible.slice(0, -1) : eligible;
  let endingFits = false;
  if (ending) {
    const d = chapterDemand(ending);
    endingFits = fits(d);
    if (endingFits) spend(d);
  }
  const chosen = [];
  middle.forEach((c) => {
    const d = chapterDemand(c);
    if (fits(d)) { chosen.push(c); spend(d); }
  });
  if (ending) chosen.push(ending);
  // כמעט אין הקלטות? עדיף סיפור עם חזרות מאשר בלי סיפור
  if (!chosen.length && eligible.length) chosen.push(eligible[0]);
  const chapters = chosen;

  const built = chapters.map((c) => {
    let curG = "m"; // המין של השם האחרון שהופיע בפרק — קובע זכר/נקבה בטקסט שאחריו
    return {
      title: c.title,
      parts: c.parts.map((p, pi) => {
        if (p.who) {
          const w = takeName();
          curG = w.g;
          return { text: w.name, isName: true, player: w.player, recId: w.recId };
        }
        if (!p.cat) {
          const gendered = hasGender(p.t);
          const text = gendered ? genderText(p.t, curG) : p.t;
          const nid = reader ? narrTextId(reader.id, set.id, c.ci, pi, gendered ? curG : null) : null;
          if (nid && recordings[nid]) return { text, recId: nid, narr: true };
          return { text };
        }
        const prompt = WORD_PROMPTS.find((w) => w.id === p.cat);
        const label = (prompt && prompt.label) || p.cat;
        const pick = take(p.cat);
        if (!pick) return { slot: p.cat, label, missing: true };
        return { slot: p.cat, label, recId: pick.id, player: pick.player, borrowed: !!pick.borrowed, repeat: !!pick.repeat };
      }),
    };
  });
  built.setTitle = set.title;
  built.setId = set.id;
  return built;
}

// לבדיקה: כמה פעמים כל שחקן נשמע
export function voiceBalance(story, roster) {
  const c = {};
  (roster || []).forEach((r) => { c[r.id] = 0; });
  story.forEach((ch) => ch.parts.forEach((p) => { if (p.recId && p.player != null && c[p.player] != null) c[p.player]++; }));
  return c;
}
