import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Play, RotateCcw, Volume2, ChevronLeft } from "lucide-react";
import { T } from "../theme.js";
import { playRec } from "../lib/audio.js";
import { RULE_PARTS, buildStory, ruleRecId, activeRoster } from "../data/wordgame.js";

// כמה זמן להשאיר חתיכה בלי הקלטה על המסך
// כמה זמן להשאיר טקסט על המסך כדי שאפשר יהיה לקרוא אותו.
// קצב קבוע לא עובד: משפט של 60 תווים צריך יותר זמן מאחד של 12.
function readMs(text) {
  const len = (text || "").length;
  return Math.max(2000, Math.min(8000, 1600 + len * 80));
}
const MAX_TEXT = 90; // טקסט ארוך מזה נשבר לפעימה נפרדת, שלא יהיה קיר של מילים

// חותך פרק לפעימות: כל פעימה היא קצת טקסט והמילה המוקלטת שאחריו.
function toBeats(parts) {
  const beats = [];
  let cur = [];
  let len = 0;
  parts.forEach((p) => {
    if (p.recId || p.slot) {
      cur.push(p);
      beats.push(cur);
      cur = [];
      len = 0;
      return;
    }
    const t = p.text || "";
    if (len + t.length > MAX_TEXT && cur.length) { beats.push(cur); cur = []; len = 0; }
    cur.push(p);
    len += t.length;
  });
  if (cur.length) beats.push(cur);
  return beats;
}

export default function WordPlay({ roster, recordings, seed, onNewStory, onExit, audioRef, narrator }) {
  const players = (roster || []).map((r) => r.name);
  const readerName = narrator >= 0 && roster && roster[narrator] ? roster[narrator].name : null;
  const [phase, setPhase] = useState("intro"); // intro | rules | story | end
  const [ri, setRi] = useState(0);
  const [ci, setCi] = useState(0);
  const [pi, setPi] = useState(0);
  const [si, setSi] = useState(0); // 0 = קוראים את הטקסט, 1 = הנקודות מופיעות והמילה מתנגנת

  const story = useMemo(() => buildStory(roster, recordings, seed, narrator), [roster, recordings, seed, narrator]);
  const rules = useMemo(() => {
    const act = activeRoster(roster, narrator);
    return RULE_PARTS.map((r, i) => ({ ...r, recId: ruleRecId(r.id), name: (act[i % act.length] || {}).name }));
  }, [roster, narrator]);

  const chapter = story[ci] || null;
  const beats = useMemo(() => (chapter ? toBeats(chapter.parts) : []), [chapter]);
  const beat = beats[pi] || null;
  const slotPart = beat ? beat.find((x) => x.recId || x.slot) : null;
  const textParts = beat ? (slotPart ? beat.filter((x) => x !== slotPart) : beat) : [];
  const hasText = textParts.some((x) => (x.text || "").trim());
  // בלי טקסט לקרוא אין מה לחכות — קופצים ישר לנקודות
  const stage = !hasText || !slotPart ? 1 : si;
  const visible = stage === 0 ? textParts : beat || [];
  const part = slotPart || (beat ? beat[beat.length - 1] : null);
  const rule = rules[ri] || null;

  function stopAudio() {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch (e) { /* ignore */ } }
  }

  function advance() {
    // בתוך פעימה: קודם קוראים, ואז מגלים את המילה
    if (phase === "story" && stage === 0) { setSi(1); return; }
    if (phase === "rules") {
      if (ri + 1 < rules.length) setRi(ri + 1);
      else { setPhase("story"); setCi(0); setPi(0); }
      return;
    }
    if (phase === "story") {
      if (!chapter) { setPhase("end"); return; }
      setSi(0);
      if (pi + 1 < beats.length) setPi(pi + 1);
      else if (ci + 1 < story.length) { setCi(ci + 1); setPi(0); }
      else setPhase("end");
    }
  }

  // ניגון החתיכה הנוכחית, ואז ממשיכים לבד
  useEffect(() => {
    if (phase !== "rules" && phase !== "story") return undefined;
    const a = audioRef.current;
    const current = phase === "rules" ? (rule ? { recId: rule.recId } : null) : (stage === 1 ? part : null);
    const recId = current && current.recId;
    const r = recId ? recordings[recId] : null;
    let cancelled = false;
    let timer = null;
    let stop = null;
    // מתקדמים רק כשגם ההקלטה נגמרה וגם היה מספיק זמן לקרוא את הטקסט,
    // אחרת מילה קצרה חותכת משפט שלם באמצע.
    let audioDone = !(r && a);
    let readDone = false;
    const maybe = () => {
      if (cancelled || !audioDone || !readDone) return;
      cancelled = true;
      advance();
    };

    const shownText = phase === "rules"
      ? (rule ? rule.text : "")
      : visible.map((x) => x.text || "").join(" ");

    if (readerName && phase === "story" && stage === 0) {
      // יש מקריא: הטקסט מחכה שהוא יסיים להקריא, לא לשעון
    } else if (stage === 1 && r) {
      // הטקסט כבר נקרא. מחכים להקלטה, אבל לפחות 700ms כדי שהנקודות
      // הצהובות ייראו גם כשהמילה קצרה מאוד.
      timer = setTimeout(() => { readDone = true; maybe(); }, 700);
    } else {
      timer = setTimeout(() => { readDone = true; maybe(); }, readMs(shownText));
    }

    if (r && a) {
      const onDone = () => { audioDone = true; maybe(); };
      stop = playRec(a, r, onDone, onDone, onDone);
    }
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (stop) stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, ri, ci, pi, si, beat, readerName]);

  useEffect(() => () => stopAudio(), []);

  const waitingForReader = !!readerName && phase === "story" && stage === 0;

  const shell = (children) => (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0 flex items-center justify-between px-3 pt-3">
        <button onClick={() => { stopAudio(); onExit(); }} className="p-2 rounded-xl" style={{ color: T.muted }} aria-label="יציאה"><X size={22} /></button>
        <div className="text-xs" style={{ color: T.dim }}>
          {phase === "rules" ? "החוקים · " + (ri + 1) + " מתוך " + rules.length
            : phase === "story" ? (chapter ? chapter.title : "") + " · פרק " + (ci + 1) + " מתוך " + story.length
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
        <p className="mt-3 text-base leading-relaxed" style={{ color: T.muted }}>
          כל אחד מכם הקליט מילים בלי לדעת לאן הן הולכות. עכשיו הטלפון מרכיב מהן סיפור.
          קודם תשמעו את כולכם מסבירים את החוקים, ואז מתחילים.
        </p>
        {readerName && (
          <div className="mt-3 rounded-2xl px-4 py-3 text-sm leading-relaxed" style={{ background: T.lamp + "1a", border: "1px solid " + T.lamp + "66", color: T.ink }}>
            <span style={{ color: T.lamp, fontWeight: 700 }}>{readerName}</span> מקריא את הסיפור בקול.
            הטקסט מחכה לך — תקריא, ואז תקיש כדי להמשיך. המילים המוקלטות מתנגנות לבד.
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
          onClick={() => { setPhase("story"); setCi(0); setPi(0); }}
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
          {story.length} פרקים · {story.reduce((a, c) => a + c.parts.filter((p) => p.recId).length, 0)} מילים שלכם
        </div>
        <button
          onClick={() => { onNewStory(); setPhase("story"); setCi(0); setPi(0); }}
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
          <button onClick={() => { setPhase("story"); setCi(0); setPi(0); }} className="text-sm flex items-center gap-1 px-3 py-2 rounded-xl" style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}>
            <ChevronLeft size={16} /> לדלג לסיפור
          </button>
        </div>
      </>
    );
  }

  // --- story ---
  const who = part && part.player != null ? ((roster || []).find((r) => r.id === part.player) || {}).name || "מישהו" : null;
  return shell(
    <>
      <div onClick={advance} className="flex-1 vg-scroll flex flex-col justify-center px-5 py-6 select-none">
        <div className="text-xs mb-3" style={{ color: T.dim }}>
          {chapter ? chapter.title : ""} · {pi + 1}/{beats.length}
        </div>
        <p key={ci + "-" + pi} className="vg-rise text-3xl leading-snug font-medium">
          {visible.map((p, k) => {
            if (p.isName) return <span key={k} style={{ color: T.ok, fontWeight: 800 }}>{p.text} </span>;
            if (p.text) return <span key={k} style={{ color: T.ink }}>{p.text} </span>;
            const missing = p.missing || !recordings[p.recId];
            return (
              <span
                key={k}
                className="vg-pop inline-block"
                style={{ color: missing ? T.rec : T.lamp, fontWeight: 800, borderBottom: "3px solid " + (missing ? T.rec : T.lamp) + "66", margin: "0 4px" }}
              >
                {missing ? "[" + p.label + " — חסר]" : "●●●"}
              </span>
            );
          })}
        </p>
        {stage === 1 && part && (part.recId || part.slot) && !part.missing && who && (
          <div className="mt-6 flex items-center gap-2 text-sm" style={{ color: part.isName ? T.ok : T.lamp }}>
            <Volume2 size={16} className="vg-blink" /> {who}
          </div>
        )}
      </div>
      <div className="shrink-0 px-4 pb-5 text-center text-xs" style={{ color: waitingForReader ? T.lamp : T.dim }}>
        {waitingForReader ? readerName + " מקריא — הקש כשסיימת" : stage === 0 ? "הקש כדי לגלות את המילה" : "הקשה על המסך מדלגת קדימה"}
      </div>
    </>
  );
}
