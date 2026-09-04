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

// הסיפור. t = טקסט שמופיע על המסך, cat = מקום שמתמלא בהקלטה של מישהו.
// min = מכמה שחקנים הפרק הזה קיים בכלל, ככה שקבוצה גדולה מקבלת סיפור ארוך יותר.
const SET_A = {
  id: "a",
  title: "הלילה בדירה",
  chapters: [
  {
    min: 1, title: "אחת בלילה",
    parts: [
      { t: "השעה הייתה" }, { cat: "num" }, { t: "בלילה כשמישהו דפק בדלת וצעק" }, { cat: "shout" },
      { t: "היחיד שקם לפתוח היה" }, { who: true },
      { t: "פתחנו. בחוץ עמד בן אדם. לפי הבגדים, כנראה" }, { cat: "job" },
      { t: "הוא הסתכל עלינו ואמר מילה אחת:" }, { cat: "curse" },
    ],
  },
  {
    min: 1, title: "השקית",
    parts: [
      { t: "הוא הביא שקית. בשקית היה" }, { cat: "gross" },
      { t: "וגם משהו שנראה כמו" }, { cat: "food" },
      { t: "הריח היה" }, { cat: "adj" }, { t: "וזה נכנס לנו לבגדים." },
      { who: true }, { t: "הריח קודם, ואז הקיא לתוך הכיור בלי להתנצל." },
      { t: "הוא אמר שזה בשביל" }, { cat: "body" }, { t: "ושאסור לשאול שאלות." },
    ],
  },
  {
    min: 1, title: "החוקים שלו",
    parts: [
      { t: "הוא הכריז על משחק. חוק ראשון:" }, { cat: "verb" },
      { t: "חוק שני: מי שמפסיד מראה לכולם את" }, { cat: "body2" },
      { who: true }, { t: "התנגד ואמר לו בפרצוף:" }, { cat: "threat" },
      { t: "הוא ענה בשקט:" }, { cat: "curse2" },
    ],
  },
  {
    min: 1, title: "הסיבוב הראשון",
    parts: [
      { t: "התחלנו לשחק. הראשון שהפסיד היה" }, { who: true }, { t: "והוא היה חייב להתוודות, אז הוא אמר:" }, { cat: "confess" },
      { t: "כולם שתקו." }, { who: true }, { t: "לחש" }, { cat: "curse" },
      { t: "ואז מישהו אחר צעק" }, { cat: "shout" }, { t: "וזה נהיה בלגן." },
    ],
  },
  {
    min: 1, title: "מה שהיה במקרר",
    parts: [
      { t: "בשלב הזה פתחנו את המקרר. בפנים היה" }, { cat: "gross" },
      { t: "לידו" }, { who: true }, { t: "שם" }, { cat: "object" }, { t: "בלי הסבר, וסגר את הדלת כאילו לא ראינו." },
      { t: "אמרנו שנזרוק את זה מחר. זה עדיין שם." },
    ],
  },
  {
    min: 1, title: "החיה",
    parts: [
      { t: "ואז נכנס לחדר בעל חיים. זה היה" }, { cat: "animal" },
      { t: "אף אחד לא ידע של מי הוא. הוא הלך ישר אל" }, { cat: "object" },
      { t: "ועשה עליו משהו" }, { cat: "adj" },
      { who: true }, { t: "צילם את זה מכל הזוויות. אנחנו מצטערים על זה עד היום." },
    ],
  },
  {
    min: 3, title: "השכנה",
    parts: [
      { t: "בשעה" }, { cat: "num" }, { t: "השכנה מלמטה עלתה. היא אמרה שהיא שומעת" }, { cat: "gross" },
      { t: "דרך הרצפה, ושהיא קמה מוקדם כי היא" }, { cat: "job" },
      { t: "היא הסתכלה ישר על" }, { who: true }, { t: "וצעקה" }, { cat: "curse2" },
      { t: "הזמנו אותה להיכנס. היא נכנסה. זאת הייתה טעות." },
    ],
  },
  {
    min: 3, title: "המשחק השני",
    parts: [
      { t: "היא הציעה משחק משלה. החוק:" }, { cat: "verb" },
      { t: "מי שמסרב, שותה וגם נוגע ב" }, { cat: "body" },
      { t: "של מי שיושב לידו. אף אחד לא סירב." },
      { t: "אחרי שלושה סיבובים" }, { who: true }, { t: "התוודה מול כולם:" }, { cat: "confess" },
    ],
  },
  {
    min: 4, title: "הטלפון",
    parts: [
      { who: true }, { t: "מצא טלפון על השולחן ופתח אותו. בגלריה היה" }, { cat: "gross" },
      { t: "ומאתיים תמונות של" }, { cat: "animal" },
      { t: "בעל הטלפון קם, אמר" }, { cat: "threat" },
      { t: "ולקח אותו בחזרה. אף אחד לא דיבר על זה יותר." },
    ],
  },
  {
    min: 4, title: "האוכל",
    parts: [
      { t: "התחיל להיות רעב. הזמנו" }, { cat: "food" },
      { t: "וזה הגיע אחרי" }, { cat: "num" }, { t: "שעות, קר לגמרי." },
      { t: "מי שהביא את זה נראה" }, { cat: "adj" },
      { t: "ו" }, { who: true }, { t: "אמר לו" }, { cat: "curse" }, { t: "בטעות, בקול רם, והוא שמע." },
    ],
  },
  {
    min: 6, title: "המשטרה",
    parts: [
      { t: "בשלב הזה הגיעה המשטרה. השוטר שאל מי אחראי, וכולם הצביעו על" }, { cat: "job" },
      { t: "הוא הסביר בנימוס:" }, { cat: "confess" },
      { t: "השוטר רשם הכל, הסתכל עלינו ואמר" }, { cat: "curse2" },
      { t: "ואז הוא לקח" }, { cat: "food" }, { t: "מהשולחן והלך." },
    ],
  },
  {
    min: 6, title: "הגג",
    parts: [
      { t: "עלינו לגג. משם רואים את" }, { cat: "place" },
      { who: true }, { t: "רצה להוציא את" }, { cat: "body2" }, { t: "ולהשתין מהגג לכיוון הרחוב." },
      { t: "עצרנו אותו. הוא צעק" }, { cat: "shout" }, { t: "בכל מקרה." },
    ],
  },
  {
    min: 8, title: "הווידויים",
    parts: [
      { t: "בארבע לפנות בוקר ישבנו במעגל. הראשון אמר:" }, { cat: "confess" },
      { t: "השני אמר:" }, { cat: "confess" },
      { t: "השלישי היה" }, { who: true }, { t: "והוא לא אמר כלום, רק הרים את החולצה והראה לנו את" }, { cat: "body" },
      { t: "ואז כולם ידעו יותר מדי אחד על השני." },
    ],
  },
  {
    min: 8, title: "מי שנעלם",
    parts: [
      { t: "ספרנו וגילינו שחסר אחד. חיפשנו אותו ב" }, { cat: "place" },
      { t: "מצאנו רק" }, { cat: "object" }, { t: "שלו על הרצפה." },
      { who: true }, { t: "נשבע שהוא ראה אותו הולך ברחוב עם" }, { cat: "animal" },
      { t: "עד היום הוא לא ענה בקבוצה." },
    ],
  },
  {
    min: 1, title: "הבוקר שאחרי",
    parts: [
      { t: "התעוררנו ב" }, { cat: "place" }, { who: true }, { t: "החזיק ביד" }, { cat: "object" },
      { t: "ולא ידע למה. על הרצפה היה" }, { cat: "gross" },
      { t: "וכולנו הסכמנו על דבר אחד: לא מספרים לאף אחד, ובעיקר לא ל" }, { cat: "job" },
      { t: "סוף." },
    ],
  },
  ],
};

import { EXTRA_SETS } from "./wordsets/index.js";

export const STORY_SETS = [SET_A, ...EXTRA_SETS];

// תאימות לאחור
export const CHAPTERS = SET_A.chapters;

export const RECORD_LIMIT = 20;

// ---- בניית מה שצריך להקליט ----
// כל שחקן מקליט את כל המילים (כדי שיהיה מאגר קולות מגוון) ואת החלק שלו בחוקים.
export function ruleIdsFor(playerIndex, playerCount) {
  const n = Math.max(1, playerCount);
  return RULE_PARTS.filter((_, i) => i % n === playerIndex).map((r) => r.id);
}

export function wordRecId(playerIndex, promptId) {
  return "wg_p" + playerIndex + "_" + promptId;
}

export function ruleRecId(ruleId) {
  return "wg_" + ruleId;
}

// רשימת ההקלטות של שחקן אחד, בפורמט שהאולפן הקיים יודע להציג
export function buildPlayerTasks(playerIndex, playerCount) {
  const out = [{
    id: wordRecId(playerIndex, NAME_PROMPT.id),
    kind: "name",
    cat: NAME_PROMPT.id,
    speaker: NAME_PROMPT.id,
    text: NAME_PROMPT.prompt,
    hint: NAME_PROMPT.hint,
    label: NAME_PROMPT.label,
  }];
  WORD_PROMPTS.forEach((p) => out.push({
    id: wordRecId(playerIndex, p.id),
    kind: "word",
    cat: p.id,
    speaker: p.id,
    text: p.prompt,
    hint: p.hint,
    label: p.label,
  }));
  ruleIdsFor(playerIndex, playerCount).forEach((rid) => {
    const r = RULE_PARTS.find((x) => x.id === rid);
    out.push({
      id: ruleRecId(rid),
      kind: "rule",
      cat: "rule",
      speaker: "rule",
      text: r.text,
      hint: "תקריא בדיוק ככה",
      label: "חוק",
    });
  });
  return out;
}

export function allTasks(playerCount) {
  const n = Math.max(1, playerCount);
  const out = [];
  for (let i = 0; i < n; i++) out.push(...buildPlayerTasks(i, n));
  // כל חוק מוקלט פעם אחת בלבד
  const seen = new Set();
  return out.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
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

// בונה סיפור: בוחר ערכה, ממלא כל מקום בהקלטה של מישהו, ומשבץ שמות אמיתיים.
// שני כללים: אותה הקלטה לא חוזרת עד שכל הקטגוריה נוצלה, ומי שנשמע הכי מעט
// מקבל עדיפות — כדי שכולם יישמעו כמה שיותר שווה.
export function buildStory(playerCount, recordings, seed, players) {
  const n = Math.max(1, playerCount);
  const rnd = seeded(seed || 1);
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  const set = STORY_SETS[Math.floor(rnd() * STORY_SETS.length)] || STORY_SETS[0];

  const pools = {};
  WORD_PROMPTS.forEach((w) => {
    const ids = [];
    for (let i = 0; i < n; i++) {
      const id = wordRecId(i, w.id);
      if (recordings[id]) ids.push({ id, player: i });
    }
    pools[w.id] = shuffle(ids);
  });

  const heard = new Array(n).fill(0);   // כמה פעמים כל שחקן נשמע
  const named = new Array(n).fill(0);   // כמה פעמים כל שחקן הוזכר בשם

  const allRecs = [];
  WORD_PROMPTS.forEach((w) => (pools[w.id] || []).forEach((r) => allRecs.push(r)));
  const usedIds = new Set();

  // אף מילה לא נשמעת פעמיים. אם הקטגוריה נגמרה, לוקחים הקלטה שעוד לא
  // הושמעה מקטגוריה אחרת — מילה לא צפויה עדיפה על מילה חוזרת.
  const take = (cat) => {
    let list = (pools[cat] || []).filter((r) => !usedIds.has(r.id));
    let borrowed = false;
    if (!list.length) {
      list = allRecs.filter((r) => !usedIds.has(r.id));
      borrowed = true;
    }
    if (!list.length) {
      list = (pools[cat] && pools[cat].length) ? pools[cat] : allRecs;
      borrowed = !(pools[cat] && pools[cat].length);
    }
    if (!list.length) return null;
    let best = 0;
    for (let i = 1; i < list.length; i++) {
      if (heard[list[i].player] < heard[list[best].player]) best = i;
      else if (heard[list[i].player] === heard[list[best].player] && rnd() < 0.35) best = i;
    }
    const pick = list[best];
    usedIds.add(pick.id);
    heard[pick.player]++;
    return { ...pick, borrowed };
  };

  const takeName = () => {
    let best = 0;
    for (let i = 1; i < n; i++) if (named[i] < named[best]) best = i;
    named[best]++;
    const nm = (players && players[best]) || "שחקן " + (best + 1);
    const rid = wordRecId(best, "myname");
    return { name: nm, player: best, recId: recordings[rid] ? rid : null };
  };

  // אף מילה לא חוזרת: אם אין מספיק הקלטות לכל המקומות, מקצרים את הסיפור
  // במקום להשמיע פעמיים את אותו דבר.
  let chapters = set.chapters.filter((c) => n >= c.min);
  const budget = allRecs.length;
  let spent = 0;
  const fitted = [];
  for (const c of chapters) {
    const need = c.parts.filter((x) => x.cat).length;
    if (spent + need > budget && fitted.length) break;
    fitted.push(c);
    spent += need;
  }
  chapters = fitted;

  const built = chapters.map((c) => ({
    title: c.title,
    parts: c.parts.map((p) => {
      if (p.who) { const w = takeName(); return { text: w.name, isName: true, player: w.player, recId: w.recId }; }
      if (!p.cat) return { text: p.t };
      const prompt = WORD_PROMPTS.find((w) => w.id === p.cat);
      const label = (prompt && prompt.label) || p.cat;
      const pick = take(p.cat);
      if (!pick) return { slot: p.cat, label, missing: true };
      return { slot: p.cat, label, recId: pick.id, player: pick.player, borrowed: !!pick.borrowed };
    }),
  }));
  built.setTitle = set.title;
  return built;
}

// לבדיקה: כמה פעמים כל שחקן נשמע בסיפור
export function voiceBalance(story, playerCount) {
  const c = new Array(Math.max(1, playerCount)).fill(0);
  story.forEach((ch) => ch.parts.forEach((p) => { if (p.recId != null && p.player != null) c[p.player]++; }));
  return c;
}

export function storyProgress(playerCount, recordings) {
  const tasks = allTasks(playerCount);
  const done = tasks.filter((t) => recordings[t.id]).length;
  return { total: tasks.length, done };
}
