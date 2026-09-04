import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Play, Trash2, Home, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { T } from "../theme.js";
import { fmtSecs } from "../lib/script.js";
import { pickMime, playRec, resumeCtx } from "../lib/audio.js";

const MAX_SECONDS = 30;

// סדר אקראי קבוע לכל שחקן, כדי שלא ינחש מה בא אחרי מה
function shuffled(arr, seed) {
  let a = (seed >>> 0) || 1;
  const rnd = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}

export default function WordStudio({ tasks, playerName, playerIndex, recordings, onSave, onDelete, onHome, audioRef, finishLabel }) {
  // "תגיד את השם שלך" תמיד ראשון — זה לא חלק מהעיוורון. השאר מעורבב.
  const list = useMemo(() => {
    const name = tasks.filter((t) => t.kind === "name");
    const rest = tasks.filter((t) => t.kind !== "name");
    return [...name, ...shuffled(rest, 1013 + playerIndex * 7919)];
  }, [tasks, playerIndex]);
  const [i, setI] = useState(0);
  const [state, setState] = useState("idle"); // idle | prep | recording | saving
  const [secs, setSecs] = useState(0);
  const [micErr, setMicErr] = useState("");
  const [playing, setPlaying] = useState(false);

  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startRef = useRef(0);
  const streamRef = useRef(null);
  const stopPreviewRef = useRef(null);

  const task = list[i] || null;
  const rec = task ? recordings[task.id] : null;
  const done = list.filter((t) => recordings[t.id]).length;

  function liveStream() {
    const s = streamRef.current;
    return s && s.getTracks().some((t) => t.readyState === "live") ? s : null;
  }
  function releaseStream() {
    const s = streamRef.current;
    if (s) { try { s.getTracks().forEach((t) => t.stop()); } catch (e) { /* ignore */ } }
    streamRef.current = null;
  }
  function stopPreview() {
    if (stopPreviewRef.current) { stopPreviewRef.current(); stopPreviewRef.current = null; }
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch (e) { /* ignore */ } }
    setPlaying(false);
  }

  useEffect(() => {
    stopPreview();
    setState((s) => (s === "recording" ? s : "idle"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    try { if (mrRef.current && mrRef.current.state !== "inactive") mrRef.current.stop(); } catch (e) { /* ignore */ }
    stopPreview();
    releaseStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function nextMissing() {
    for (let k = 1; k <= list.length; k++) {
      const j = (i + k) % list.length;
      if (!recordings[list[j].id]) return j;
    }
    return -1;
  }

  function stopRec() {
    clearInterval(timerRef.current);
    const mr = mrRef.current;
    if (mr && mr.state !== "inactive") { setState("saving"); try { mr.stop(); } catch (e) { setState("idle"); } }
    else setState("idle");
  }

  async function startRec() {
    if (!task) return;
    setMicErr("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicErr("nomic"); return;
    }
    try {
      stopPreview();
      resumeCtx();
      let stream = liveStream();
      if (!stream) { setState("prep"); stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream; }
      const mime = pickMime();
      const opts = { audioBitsPerSecond: 64000 };
      if (mime) opts.mimeType = mime;
      let mr;
      try { mr = new MediaRecorder(stream, opts); } catch (e) { mr = new MediaRecorder(stream); }
      const targetId = task.id;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const type = mr.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const dur = Math.round((Date.now() - startRef.current) / 100) / 10;
        try { if (blob.size > 0) await onSave(targetId, blob, dur); } catch (e) { /* ignore */ }
        setState("idle");
        const j = nextMissing();
        if (j >= 0) setTimeout(() => setI(j), 350);
      };
      mrRef.current = mr;
      startRef.current = Date.now();
      setSecs(0);
      mr.start(250);
      setState("recording");
      timerRef.current = setInterval(() => {
        const s = (Date.now() - startRef.current) / 1000;
        setSecs(s);
        if (s >= MAX_SECONDS) stopRec();
      }, 200);
    } catch (e) {
      releaseStream();
      setMicErr(e && (e.name === "NotAllowedError" || e.name === "SecurityError") ? "denied" : "nomic");
      setState("idle");
    }
  }

  function togglePreview() {
    const a = audioRef.current;
    if (!a || !rec) return;
    if (playing) { stopPreview(); return; }
    stopPreviewRef.current = playRec(a, rec, () => setPlaying(false), () => setPlaying(false), () => setPlaying(false));
    setPlaying(true);
  }

  if (!task) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 px-6 text-center">
        <p style={{ color: T.muted }}>אין מה להקליט.</p>
        <button onClick={onHome} className="rounded-2xl px-5 py-3 font-bold" style={{ background: T.lamp, color: T.onLamp }}>חזרה</button>
      </div>
    );
  }

  const busy = state !== "idle";
  const isNarr = task.kind === "narr";
  const isRule = task.kind === "rule" || isNarr;
  const allDone = done === list.length;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 px-3 pt-3 pb-1">
        <button onClick={onHome} className="p-2 rounded-xl" style={{ color: T.muted }} aria-label="חזרה"><Home size={22} /></button>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1" style={{ color: T.dim }}>
            <span>{playerName}</span>
            <span style={{ color: allDone ? T.ok : T.lamp }}>{done} / {list.length}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.raised }}>
            <div className="h-full rounded-full" style={{ width: (done / list.length) * 100 + "%", background: allDone ? T.ok : T.lamp, transition: "width .4s" }} />
          </div>
        </div>
      </div>

      <div className="flex-1 vg-scroll flex flex-col justify-center px-5 py-4">
        <div key={task.id} className="vg-rise">
          <div className="flex items-center gap-2 text-xs mb-3">
            <span className="rounded-full px-2.5 py-1 font-bold" style={{ background: isRule ? T.lamp + "22" : T.raised, color: isRule ? T.lamp : T.muted, border: "1px solid " + (isRule ? T.lamp + "66" : T.line) }}>
              {task.label}
            </span>
            {rec && <span className="flex items-center gap-1" style={{ color: T.ok }}><Check size={13} /> הוקלט</span>}
          </div>
          <p className={isNarr ? "text-2xl leading-relaxed font-medium" : isRule ? "text-xl leading-relaxed font-medium" : "text-3xl leading-snug font-bold"}>{task.text}</p>
          <div className="mt-3 text-sm" style={{ color: T.dim }}>{task.hint}</div>
          {!isRule && (
            <div className="mt-5 text-xs leading-relaxed" style={{ color: T.dim }}>
              אל תחשוב יותר מדי. אתה לא יודע לאן זה הולך, וזה בדיוק העניין.
            </div>
          )}
          {isNarr && (
            <div className="mt-5 text-xs leading-relaxed" style={{ color: T.dim }}>
              הקטעים מעורבבים בכוונה. במקום שבו הקטע נגמר באמצע, נכנסת מילה של מישהו מהחבר׳ה.
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2 flex flex-col items-center gap-3">
        {micErr && (
          <div className="text-xs text-center" style={{ color: T.rec }}>
            {micErr === "denied" ? "אין הרשאה למיקרופון. צריך לאשר בדפדפן." : "אין מיקרופון זמין. חייבים HTTPS."}
          </div>
        )}
        <div className="flex items-center gap-5">
          <button onClick={() => setI((i - 1 + list.length) % list.length)} disabled={busy} className="p-3 rounded-xl" style={{ color: busy ? T.dim : T.muted }} aria-label="הקודם"><ChevronRight size={24} /></button>

          <button
            onClick={state === "recording" ? stopRec : startRec}
            disabled={state === "saving" || state === "prep"}
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: state === "recording" ? T.rec : T.lamp, color: state === "recording" ? "#fff" : T.onLamp }}
            aria-label={state === "recording" ? "עצור" : "הקלט"}
          >
            {state === "recording" && <span className="vg-pulse-ring" />}
            <span className="relative">{state === "recording" ? <Square size={26} /> : <Mic size={30} />}</span>
          </button>

          <button onClick={() => setI((i + 1) % list.length)} disabled={busy} className="p-3 rounded-xl" style={{ color: busy ? T.dim : T.muted }} aria-label="הבא"><ChevronLeft size={24} /></button>
        </div>

        <div className="text-sm h-5" style={{ color: state === "recording" ? T.rec : T.dim }}>
          {state === "prep" ? "מפעיל מיקרופון..."
            : state === "recording" ? "מקליט " + fmtSecs(secs)
            : state === "saving" ? "שומר..."
            : rec ? "אפשר להקליט מחדש" : "לחץ והקלט"}
        </div>

        {rec && !busy && (
          <div className="flex items-center gap-2">
            <button onClick={togglePreview} className="rounded-xl px-4 py-2 text-sm flex items-center gap-2" style={{ background: T.surface, border: "1px solid " + T.line, color: T.ink }}>
              <Play size={15} /> {playing ? "עוצר" : "לשמוע"}
            </button>
            <button onClick={() => { stopPreview(); onDelete(task.id); }} className="rounded-xl px-4 py-2 text-sm flex items-center gap-2" style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}>
              <Trash2 size={15} /> למחוק
            </button>
          </div>
        )}

        {allDone && (
          <button onClick={onHome} className="vg-press w-full rounded-2xl py-3 font-bold" style={{ background: T.ok, color: "#10240f" }}>
            {finishLabel || "סיימתי — תן את הטלפון לבא בתור"}
          </button>
        )}
      </div>
    </div>
  );
}
