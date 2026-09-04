import React, { useEffect, useMemo, useState } from "react";
import { X, Play, RotateCcw, Volume2, ChevronLeft, BookOpen } from "lucide-react";
import { T } from "../theme.js";
import { playRec } from "../lib/audio.js";
import { RULE_PARTS, buildStory, ruleRecId, activeRoster } from "../data/wordgame.js";

// כמה זמן להשאיר טקסט על המסך כדי שאפשר יהיה לקרוא אותו בנחת.
// קצב קבוע לא עובד: משפט של 60 תווים צריך יותר זמן מאחד של 12.
function readMs(text) {
  const len = (text || "").trim().length;
  if (len < 4) return 700;
  return Math.max(1800, Math.min(7000, 1300 + len * 75));
}

const PAGE_CHARS = 230;     // פרק ארוך מזה נחלק לשני עמודים, שלא ייווצר קיר של טקסט
const CHAPTER_BREATH = 900; // נשימה בתחילת פרק, שהשם הראשון לא יישמע ברגע שהעמוד מתחלף
const PAGE_BREATH = 450;
const POP_MS = 550;         // הנקודות הצהובות קופצות, ורק אז המילה נשמעת
const AFTER_WORD = 300;     // רגע אחרי כל מילה לפני שהטקסט ממשיך
const CHAPTER_HOLD = 1100;  // בסוף פרק משאירים אותו על המסך רגע לפני שעוברים הלאה

function weight(p) { return p.slot ? 5 : (p.text || "").length; }

// הטקסט מצטבר בתוך הפרק, חתיכה אחרי חתיכה. רק פרק ארוך במיוחד נשבר לעמוד נוסף,
// ואף פעם לא לפני מילה מוקלטת — הטקסט שלפניה מוביל אליה.
function toPages(parts) {
  const pages = [];
  let cur = [];
  let len = 0;
  parts.forEach((p) => {
    const prev = cur[cur.length - 1];
    const prevShort = !!(prev && prev.text && !prev.isName && prev.text.trim().length < 4);
    const canBreak = !p.slot && !prevShort && cur.length >= 3;
    if (canBreak && len + weight(p) > PAGE_CHARS) { pages.push(cur); cur = []; len = 0; }
    cur.push(p);
    len += weight(p);
  });
  if (cur.length) pages.push(cur);
  return pages;
}

export default function WordPlay({ roster, recordings, seed, onNewStory, onExit, audioRef, narrator, setId }) {
  const players = (roster || []).map((r) => r.name);
  const readerName = narrator >= 0 && roster && roster[narrator] ? roster[narrator].name : null;
  const [phase, setPhase] = useState("intro"); // intro | rules | story | end
  const [ri, setRi] = useState(0);
  const [pgi, setPgi] = useState(0);
  const [pi, setPi] = useState(0);
  const [speaking, setSpeaking] = useState(false); // ההקלטה של החתיכה הנוכחית מתנגנת ממש עכשיו

  const story = useMemo(() => buildStory(roster, recordings, seed, narrator, setId), [roster, recordings, seed, narrator, setId]);
  const rules = useMemo(() => {
    const act = activeRoster(roster, narrator);
    return RULE_PARTS.map((r, i) => ({ ...r, recId: ruleRecId(r.id), name: (act[i % act.length] || {}).name }));
  }, [roster, narrator]);

  const pages = useMemo(() => {
    const out = [];
    story.forEach((ch, ci) => {
      const pp = toPages(ch.parts);
      pp.forEach((parts, k) => out.push({ ci, title: ch.title, parts, k, n: pp.length }));
    });
    return out;
  }, [story]);

  const page = pages[pgi] || null;
  const part = page ? page.parts[pi] || null : null;
  const shown = page ? page.parts.slice(0, pi + 1) : [];
  const rule = rules[ri] || null;
  const narrated = story.some((ch) => ch.parts.some((p) => p.narr && recordings[p.recId]));

  function stopAudio() {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch (e) { /* ignore */ } }
  }

  function startStory() {
    setPhase("story"); setPgi(0); setPi(0);
  }

  function advance() {
    if (phase === "rules") {
      if (ri + 1 < rules.length) setRi(ri + 1);
      else startStory();
      return;
    }
    if (phase === "story") {
      if (!page) { setPhase("end"); return; }
      if (pi + 1 < page.parts.length) setPi(pi + 1);
      else if (pgi + 1 < pages.length) { setPgi(pgi + 1); setPi(0); }
      else setPhase("end");
    }
  }

  // ניגון החתיכה הנוכחית, ואז ממשיכים לבד. הקשה על המסך מדלגת.
  useEffect(() => {
    if (phase !== "rules" && phase !== "story") return undefined;
    const a = audioRef.current;
    let cancelled = false;
    const timers = [];
    let stop = null;
    const later = (fn, ms) => { timers.push(setTimeout(() => { if (!cancelled) fn(); }, ms)); };
    const finish = () => { if (cancelled) return; cancelled = true; advance(); };

    if (phase === "rules") {
      const r = rule ? recordings[rule.recId] : null;
      const hold = readMs(rule ? rule.text : "");
      if (r && a) stop = playRec(a, r, () => later(finish, AFTER_WORD), () => later(finish, hold), () => later(finish, hold));
      else later(finish, hold);
    } else if (part && page) {
      const first = pi === 0;
      const breath = first ? (page.k === 0 ? CHAPTER_BREATH : PAGE_BREATH) : 0;
      const lastOnPage = pi === page.parts.length - 1;
      const lastInChapter = lastOnPage && page.k === page.n - 1;
      const tail = AFTER_WORD + (lastInChapter ? CHAPTER_HOLD : lastOnPage ? 500 : 0);
      const r = part.recId && !part.missing ? recordings[part.recId] : null;
      const isWord = !!(part.slot || part.isName);
      const hold = part.isName ? 1500 : part.missing ? 1600 : readMs(part.text);
      if (r && a) {
        // טקסט: שומעים את המקריא. מילה: קודם הנקודות קופצות, ורק אז שומעים.
        const onEnd = () => { setSpeaking(false); later(finish, tail); };
        const onFail = () => { setSpeaking(false); later(finish, hold); };
        later(() => { setSpeaking(true); stop = playRec(a, r, onEnd, onFail, onFail); }, breath + (isWord ? POP_MS : 120));
      } else {
        later(finish, breath + hold + tail);
      }
    }
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (stop) stop();
      setSpeaking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, ri, pgi, pi]);

  useEffect(() => () => stopAudio(), []);

  const shell = (children) => (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-3 pt-3">
        <button onClick={() => { stopAudio(); onExit(); }} className="p-2 rounded-xl" style={{ color: T.muted }} aria-label="יציאה"><X size={22} /></button>
        <div className="text-xs" style={{ color: T.dim }}>
          {phase === "rules" ? "החוקים · " + (ri + 1) + " מתוך " + rules.length
            : phase === "story" ? (page ? "פרק " + (page.ci + 1) + " מתוך " + story.length : "")
            : ""}
        </div>
        <div style={{ width: 38 }} />
      </div>
      {children}
    </div>
  );

  if (phase === "intro") {
    return shell(
      <div className="flex-1 vg-scroll flex flex-col justify-center px-5 py-6 vg-rise">
        <div className="text-5xl vg-float text-center">🎲</div>
        <h2 className="text-3xl font-bold mt-4 text-center">סיפור מהמילים שלכם</h2>
        {story.setTitle && (
          <div className="mt-1 text-center text-sm" style={{ color: T.lamp }}>״{story.setTitle}״</div>
        )}
        <p className="mt-3 text-base leading-relaxed" style={{ color: T.muted }}>
          כל אחד מכם הקליט מילים בלי לדעת לאן הן הולכות. עכשיו הטלפון מרכיב מהן סיפור.
          קודם תשמעו את כולכם מסבירים את החוקים, ואז מתחילים.
        </p>
        {readerName && (
          <div className="mt-3 rounded-2xl px-4 py-3 text-sm leading-relaxed flex items-start gap-2" style={{ background: T.lamp + "1a", border: "1px solid " + T.lamp + "66", color: T.ink }}>
            <BookOpen size={16} className="shrink-0 mt-0.5" style={{ color: T.lamp }} />
            <div>
              <span style={{ color: T.lamp, fontWeight: 700 }}>{readerName}</span>
              {narrated ? " מספר את הסיפור. הטקסט מתקדם לפי הקול שלו, והמילים שלכם נכנסות באמצע." : " נבחר להקריא אבל עוד לא הקליט את הסיפור — הטקסט יעבור לבד בקצב קריאה."}
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(players || []).map((n, i) => (
            <span key={i} className="text-xs rounded-full px-2.5 py-1" style={{ background: T.lamp + "22", color: T.lamp, border: "1px solid " + T.lamp + "55" }}>{n}</span>
          ))}
        </div>
        <button
          onClick={() => { setPhase("rules"); setRi(0); }}
          className="vg-press mt-7 w-full rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2"
          style={{ background: T.lamp, color: T.onLamp }}
        >
          <Play size={20} /> להשמיע את החוקים
        </button>
        <button
          onClick={startStory}
          className="vg-press mt-2 w-full rounded-2xl py-3 text-sm flex items-center justify-center gap-2"
          style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}
        >
          <ChevronLeft size={16} /> כבר יודעים את החוקים, ישר לסיפור
        </button>
        <button
          onClick={onNewStory}
          className="mt-2 w-full py-2 text-xs flex items-center justify-center gap-1"
          style={{ color: T.dim }}
        >
          <RotateCcw size={13} /> לערבב את המילים מחדש
        </button>
      </div>
    );
  }

  if (phase === "end") {
    return shell(
      <div className="flex-1 vg-scroll flex flex-col justify-center px-5 py-6 vg-rise">
        <h2 className="text-3xl font-bold">זהו. זה מה שיצא.</h2>
        <p className="mt-3 text-base leading-relaxed" style={{ color: T.muted }}>
          מי שאמר את המילה שהצחיקה הכי חזק — שותה. מי שמתבייש במילה שלו — מודה שהיא שלו ושותה פעמיים.
        </p>
        <div className="mt-4 text-xs" style={{ color: T.dim }}>
          {story.length} פרקים · {story.reduce((a, c) => a + c.parts.filter((p) => p.recId && !p.narr).length, 0)} מילים שלכם
        </div>
        <button
          onClick={() => { onNewStory(); startStory(); }}
          className="vg-press mt-7 w-full rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2"
          style={{ background: T.lamp, color: T.onLamp }}
        >
          <RotateCcw size={20} /> סיפור חדש מאותן מילים
        </button>
        <button onClick={onExit} className="mt-2 w-full rounded-2xl py-3 text-sm" style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}>
          חזרה הביתה
        </button>
      </div>
    );
  }

  // --- rules ---
  if (phase === "rules") {
    const who = (rule && rule.name) || "מישהו";
    const has = rule && recordings[rule.recId];
    return shell(
      <>
        <div onClick={advance} className="flex-1 vg-scroll flex flex-col justify-center px-5 py-6 select-none">
          <div key={rule ? rule.id : "x"} className="vg-rise">
            <div className="flex items-center gap-2 text-sm mb-4" style={{ color: T.lamp }}>
              {has && <Volume2 size={16} className="vg-blink" />}
              <span>{who}</span>
              {!has && <span className="text-xs" style={{ color: T.rec }}>· לא הוקלט</span>}
            </div>
            <p className="text-2xl leading-relaxed font-medium">{rule ? rule.text : ""}</p>
          </div>
        </div>
        <div className="shrink-0 px-4 pb-5 flex items-center justify-between">
          <div className="text-xs" style={{ color: T.dim }}>הקשה מדלגת</div>
          <button onClick={startStory} className="text-sm flex items-center gap-1 px-3 py-2 rounded-xl" style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}>
            <ChevronLeft size={16} /> לדלג לסיפור
          </button>
        </div>
      </>
    );
  }

  // --- story ---
  const who = !part ? null
    : part.narr ? readerName
    : part.player != null ? ((roster || []).find((r) => r.id === part.player) || {}).name || "מישהו"
    : null;
  return shell(
    <>
      <div onClick={advance} className="flex-1 vg-scroll flex flex-col justify-center px-5 py-6 select-none">
        <div className="text-xs mb-3" style={{ color: T.dim }}>
          {page ? page.title : ""}{page && page.n > 1 ? " · " + (page.k + 1) + "/" + page.n : ""}
        </div>
        <p key={pgi} className="text-2xl leading-relaxed vg-rise">
          {shown.map((p, k) => {
            const last = k === shown.length - 1;
            // הרווח יושב מחוץ ל-inline-block, אחרת הוא נבלע והשם נדבק למילה שאחריו
            if (p.isName) return (
              <React.Fragment key={k}>
                <span className={last ? "vg-pop inline-block" : "inline-block"} style={{ color: T.ok, fontWeight: 800, margin: "0 2px" }}>{p.text}</span>{" "}
              </React.Fragment>
            );
            if (p.text) return (
              <span key={k} className={last ? "vg-fade" : ""} style={{ color: last ? T.ink : T.muted }}>{p.text} </span>
            );
            const missing = p.missing || !recordings[p.recId];
            return (
              <React.Fragment key={k}>
                <span
                  className={last ? "vg-pop inline-block" : "inline-block"}
                  style={{
                    color: missing ? T.rec : last ? T.lamp : T.lamp + "bb",
                    fontWeight: 700,
                    borderBottom: "2px solid " + (missing ? T.rec : T.lamp) + "66",
                    margin: "0 3px",
                  }}
                >
                  {missing ? "[" + p.label + " — חסר]" : "●●●"}
                </span>{" "}
              </React.Fragment>
            );
          })}
        </p>
        <div className="mt-5 h-5 flex items-center gap-2 text-sm" style={{ color: part && part.isName ? T.ok : part && part.narr ? T.muted : T.lamp }}>
          {speaking && who && (<><Volume2 size={16} className="vg-blink" /> {who}</>)}
        </div>
      </div>
      <div className="shrink-0 px-4 pb-5 text-center text-xs" style={{ color: T.dim }}>
        הקשה על המסך מדלגת קדימה
      </div>
    </>
  );
}
