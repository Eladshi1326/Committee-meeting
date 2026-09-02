import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Play, Trash2, Home, ChevronLeft, ChevronRight, Upload, Pencil, AlertTriangle } from "lucide-react";
import { T } from "../theme.js";
import { getChar, fmtSecs, countLines, blindVoice } from "../lib/script.js";
import { pickMime, playRec } from "../lib/audio.js";
import { Avatar, SceneLabel, Toggle } from "../components/ui.jsx";

const MAX_SECONDS = 120;

export default function StudioScreen({
  lines, index, setIndex, chars, recordings, settings, onSetSetting, onToggleBlind,
  onSave, onDelete, onEditText, onHome, audioRef,
}) {
  const line = lines[index] || null;
  const lineId = line ? line.id : null;
  const rec = line ? recordings[line.id] : null;
  const ch = line ? getChar(chars, line.speaker) : null;
  const blind = !!settings.studioBlind;
  const bv = line ? blindVoice(chars, line.speaker) : null;

  const [state, setState] = useState("idle"); // idle | prep | recording | saving
  const [secs, setSecs] = useState(0);
  const [micErr, setMicErr] = useState("");
  const [playErr, setPlayErr] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(line ? line.text : "");
  const [autoNextPending, setAutoNextPending] = useState(false);

  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startRef = useRef(0);
  const fileRef = useRef(null);
  const stopPreviewRef = useRef(null);
  const streamRef = useRef(null);

  const counts = countLines(lines, recordings);
  const nextMissing = useMemo(() => {
    for (let k = 1; k <= lines.length; k++) {
      const i = (index + k) % lines.length;
      if (!recordings[lines[i].id]) return i;
    }
    return -1;
  }, [lines, index, recordings]);

  // המיקרופון נשאר פתוח כל עוד אתה באולפן. getUserMedia הוא ההמתנה הארוכה,
  // ובלי זה כל אחת מ־88 ההקלטות שילמה אותה מחדש.
  function liveStream() {
    const s = streamRef.current;
    if (s && s.getTracks().some((t) => t.readyState === "live")) return s;
    return null;
  }

  function releaseStream() {
    const s = streamRef.current;
    if (s) { try { s.getTracks().forEach((t) => t.stop()); } catch (e) { /* ignore */ } }
    streamRef.current = null;
  }

  function stopPreview() {
    const a = audioRef.current;
    if (a) {
      try { a.pause(); } catch (e) { /* ignore */ }
      a.onended = null;
      a.onerror = null;
    }
    setPlaying(false);
  }
  stopPreviewRef.current = stopPreview;

  useEffect(() => {
    setDraft(line ? line.text : "");
    setEditing(false);
    setMicErr("");
    setPlayErr(false);
    if (stopPreviewRef.current) stopPreviewRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId]);

  // אחרי הקלטה, אם ביקשת: קפיצה לשורה הבאה שלא הוקלטה
  useEffect(() => {
    if (!autoNextPending) return;
    setAutoNextPending(false);
    if (settings.studioAutoNext && nextMissing >= 0 && nextMissing !== index) setIndex(nextMissing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoNextPending, recordings]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      try {
        if (mrRef.current && mrRef.current.state !== "inactive") mrRef.current.stop();
      } catch (e) { /* ignore */ }
      if (stopPreviewRef.current) stopPreviewRef.current();
      releaseStream();
    };
  }, []);

  function stopRec() {
    clearInterval(timerRef.current);
    const mr = mrRef.current;
    if (mr && mr.state !== "inactive") {
      setState("saving");
      try { mr.stop(); } catch (e) { setState("idle"); }
    } else {
      setState("idle");
    }
  }

  async function startRec() {
    if (!line) return;
    setMicErr("");
    setPlayErr(false);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === "undefined") {
      setMicErr("nomic");
      return;
    }
    try {
      stopPreview();
      let stream = liveStream();
      if (!stream) {
        setState("prep");
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }
      const mime = pickMime();
      const opts = { audioBitsPerSecond: 64000 };
      if (mime) opts.mimeType = mime;
      let mr;
      try { mr = new MediaRecorder(stream, opts); } catch (e) { mr = new MediaRecorder(stream); }
      const targetId = line.id;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const type = mr.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const dur = Math.round((Date.now() - startRef.current) / 100) / 10;
        try {
          if (blob.size > 0) await onSave(targetId, blob, dur);
        } catch (e) { /* ignore */ }
        setState("idle");
        setAutoNextPending(true);
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
    setPlayErr(false);
    playRec(
      a, rec,
      () => setPlaying(false),
      () => { setPlaying(false); setPlayErr(true); },
      () => { setPlaying(false); setPlayErr(true); }
    );
    setPlaying(true);
  }

  function onFile(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (f && line) {
      Promise.resolve(onSave(line.id, f, 0)).then(() => setAutoNextPending(true)).catch(() => {});
    }
  }

  if (!line) {
    return (
      <div className="flex flex-col flex-1 min-h-screen items-center justify-center gap-4 px-6 text-center">
        <p style={{ color: T.muted }}>אין שורות בתסריט. תוסיף שורות בעריכת התסריט.</p>
        <button onClick={onHome} className="rounded-2xl px-5 py-3 font-bold" style={{ background: T.lamp, color: T.onLamp }}>חזרה</button>
      </div>
    );
  }

  const busy = state !== "idle";
  const statusText =
    state === "prep" ? "מפעיל מיקרופון..."
    : state === "recording" ? "מקליט " + fmtSecs(secs)
    : state === "saving" ? "שומר..."
    : rec ? "הוקלט (" + fmtSecs(rec.secs) + "). לחיצה על המיקרופון מקליטה מחדש."
    : "עוד לא הוקלט. לחץ על המיקרופון ודבר.";

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <button onClick={onHome} disabled={busy} className="p-2 rounded-xl" style={{ color: busy ? T.dim : T.muted }} aria-label="חזרה">
          <Home size={22} />
        </button>
        <div className="text-xs" style={{ color: T.dim }}>
          שורה <span style={{ color: T.ink }}>{index + 1}</span> מתוך {lines.length}
        </div>
        <div className="text-xs px-2" style={{ color: counts.recorded === counts.total ? T.ok : T.lamp }}>
          {counts.recorded} הוקלטו
        </div>
      </div>

      <div className="px-4 mt-2">
        {!blind && <div className="mb-3"><SceneLabel text={line.scene} /></div>}

        <div key={line.id} className="vg-rise rounded-3xl p-5" style={{ background: T.surface, border: "1px solid " + T.line }}>
          <div className="flex items-center gap-3">
            {blind ? (
              <div
                className="shrink-0 rounded-full flex items-center justify-center font-bold"
                style={{
                  width: 48, height: 48, fontSize: 18,
                  background: bv.color + "22", border: "2px solid " + bv.color, color: bv.color,
                }}
              >
                {bv.badge}
              </div>
            ) : (
              <Avatar char={ch} size={48} />
            )}
            <div className="min-w-0">
              <div className="font-bold" style={{ color: blind ? bv.color : ch.color }}>
                {blind ? bv.label : ch.name}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: T.dim }}>
                {line.kind === "choice"
                  ? "תשובה שלך בתור השחקן"
                  : blind ? bv.voice : ch.role}
              </div>
            </div>
            <button
              onClick={() => setEditing((v) => !v)}
              disabled={busy}
              className="mr-auto p-2 rounded-xl"
              style={{ color: editing ? T.lamp : T.dim }}
              aria-label="עריכת טקסט"
            >
              <Pencil size={16} />
            </button>
          </div>

          {editing ? (
            <div className="mt-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                className="w-full rounded-xl p-3 text-base leading-relaxed outline-none"
                style={{ background: T.bg, color: T.ink, border: "1px solid " + T.line, resize: "vertical" }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { onEditText(line.id, draft.trim() || line.text); setEditing(false); }}
                  className="flex-1 rounded-xl py-2 text-sm font-bold"
                  style={{ background: T.lamp, color: T.onLamp }}
                >
                  לשמור טקסט
                </button>
                <button
                  onClick={() => { setDraft(line.text); setEditing(false); }}
                  className="flex-1 rounded-xl py-2 text-sm"
                  style={{ background: T.raised, color: T.muted }}
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xl leading-relaxed font-medium">{line.text}</p>
          )}
        </div>
      </div>

      <div className="mt-auto px-4 pb-6 pt-6 flex flex-col items-center gap-4">
        {micErr && (
          <div
            className="w-full rounded-2xl p-3 text-sm flex gap-2 items-start"
            style={{ background: "rgba(224,67,63,0.1)", border: "1px solid " + T.rec, color: T.ink }}
          >
            <AlertTriangle size={18} style={{ color: T.rec, flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1">
              {micErr === "denied"
                ? "אין הרשאה למיקרופון. אפשר לאשר בהגדרות האתר של הדפדפן, "
                : "המיקרופון לא זמין כאן. "}
              <span style={{ color: T.muted }}>או להקליט במקליט של הטלפון ולהעלות את הקובץ לשורה הזאת:</span>
              <button
                onClick={() => fileRef.current && fileRef.current.click()}
                className="mt-2 w-full rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: T.raised, color: T.ink, border: "1px solid " + T.line }}
              >
                <Upload size={16} /> להעלות הקלטה
              </button>
            </div>
          </div>
        )}
        {playErr && (
          <div className="w-full text-xs text-center" style={{ color: T.rec }}>
            לא הצלחתי לנגן את ההקלטה הזאת. נסה להקליט אותה מחדש.
          </div>
        )}
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onFile} />

        <div className="text-sm text-center h-5" style={{ color: state === "recording" ? T.rec : T.muted }}>
          {state === "recording" ? <span className="vg-blink">● {statusText}</span> : statusText}
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={togglePreview}
            disabled={!rec || busy}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: T.surface, border: "1px solid " + T.line, color: rec ? T.ink : T.dim, opacity: rec ? 1 : 0.4 }}
            aria-label="השמעה"
          >
            {playing ? <Square size={20} fill="currentColor" /> : <Play size={22} />}
          </button>

          <button
            onClick={state === "recording" ? stopRec : startRec}
            disabled={state === "saving" || state === "prep"}
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: state === "recording" ? T.rec : T.lamp,
              color: state === "recording" ? "#fff" : T.onLamp,
              boxShadow: "0 12px 32px rgba(0,0,0,.45)",
            }}
            aria-label={state === "recording" ? "עצור הקלטה" : "התחל הקלטה"}
          >
            {state === "recording" && <span className="vg-pulse-ring" />}
            <span className="relative flex">
              {state === "recording" ? <Square size={30} fill="currentColor" /> : <Mic size={36} />}
            </span>
          </button>

          <button
            onClick={() => { stopPreview(); onDelete(line.id); }}
            disabled={!rec || busy}
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: T.surface, border: "1px solid " + T.line, color: rec ? T.muted : T.dim, opacity: rec ? 1 : 0.4 }}
            aria-label="מחיקת הקלטה"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between w-full mt-1">
          <button
            onClick={() => setIndex(Math.max(0, index - 1))}
            disabled={index === 0 || busy}
            className="rounded-2xl px-4 py-3 text-sm flex items-center gap-1"
            style={{ background: T.surface, border: "1px solid " + T.line, color: index === 0 || busy ? T.dim : T.ink }}
          >
            <ChevronRight size={18} /> הקודמת
          </button>
          <button
            onClick={() => nextMissing >= 0 && setIndex(nextMissing)}
            disabled={nextMissing < 0 || busy}
            className="px-2 py-3 text-xs"
            style={{ color: nextMissing >= 0 && !busy ? T.lamp : T.dim }}
          >
            {nextMissing >= 0 ? "לבאה שלא הוקלטה" : "הכול מוקלט"}
          </button>
          <button
            onClick={() => setIndex(Math.min(lines.length - 1, index + 1))}
            disabled={index === lines.length - 1 || busy}
            className="rounded-2xl px-4 py-3 text-sm flex items-center gap-1"
            style={{ background: T.surface, border: "1px solid " + T.line, color: index === lines.length - 1 || busy ? T.dim : T.ink }}
          >
            הבאה <ChevronLeft size={18} />
          </button>
        </div>

        <div className="w-full px-1">
          <Toggle
            on={!!settings.studioAutoNext}
            onChange={(v) => onSetSetting("studioAutoNext", v)}
            label="אחרי כל הקלטה לקפוץ לשורה הבאה שלא הוקלטה"
            disabled={busy}
          />
          <Toggle
            on={blind}
            onChange={onToggleBlind}
            label="הקלטה עיוורת"
            hint="סדר אקראי, בלי סצנות ובלי שמות — רק הוראה איך לשחק את הקול."
            disabled={busy}
          />
        </div>
      </div>
    </div>
  );
}
