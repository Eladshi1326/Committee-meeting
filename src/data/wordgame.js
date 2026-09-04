// משחק המילים: אין תסריט כתוב מראש. כל אחד מקליט בעיוורון מילים בודדות
// לפי קטגוריה, ובזמן המשחק המשפטים נבנים מהמילים האלה בסדר אקראי.
// אף אחד לא יודע לאן המילה שלו הולכת, וזו כל הבדיחה.

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
export const CHAPTERS = [
  {
    min: 1,
    title: "אחת בלילה",
    parts: [
      { t: "בשעה" }, { cat: "num" }, { t: "בלילה מישהו דפק בדלת וצעק" }, { cat: "shout" },
      { t: "פתחנו. בחוץ עמד" }, { cat: "job" }, { t: "אחד, ובידיים שלו" }, { cat: "object" },
      { t: "הוא הסתכל עלינו ואמר מילה אחת:" }, { cat: "curse" },
    ],
  },
  {
    min: 1,
    title: "מה שהיה בשקית",
    parts: [
      { t: "בשקית שהוא הביא היה" }, { cat: "gross" }, { t: "וגם" }, { cat: "food" },
      { t: "הריח היה" }, { cat: "adj" }, { t: "לגמרי." },
      { t: "הוא אמר שזה בשביל" }, { cat: "body" }, { t: "ושאסור לשאול שאלות." },
    ],
  },
  {
    min: 1,
    title: "המשחק",
    parts: [
      { t: "הוא הכריז על משחק. החוק הראשון:" }, { cat: "verb" },
      { t: "החוק השני: מי שמפסיד מראה לכולם את ה" }, { cat: "body2" },
      { t: "מישהו התנגד ואמר:" }, { cat: "threat" },
      { t: "אז הוא ענה בשקט:" }, { cat: "curse2" },
    ],
  },
  {
    min: 3,
    title: "החיה",
    parts: [
      { t: "בשלב הזה נכנס ל" }, { cat: "place" }, { t: "בעל חיים. זה היה" }, { cat: "animal" },
      { t: "אף אחד לא ידע של מי הוא. הוא ישר הלך ל" }, { cat: "object" },
      { t: "ועשה עליו משהו" }, { cat: "adj" },
      { t: "מישהו צילם. מישהו אחר צעק" }, { cat: "shout" },
    ],
  },
  {
    min: 4,
    title: "הווידוי",
    parts: [
      { t: "כדי להוריד את המתח כל אחד היה צריך להתוודות. הראשון אמר:" }, { cat: "confess" },
      { t: "אחריו מישהו אמר:" }, { cat: "confess" },
      { t: "ואז נהיה שקט, ומישהו לחש:" }, { cat: "curse" },
      { t: "מאותו רגע כולם ידעו יותר מדי אחד על השני." },
    ],
  },
  {
    min: 6,
    title: "המשטרה",
    parts: [
      { t: "בשעה" }, { cat: "num" }, { t: "הגיעה המשטרה. השכן התלונן על רעש ועל" }, { cat: "gross" },
      { t: "השוטר שאל מי אחראי. כולם הצביעו על ה" }, { cat: "job" },
      { t: "הוא הסביר בנימוס:" }, { cat: "confess" },
      { t: "השוטר רשם הכל, הסתכל עלינו ואמר:" }, { cat: "curse2" },
    ],
  },
  {
    min: 1,
    title: "הבוקר שאחרי",
    parts: [
      { t: "בבוקר התעוררנו ב" }, { cat: "place" }, { t: "אחד מאיתנו החזיק" }, { cat: "object" },
      { t: "ולא ידע למה. על הרצפה היה" }, { cat: "gross" },
      { t: "וכולנו הסכמנו על דבר אחד: לא מספרים לאף אחד. ובעיקר לא ל" }, { cat: "job" },
      { t: "סוף." },
    ],
  },
];

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
  const out = WORD_PROMPTS.map((p) => ({
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

// לכל מקום בסיפור בוחרים הקלטה של מישהו מהקטגוריה הזאת.
// עדיפות למי שבאמת הוקלט; אם אין, המקום מסומן כחסר.
export function buildStory(playerCount, recordings, seed) {
  const n = Math.max(1, playerCount);
  const rnd = seeded(seed || 1);
  const chapters = CHAPTERS.filter((c) => n >= c.min);
  return chapters.map((c) => ({
    title: c.title,
    parts: c.parts.map((p) => {
      if (!p.cat) return { text: p.t };
      const pool = [];
      for (let i = 0; i < n; i++) {
        const id = wordRecId(i, p.cat);
        if (recordings[id]) pool.push({ id, player: i });
      }
      const prompt = WORD_PROMPTS.find((w) => w.id === p.cat);
      if (!pool.length) return { slot: p.cat, label: (prompt && prompt.label) || p.cat, missing: true };
      const pick = pool[Math.floor(rnd() * pool.length)];
      return { slot: p.cat, label: (prompt && prompt.label) || p.cat, recId: pick.id, player: pick.player };
    }),
  }));
}

export function storyProgress(playerCount, recordings) {
  const tasks = allTasks(playerCount);
  const done = tasks.filter((t) => recordings[t.id]).length;
  return { total: tasks.length, done };
}
