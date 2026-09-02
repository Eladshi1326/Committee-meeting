import React, { useEffect, useRef, useState } from "react";
import { X, Volume2, RotateCcw, Home, Flag } from "lucide-react";
import { T } from "../theme.js";
import { getChar, textDurationMs, sanityColor, sanityVerdict, choiceAvailable, applyChoiceFlags, endingIds } from "../lib/script.js";
import { playRec } from "../lib/audio.js";
import { Avatar, SceneLabel } from "../components/ui.jsx";

function EndingCard({ ending, sanity, steps, foundCount, totalEndings, isNew, onReplay, onExit }) {
  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-6 vg-rise">
      {isNew && (
        <div className="flex items-center gap-2 text-xs mb-3" style={{ color: T.lamp }}>
          <Flag size={14} /> סוף חדש
        </div>
      )}
      <h2 className="text-3xl font-bold leading-tight">{ending.title}</h2>
      <p className="mt-4 text-base leading-relaxed">{ending.text}</p>
      <div className="mt-6 rounded-2xl p-4 flex flex-col gap-3" style={{ background: T.surface, border: "1px solid " + T.line }}>
        <div>
          <div className="flex justify-between text-sm">
            <span style={{ color: T.muted }}>שפיות בסוף הערב</span>
            <span className="font-bold" style={{ color: sanityColor(sanity) }}>{sanity}%</span>
          </div>
          <div className="mt-1 text-sm" style={{ color: T.muted }}>{sanityVerdict(sanity)}</div>
        </div>
        <div className="flex justify-between text-sm" style={{ borderTop: "1px solid " + T.line, paddingTop: 10 }}>
          <span style={{ color: T.muted }}>סופים שגילית</span>
          <span style={{ color: T.ink }}>{foundCount} מתוך {totalEndings}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: T.muted }}>בחירות בדרך</span>
          <span style={{ color: T.ink }}>{steps}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <button
          onClick={onReplay}
          className="flex-1 rounded-2xl py-3 font-bold flex items-center justify-center gap-2"
          style={{ background: T.lamp, color: T.onLamp }}
        >
          <RotateCcw size={18} /> לשחק שוב
        </button>
        <button
          onClick={onExit}
          className="flex-1 rounded-2xl py-3 flex items-center justify-center gap-2"
          style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}
        >
          <Home size={18} /> הביתה
        </button>
      </div>
    </div>
  );
}

export default function PlayScreen({ script, chars, recordings, settings, endings, audioRef, onExit, onEnding }) {
  const [nodeId, setNodeId] = useState(script.start);
  const [lineIdx, setLineIdx] = useState(0);
  const [phase, setPhase] = useState("line"); // line | spoken | choices | ending
  const [spoken, setSpoken] = useState(null);
  const [sanity, setSanity] = useState(100);
  const [flags, setFlags] = useState([]);
  const [steps, setSteps] = useState(0);
  const [needTap, setNeedTap] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [newEnding, setNewEnding] = useState(false);
  const endRef = useRef(() => {});
  const reportedRef = useRef(null);

  const node = script.nodes ? script.nodes[nodeId] : null;
  const nodeLines = (node && node.lines) || [];
  const utter =
    phase === "line" ? (nodeLines[lineIdx] || null)
    : phase === "spoken" && spoken ? { ...spoken, speaker: "you" }
    : null;
  const lastLine = nodeLines.length ? nodeLines[nodeLines.length - 1] : null;
  const shown = utter || (phase === "choices" ? lastLine : null);
  const visibleChoices = ((node && node.choices) || []).filter((c) => choiceAvailable(c, flags));
  const totalEndings = endingIds(script).length;

  function recFor(id) {
    if (settings.muted) return null;
    return recordings[id] || null;
  }

  function pauseAudio() {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch (e) { /* ignore */ } }
  }

  function goNext(choice) {
    pauseAudio();
    setSpoken(null);
    setNeedTap(false);
    setWaiting(false);
    setNodeId(choice.next);
    setLineIdx(0);
    setPhase("line");
  }

  endRef.current = () => {
    if (phase === "spoken") { if (spoken) goNext(spoken); return; }
    if (!node) return;
    if (lineIdx + 1 < nodeLines.length) setLineIdx(lineIdx + 1);
    else setPhase(node.ending ? "ending" : "choices");
  };

  // סוף חדש: מדווחים למעלה כדי לשמור
  useEffect(() => {
    if (phase !== "ending" || !node) return;
    if (reportedRef.current === nodeId) return;
    reportedRef.current = nodeId;
    setNewEnding(!endings.includes(nodeId));
    if (onEnding) onEnding(nodeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, nodeId]);

  // ניגון השורה הנוכחית
  useEffect(() => {
    if (!node) return undefined;
    if (phase === "line" && !utter) {
      setPhase(node.ending ? "ending" : "choices");
      return undefined;
    }
    if ((phase !== "line" && phase !== "spoken") || !utter) return undefined;
    let cancelled = false;
    let timer = null;
    let stop = null;
    setWaiting(false);
    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      if (!settings.autoAdvance && phase === "line") setWaiting(true);
      else endRef.current();
    };
    const rec = recFor(utter.id);
    const a = audioRef.current;
    if (rec && a) {
      stop = playRec(
        a, rec,
        finish,
        () => { if (!cancelled) setNeedTap(true); },
        () => { timer = setTimeout(finish, 900); }
      );
    } else if (!settings.autoAdvance && phase === "line") {
      setWaiting(true);
    } else {
      timer = setTimeout(finish, textDurationMs(utter.text));
    }
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (stop) stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, lineIdx, phase]);

  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) { try { a.pause(); } catch (e) { /* ignore */ } a.onended = null; a.onerror = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function skip() {
    pauseAudio();
    setNeedTap(false);
    setWaiting(false);
    endRef.current();
  }

  function choose(c) {
    setSanity((s) => Math.max(0, Math.min(100, s + (c.sanity || 0))));
    setFlags((f) => applyChoiceFlags(c, f));
    setSteps((n) => n + 1);
    const rec = settings.playChoices ? recFor(c.id) : null;
    if (rec) { setSpoken(c); setPhase("spoken"); }
    else goNext(c);
  }

  function retryAudio() {
    const a = audioRef.current;
    if (!a) return;
    const p = a.play();
    if (p && p.then) p.then(() => setNeedTap(false)).catch(() => {});
  }

  function replay() {
    pauseAudio();
    reportedRef.current = null;
    setSpoken(null);
    setNeedTap(false);
    setWaiting(false);
    setNewEnding(false);
    setSanity(100);
    setFlags([]);
    setSteps(0);
    setNodeId(script.start);
    setLineIdx(0);
    setPhase("line");
  }

  if (!node) {
    return (
      <div className="flex flex-col flex-1 min-h-screen items-center justify-center gap-4 px-6 text-center">
        <p style={{ color: T.muted }}>הצומת ״{String(nodeId)}״ לא קיים בתסריט. בדוק את שדות ה-next.</p>
        <button onClick={onExit} className="rounded-2xl px-5 py-3 font-bold" style={{ background: T.lamp, color: T.onLamp }}>חזרה</button>
      </div>
    );
  }

  const speaker = shown ? getChar(chars, shown.speaker || "you") : null;
  const foundCount = endings.includes(nodeId) ? endings.length : endings.length + 1;

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <div className="flex items-center gap-3 px-3 pt-3 pb-1">
        <button onClick={onExit} className="p-2 rounded-xl" style={{ color: T.muted }} aria-label="יציאה">
          <X size={22} />
        </button>
        <div className="flex-1 pl-1">
          <div className="flex justify-between text-xs mb-1" style={{ color: T.dim }}>
            <span>שפיות</span>
            <span style={{ color: sanityColor(sanity) }}>{sanity}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.raised }}>
            <div className="h-full rounded-full" style={{ width: sanity + "%", background: sanityColor(sanity), transition: "width .5s" }} />
          </div>
        </div>
      </div>

      <div className="px-4 mt-3"><SceneLabel text={node.scene} /></div>

      {phase === "ending" ? (
        <EndingCard
          ending={node.ending || { title: "סוף", text: "" }}
          sanity={sanity}
          steps={steps}
          foundCount={Math.min(foundCount, totalEndings)}
          totalEndings={totalEndings}
          isNew={newEnding}
          onReplay={replay}
          onExit={onExit}
        />
      ) : (
        <>
          <div
            onClick={utter ? skip : undefined}
            className="flex-1 flex flex-col justify-center px-4 py-6 select-none"
            style={{ opacity: phase === "choices" ? 0.55 : 1, transition: "opacity .3s" }}
          >
            {shown && speaker && (
              <div key={shown.id} className="vg-rise">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar char={speaker} size={56} glow={!!utter} />
                  <div className="min-w-0">
                    <div className="font-bold text-lg" style={{ color: speaker.color }}>{speaker.name}</div>
                    <div className="text-xs" style={{ color: T.dim }}>{speaker.role}</div>
                  </div>
                  {utter && !waiting && recFor(utter.id) && (
                    <Volume2 size={18} className="mr-auto shrink-0 vg-blink" style={{ color: T.dim }} />
                  )}
                </div>
                <p className="text-2xl leading-relaxed font-medium">{shown.text}</p>
                {utter && needTap && (
                  <button
                    onClick={(e) => { e.stopPropagation(); retryAudio(); }}
                    className="mt-4 text-sm px-3 py-2 rounded-xl"
                    style={{ background: T.raised, color: T.lamp }}
                  >
                    הקש כדי להפעיל את הקול
                  </button>
                )}
                {utter && (
                  <div className="mt-6 text-xs" style={{ color: waiting ? T.lamp : T.dim }}>
                    {waiting ? "הקש כדי להמשיך" : "הקשה על המסך מדלגת לשורה הבאה"}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-4 pb-6">
            {phase === "choices" && (
              <div className="flex flex-col gap-2 vg-rise">
                <div className="text-xs mb-1" style={{ color: T.dim }}>מה אתה עונה?</div>
                {visibleChoices.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => choose(c)}
                    className="w-full text-right rounded-2xl px-4 py-3 text-base leading-snug"
                    style={{
                      background: T.surface,
                      border: "1px solid " + (c.requires ? T.lamp + "88" : T.line),
                      color: T.ink,
                    }}
                  >
                    {c.text}
                  </button>
                ))}
                {visibleChoices.length === 0 && (
                  <button onClick={onExit} className="w-full rounded-2xl px-4 py-3" style={{ background: T.surface, color: T.muted }}>
                    אין המשך מכאן. חזרה הביתה.
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
