import React, { useMemo, useState } from "react";
import { Home, Trash2, Play, Square, AlertTriangle } from "lucide-react";
import { T } from "../theme.js";
import { recordingGroups, groupSections } from "../lib/recgroups.js";
import { playRec } from "../lib/audio.js";

// מחיקה ממוקדת: כל קבוצה נמחקת לבד, כדי שאפשר יהיה להחליף אדם אחד
// או להקליט מחדש סיפור אחד בלי לאבד את כל השאר.
export default function RecordingsScreen({ recordings, roster, onDeleteMany, onClearAll, onBack, audioRef }) {
  const groups = useMemo(() => recordingGroups(recordings, roster), [recordings, roster]);
  const sections = useMemo(() => groupSections(groups), [groups]);
  const [armed, setArmed] = useState("");
  const [playing, setPlaying] = useState("");
  const total = Object.keys(recordings || {}).length;
  const stopRef = React.useRef(null);

  function stop() {
    if (stopRef.current) { stopRef.current(); stopRef.current = null; }
    const a = audioRef && audioRef.current;
    if (a) { try { a.pause(); } catch (e) { /* ignore */ } }
    setPlaying("");
  }

  // שומעים דוגמה מהקבוצה לפני שמוחקים אותה
  function sample(g) {
    if (playing === g.key) { stop(); return; }
    stop();
    const id = g.ids[Math.floor(Math.random() * g.ids.length)];
    const rec = recordings[id];
    const a = audioRef && audioRef.current;
    if (!rec || !a) return;
    setPlaying(g.key);
    stopRef.current = playRec(a, rec, () => setPlaying(""), () => setPlaying(""), () => setPlaying(""));
  }

  React.useEffect(() => () => stop(), []);

  return (
    <div className="flex flex-col flex-1 vg-scroll px-4 pt-3 pb-8 gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { stop(); onBack(); }} className="p-2 rounded-xl" style={{ color: T.muted }} aria-label="חזרה">
          <Home size={22} />
        </button>
        <div className="font-bold">ההקלטות שלכם</div>
        <div style={{ width: 38 }} />
      </div>

      <div className="text-xs leading-relaxed" style={{ color: T.dim }}>
        {total ? "סך הכל " + total + " הקלטות. אפשר למחוק קבוצה אחת בלי לגעת בשאר — למשל את ההקלטות של מי שהוחלף." : "אין עדיין הקלטות."}
      </div>

      {sections.map((sec) => (
        <section key={sec.name} className="rounded-3xl px-4 py-2" style={{ background: T.surface, border: "1px solid " + T.line }}>
          <div className="text-xs pt-2 pb-1" style={{ color: T.dim }}>{sec.name}</div>
          <div className="flex flex-col vg-divide">
            {sec.items.map((g) => (
              <div key={g.key} className="py-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm flex items-center gap-1.5" style={{ color: g.stale ? T.muted : T.ink }}>
                    {g.stale && <AlertTriangle size={13} style={{ color: T.rec }} />}
                    <span className="truncate">{g.title}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: T.dim }}>{g.note}</div>
                </div>
                <button
                  onClick={() => sample(g)}
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: T.raised, color: T.muted, border: "1px solid " + T.line }}
                  aria-label={"לשמוע דוגמה מ" + g.title}
                >
                  {playing === g.key ? <Square size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={() => {
                    if (armed === g.key) { stop(); onDeleteMany(g.ids); setArmed(""); }
                    else { setArmed(g.key); setTimeout(() => setArmed((k) => (k === g.key ? "" : k)), 3500); }
                  }}
                  className="shrink-0 rounded-xl px-3 h-9 text-xs font-bold flex items-center gap-1"
                  style={{
                    background: armed === g.key ? T.rec : T.raised,
                    color: armed === g.key ? "#fff" : T.muted,
                    border: "1px solid " + (armed === g.key ? T.rec : T.line),
                  }}
                >
                  <Trash2 size={14} /> {armed === g.key ? "בטוח?" : "למחוק"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {total > 0 && (
        <section className="rounded-3xl px-4 py-1" style={{ background: T.surface, border: "1px solid " + T.line }}>
          <button
            onClick={() => {
              if (armed === "all") { stop(); onClearAll(); setArmed(""); }
              else { setArmed("all"); setTimeout(() => setArmed((k) => (k === "all" ? "" : k)), 3500); }
            }}
            className="w-full py-3 text-sm flex items-center gap-2 text-right"
            style={{ color: armed === "all" ? T.rec : T.muted }}
          >
            <Trash2 size={16} /> {armed === "all" ? "בטוח? זה מוחק את הכל" : "למחוק את כל ההקלטות"}
          </button>
        </section>
      )}
    </div>
  );
}
