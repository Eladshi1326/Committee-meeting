import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Play, RotateCcw, Volume2, ChevronLeft } from "lucide-react";
import { T } from "../theme.js";
import { playRec } from "../lib/audio.js";
import { RULE_PARTS, buildStory, ruleRecId } from "../data/wordgame.js";

// כמה זמן להשאיר חתיכה בלי הקלטה על המסך
const TEXT_MS = 2200;

export default function WordPlay({ playerCount, players, recordings, seed, onNewStory, onExit, audioRef }) {
  const [phase, setPhase] = useState("intro"); // intro | rules | story | end
  const [ri, setRi] = useState(0);
  const [ci, setCi] = useState(0);
  const [pi, setPi] = useState(0);

  const story = useMemo(() => buildStory(playerCount, recordings, seed), [playerCount, recordings, seed]);
  const rules = useMemo(() => RULE_PARTS.map((r, i) => ({ ...r, recId: ruleRecId(r.id), player: i % Math.max(1, playerCount) })), [playerCount]);

  const chapter = story[ci] || null;
  const part = chapter ? chapter.parts[pi] || null : null;
  const rule = rules[ri] || null;

  function stopAudio() {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch (e) { /* ignore */ } }
  }

  function advance() {
    if (phase === "rules") {
      if (ri + 1 < rules.length) setRi(ri + 1);
      else { setPhase("story"); setCi(0); setPi(0); }
      return;
    }
    if (phase === "story") {
      if (!chapter) { setPhase("end"); return; }
      if (pi + 1 < chapter.parts.length) setPi(pi + 1);
      else if (ci + 1 < story.length) { setCi(ci + 1); setPi(0); }
      else setPhase("end");
    }
  }

  // ניגון החתיכה הנוכחית, ואז ממשיכים לבד
  useEffect(() => {
    if (phase !== "rules" && phase !== "story") return undefined;
    const a = audioRef.current;
    const current = phase === "rules" ? (rule ? { recId: rule.recId } : null) : part;
    const recId = current && current.recId;
    const r = recId ? recordings[recId] : null;
    let cancelled = false;
    let timer = null;
    let stop = null;
    const finish = () => { if (cancelled) return; cancelled = true; advance(); };
    if (r && a) {
      stop = playRec(a, r, finish, finish, finish);
    } else {
      timer = setTimeout(finish, TEXT_MS);
    }
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (stop) stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, ri, ci, pi]);

  useEffect(() => () => stopAudio(), []);

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
    const who = (players && players[rule ? rule.player : 0]) || "מישהו";
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
  const shownSoFar = chapter ? chapter.parts.slice(0, pi + 1) : [];
  const who = part && part.player != null ? (players && players[part.player]) || "מישהו" : null;
  return shell(
    <>
      <div onClick={advance} className="flex-1 vg-scroll flex flex-col justify-center px-5 py-6 select-none">
        <div className="text-xs mb-3" style={{ color: T.dim }}>{chapter ? chapter.title : ""}</div>
        <p className="text-2xl leading-relaxed">
          {shownSoFar.map((p, k) => {
            const last = k === shownSoFar.length - 1;
            if (p.text) return <span key={k} style={{ color: last ? T.ink : T.muted }}>{p.text} </span>;
            const missing = p.missing || !recordings[p.recId];
            return (
              <span
                key={k}
                className={last ? "vg-pop inline-block" : "inline-block"}
                style={{
                  color: missing ? T.rec : last ? T.lamp : T.lamp + "bb",
                  fontWeight: 700,
                  borderBottom: "2px solid " + (missing ? T.rec : T.lamp) + "66",
                  margin: "0 3px",
                }}
              >
                {missing ? "[" + p.label + " — חסר]" : "●●●"}
              </span>
            );
          })}
        </p>
        {part && part.slot && !part.missing && (
          <div className="mt-5 flex items-center gap-2 text-sm" style={{ color: T.lamp }}>
            <Volume2 size={16} className="vg-blink" /> {who} אמר את זה
          </div>
        )}
      </div>
      <div className="shrink-0 px-4 pb-5 text-center text-xs" style={{ color: T.dim }}>
        הקשה על המסך מדלגת קדימה
      </div>
    </>
  );
}
