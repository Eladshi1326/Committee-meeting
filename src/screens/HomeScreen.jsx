import React, { useMemo, useRef, useState } from "react";
import {
  Mic, Play, Check, FileText, Settings, Download, ChevronDown, ChevronUp,
  Users, Plus, Minus, ArrowLeft, Sparkles, Shuffle, Pencil, Lock, AlertTriangle,
} from "lucide-react";
import { T } from "../theme.js";
import { getChar, countLines, endingIds, flattenLines } from "../lib/script.js";
import { Avatar, ProgressBar, SceneLabel, PrimaryButton, Toggle } from "../components/ui.jsx";

const MAX_PLAYERS = 12;

// סיפור מומלץ = כזה שטווח ה-fit שלו מכיל את מספר השחקנים
function fits(s, n) {
  const f = s.fit || [1, 99];
  return n >= f[0] && n <= f[1];
}

const TAP_WINDOW = 700;

function StepDots({ step }) {
  const idx = { players: 0, story: 1, main: 2 }[step] || 0;
  return (
    <div className="vg-steps flex gap-1.5 justify-center" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 rounded-full"
          style={{ width: i === idx ? 26 : 8, background: i <= idx ? T.lamp : T.line, transition: "width .3s, background .3s" }}
        />
      ))}
    </div>
  );
}

/* ---------------- שלב 1: כמה אתם ---------------- */
function PlayersStep({ players, splitMode, onDone, adultUnlocked, onUnlockAdult }) {
  const [names, setNames] = useState(players.length ? players.slice() : [""]);
  const [mode, setMode] = useState(splitMode || "line");
  const [bump, setBump] = useState(0);
  const [asking, setAsking] = useState(false);
  const taps = useRef([]);
  const count = names.length;

  // שלוש הקשות מהירות על הכותרת פותחות את שאלת ה-18+
  function tapTitle() {
    if (adultUnlocked) return;
    const now = Date.now();
    taps.current = taps.current.filter((t) => now - t < TAP_WINDOW);
    taps.current.push(now);
    if (taps.current.length >= 3) {
      taps.current = [];
      setAsking(true);
    }
  }

  function setCount(n) {
    const c = Math.max(1, Math.min(MAX_PLAYERS, n));
    if (c === count) return;
    setBump((b) => b + 1);
    setNames((prev) => {
      const next = prev.slice(0, c);
      while (next.length < c) next.push("");
      return next;
    });
  }

  function next() {
    const clean = names.map((n, i) => n.trim() || "שחקן " + (i + 1));
    onDone(count > 1 ? clean : [], mode);
  }

  return (
    <div className="vg-slide flex flex-col gap-3 flex-1 min-h-0">
      {asking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(10,8,6,.86)" }}
          onClick={() => setAsking(false)}
        >
          <div
            className="vg-pop w-full max-w-sm rounded-3xl p-5 text-center"
            style={{ background: T.surface, border: "1px solid " + T.rec }}
            onClick={(e) => e.stopPropagation()}
          >
            <AlertTriangle size={34} style={{ color: T.rec }} className="mx-auto" />
            <div className="text-xl font-bold mt-3">לפתוח את המדף של 18+?</div>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: T.muted }}>
              שלושה סיפורים נוספים למבוגרים בלבד: קללות, בדיחות זין, מצבים מביכים ודברים
              שלא תרצה להקריא בקול ליד ההורים שלך.
            </p>
            <p className="text-xs mt-2" style={{ color: T.dim }}>
              לא לילדים. אפשר לנעול בחזרה בהגדרות.
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={() => { setAsking(false); onUnlockAdult(); }}
                className="vg-press w-full rounded-2xl py-3 font-bold"
                style={{ background: T.rec, color: "#fff" }}
              >
                כן, אני מעל 18
              </button>
              <button
                onClick={() => setAsking(false)}
                className="w-full rounded-2xl py-3 text-sm"
                style={{ background: T.raised, color: T.muted }}
              >
                לא, תסגור את זה
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="shrink-0 text-center">
        <div className="text-4xl vg-float">🎙️</div>
        <h1 className="text-2xl font-bold mt-1 select-none" onClick={tapTitle}>כמה אתם?</h1>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: T.muted }}>
          כל אחד מקליט חלק מהשורות בלי לדעת מה הסיפור. אחר כך משחקים ביחד ושומעים מה יצא.
        </p>
      </header>

      <div className="shrink-0 flex items-center justify-center gap-6">
        <button
          onClick={() => setCount(count - 1)}
          disabled={count <= 1}
          className="vg-press w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: T.surface, border: "1px solid " + T.line, color: count <= 1 ? T.dim : T.ink }}
          aria-label="פחות"
        >
          <Minus size={22} />
        </button>
        <div
          key={bump}
          className="vg-pop text-6xl font-bold w-20 text-center tabular-nums"
          style={{ color: T.lamp, textShadow: "0 0 32px rgba(242,181,68,.35)" }}
        >
          {count}
        </div>
        <button
          onClick={() => setCount(count + 1)}
          disabled={count >= MAX_PLAYERS}
          className="vg-press w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: T.lamp, color: T.onLamp, opacity: count >= MAX_PLAYERS ? 0.4 : 1 }}
          aria-label="עוד"
        >
          <Plus size={22} />
        </button>
      </div>
      <div className="shrink-0 text-center text-xs -mt-1" style={{ color: T.dim }}>
        {count === 1 ? "משחק יחיד — אתה מקליט הכול" : count + " שחקנים"}
      </div>

      {count > 1 && (
        <section className="vg-stagger flex flex-col gap-2 rounded-2xl p-3 flex-1 vg-scroll" style={{ background: T.surface, border: "1px solid " + T.line }}>
          {names.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: T.raised, color: T.lamp }}
              >
                {i + 1}
              </div>
              <input
                value={n}
                onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={"שחקן " + (i + 1)}
                className="flex-1 min-w-0 rounded-xl px-3 py-2 text-base outline-none"
                style={{ background: T.bg, color: T.ink, border: "1px solid " + T.line }}
              />
            </div>
          ))}
        </section>
      )}

      {count > 1 && (
        <section className="vg-rise shrink-0 rounded-2xl px-3 py-0.5" style={{ background: T.surface, border: "1px solid " + T.line }}>
          <Toggle
            on={mode === "line"}
            onChange={(v) => setMode(v ? "line" : "char")}
            label="הקלטות רנדומליות"
            hint="דלוק: שורות אקראיות לכל אחד, כל דמות נשמעת בכל פעם בקול אחר. יותר מצחיק. כבוי: כל דמות שייכת לשחקן אחד."
          />
        </section>
      )}

      <div className="shrink-0 mt-auto pt-1">
        <PrimaryButton onClick={next}>
          לבחור סיפור <ArrowLeft size={18} />
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ---------------- שלב 2: איזה סיפור ---------------- */
function StoryStep({ stories, storyId, playerCount, onPick, onBack }) {
  const counts = useMemo(() => {
    const m = {};
    (stories || []).forEach((s) => { m[s.id] = flattenLines(s).length; });
    return m;
  }, [stories]);
  const clean = (stories || []).filter((s) => !s.adult);
  const spicy = (stories || []).filter((s) => s.adult);
  const recId = (clean.find((s) => fits(s, playerCount)) || clean[clean.length - 1] || {}).id;

  return (
    <div className="vg-slide flex flex-col gap-3 flex-1 min-h-0">
      <header className="shrink-0 text-center">
        <div className="text-4xl vg-float">📖</div>
        <h1 className="text-2xl font-bold mt-1">איזה סיפור?</h1>
        <p className="mt-2 text-sm" style={{ color: T.muted }}>
          {playerCount === 1 ? "אתה לבד" : playerCount + " שחקנים"} · כל אחד מקליט בערך{" "}
          <span style={{ color: T.ink }}>{Math.round((counts[recId] || 0) / playerCount)}</span> שורות בסיפור המומלץ
        </p>
      </header>

      <div className="flex-1 vg-scroll flex flex-col gap-3">
      {spicy.length > 0 && (
        <div className="flex items-center gap-2 text-xs" style={{ color: T.dim }}>
          <div className="h-px flex-1" style={{ background: T.line }} />
          רגיל
          <div className="h-px flex-1" style={{ background: T.line }} />
        </div>
      )}

      <div className="vg-stagger flex flex-col gap-3">
        {clean.map((s) => {
          const isRec = s.id === recId;
          const on = s.id === storyId;
          const nEnd = endingIds(s).length;
          const each = Math.round((counts[s.id] || 0) / playerCount);
          return (
            <button
              key={s.id}
              onClick={() => onPick(s.id)}
              className={"vg-press w-full rounded-2xl p-3.5 text-right relative overflow-hidden" + (isRec ? " vg-glow" : "")}
              style={{
                background: isRec ? T.lamp + "14" : T.surface,
                border: "1px solid " + (isRec ? T.lamp : on ? T.muted : T.line),
              }}
            >
              {isRec && (
                <div
                  className="absolute top-3 left-3 text-xs rounded-full px-2 py-0.5 flex items-center gap-1"
                  style={{ background: T.lamp, color: T.onLamp }}
                >
                  <Sparkles size={12} /> מומלץ לכם
                </div>
              )}
              <div className="text-xl font-bold" style={{ color: isRec ? T.lamp : T.ink }}>{s.title}</div>
              <div className="text-xs mt-0.5" style={{ color: T.dim }}>{s.players}</div>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: T.muted }}>{s.intro}</p>
              <div className="flex gap-3 mt-2 text-xs" style={{ color: T.dim }}>
                <span><span style={{ color: T.ink }}>{counts[s.id]}</span> שורות</span>
                <span><span style={{ color: T.ink }}>{nEnd}</span> סופים</span>
                <span>~<span style={{ color: T.ink }}>{each}</span> לכל אחד</span>
              </div>
            </button>
          );
        })}
      </div>

      {spicy.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-xs mt-1" style={{ color: T.rec }}>
            <div className="h-px flex-1" style={{ background: T.line }} />
            <Lock size={12} /> 18+ · למבוגרים בלבד
            <div className="h-px flex-1" style={{ background: T.line }} />
          </div>
          <div className="vg-stagger flex flex-col gap-3">
            {spicy.map((s) => {
              const isRec = fits(s, playerCount);
              const nEnd = endingIds(s).length;
              const each = Math.round((counts[s.id] || 0) / playerCount);
              return (
                <button
                  key={s.id}
                  onClick={() => onPick(s.id)}
                  className="vg-press w-full rounded-2xl p-3.5 text-right relative overflow-hidden"
                  style={{
                    background: isRec ? "rgba(224,67,63,.10)" : T.surface,
                    border: "1px solid " + (isRec ? T.rec : s.id === storyId ? T.muted : T.line),
                  }}
                >
                  <div
                    className="absolute top-3 left-3 text-xs rounded-full px-2 py-0.5 font-bold"
                    style={{ background: T.rec, color: "#fff" }}
                  >
                    18+
                  </div>
                  <div className="text-xl font-bold" style={{ color: isRec ? T.rec : T.ink }}>{s.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: T.dim }}>{s.players}</div>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: T.muted }}>{s.intro}</p>
                  <div className="flex gap-3 mt-2 text-xs" style={{ color: T.dim }}>
                    <span><span style={{ color: T.ink }}>{counts[s.id]}</span> שורות</span>
                    <span><span style={{ color: T.ink }}>{nEnd}</span> סופים</span>
                    <span>~<span style={{ color: T.ink }}>{each}</span> לכל אחד</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      </div>

      <button onClick={onBack} className="shrink-0 py-2 text-sm flex items-center justify-center gap-1" style={{ color: T.muted }}>
        <Users size={14} /> לשנות כמה אתם
      </button>
    </div>
  );
}

/* ---------------- שלב 3: המסך הראשי ---------------- */
export default function HomeScreen({
  script, chars, lines, recordings, endings, storageOk, storageWarn, canInstall, blind,
  stories, storyId, onSelectStory, players, splitMode, playerStats, onSetParty, onPlayer,
  setupDone, onSetupDone, adultUnlocked, onUnlockAdult,
  onStudio, onPlay, onScript, onMore, onInstall,
}) {
  const [step, setStep] = useState(setupDone ? "main" : "players");
  const party = !!(players && players.length > 1);
  const playerCount = party ? players.length : 1;
  const c = countLines(lines, recordings);
  const npcMissing = c.npcTotal - c.npcRecorded;
  const ready = c.npcTotal > 0 && npcMissing === 0;
  const firstMissing = lines.findIndex((l) => !recordings[l.id]);
  const [showLines, setShowLines] = useState(false);

  const allEndings = useMemo(() => endingIds(script), [script]);
  const found = allEndings.filter((id) => endings.includes(id));

  const groups = useMemo(() => {
    const g = [];
    let cur = null;
    lines.forEach((l, i) => {
      if (!cur || cur.nodeId !== l.nodeId) {
        cur = { nodeId: l.nodeId, scene: l.scene, items: [] };
        g.push(cur);
      }
      cur.items.push({ ...l, index: i });
    });
    return g;
  }, [lines]);

  const shell = (children) => (
    <div className="flex flex-col flex-1 min-h-0 px-4 pt-3 pb-3 gap-3">
      <div className="shrink-0"><StepDots step={step} /></div>
      {children}
    </div>
  );

  if (step === "players") {
    return shell(
      <PlayersStep
        players={players || []}
        splitMode={splitMode}
        adultUnlocked={adultUnlocked}
        onUnlockAdult={onUnlockAdult}
        onDone={(names, mode) => { onSetParty(names, mode); setStep("story"); }}
      />
    );
  }

  if (step === "story") {
    return shell(
      <StoryStep
        stories={stories}
        storyId={storyId}
        playerCount={playerCount}
        onPick={(id) => { if (id !== storyId) onSelectStory(id); onSetupDone(); setStep("main"); }}
        onBack={() => setStep("players")}
      />
    );
  }

  return shell(
    <div className="vg-slide flex flex-col flex-1 min-h-0 gap-3">
      <div className="flex-1 vg-scroll flex flex-col gap-4">
      <header className="vg-stagger">
        <div className="flex items-center justify-between text-xs" style={{ color: T.dim }}>
          <button onClick={() => setStep("players")} className="flex items-center gap-1 py-1" style={{ color: T.muted }}>
            <Users size={13} /> {party ? players.length + " שחקנים" : "משחק יחיד"} <Pencil size={11} />
          </button>
          <button onClick={() => setStep("story")} className="flex items-center gap-1 py-1" style={{ color: T.muted }}>
            <Shuffle size={13} /> לסיפור אחר
          </button>
        </div>
        <h1 className="text-3xl font-bold leading-tight mt-2">{script.title}</h1>
        <p className="mt-2 text-base leading-relaxed" style={{ color: T.muted }}>{script.intro}</p>
      </header>

      <section className="vg-rise rounded-3xl p-4 flex flex-col gap-4" style={{ background: T.surface, border: "1px solid " + T.line }}>
        <div>
          <div className="flex items-baseline justify-between">
            <div className="text-sm" style={{ color: T.muted }}>שורות של הדמויות</div>
            <div className="text-2xl font-bold">
              <span style={{ color: ready ? T.ok : T.lamp }}>{c.npcRecorded}</span>
              <span style={{ color: T.dim }}> / {c.npcTotal}</span>
            </div>
          </div>
          <div className="mt-2"><ProgressBar pct={c.npcTotal ? (c.npcRecorded / c.npcTotal) * 100 : 0} /></div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <div className="text-sm" style={{ color: T.muted }}>התשובות שלך <span style={{ color: T.dim }}>(רשות)</span></div>
            <div className="text-lg font-bold">
              <span style={{ color: T.ink }}>{c.choiceRecorded}</span>
              <span style={{ color: T.dim }}> / {c.choiceTotal}</span>
            </div>
          </div>
          <div className="mt-2"><ProgressBar pct={c.choiceTotal ? (c.choiceRecorded / c.choiceTotal) * 100 : 0} color={T.muted} /></div>
        </div>

        <div className="flex flex-col gap-2">
          {party ? (
            <div className="vg-stagger flex flex-col gap-2">
              <div className="text-xs" style={{ color: T.dim }}>תן את הטלפון לשחקן שתורו להקליט</div>
              {players.map((name, i) => {
                const st = (playerStats && playerStats[i]) || { total: 0, done: 0 };
                const done = st.total > 0 && st.done === st.total;
                const pct = st.total ? (st.done / st.total) * 100 : 0;
                return (
                  <button
                    key={i}
                    onClick={() => onPlayer(i)}
                    className="vg-press w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-right relative overflow-hidden"
                    style={{ background: T.raised, border: "1px solid " + (done ? T.ok : T.line) }}
                  >
                    <div className="absolute inset-y-0 right-0 opacity-10" style={{ width: pct + "%", background: done ? T.ok : T.lamp, transition: "width .5s" }} />
                    <div
                      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold relative"
                      style={{ background: T.surface, color: done ? T.ok : T.lamp }}
                    >
                      {done ? <Check size={16} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0 relative">
                      <div className="text-sm font-bold truncate">{name}</div>
                      <div className="text-xs" style={{ color: done ? T.ok : T.dim }}>
                        {done ? "סיים להקליט" : st.done + " מתוך " + st.total + " הוקלטו"}
                      </div>
                    </div>
                    <Mic size={16} className="relative" style={{ color: done ? T.ok : T.lamp }} />
                  </button>
                );
              })}
            </div>
          ) : (
            <PrimaryButton onClick={() => onStudio(firstMissing >= 0 ? firstMissing : 0)} disabled={c.total === 0}>
              <Mic size={18} /> {c.recorded < c.total ? "להקליט שורות" : "לשמוע ולהקליט מחדש"}
            </PrimaryButton>
          )}
          {canInstall && (
            <button
              onClick={onInstall}
              className="w-full rounded-2xl py-2 text-sm flex items-center justify-center gap-2"
              style={{ color: T.lamp }}
            >
              <Download size={16} /> להתקין כאפליקציה בטלפון
            </button>
          )}
        </div>

        {!storageOk && (
          <p className="text-xs" style={{ color: T.dim }}>
            הדפדפן לא מאפשר אחסון קבוע (גלישה פרטית?), אז ההקלטות נשמרות רק כל עוד החלון פתוח.
          </p>
        )}
        {storageWarn && <p className="text-xs" style={{ color: T.rec }}>{storageWarn}</p>}
      </section>

      <section className="vg-rise rounded-3xl p-4" style={{ background: T.surface, border: "1px solid " + T.line }}>
        <div className="flex items-baseline justify-between">
          <div className="text-sm" style={{ color: T.muted }}>סופים שגילית</div>
          <div className="text-lg font-bold">
            <span style={{ color: found.length === allEndings.length && allEndings.length > 0 ? T.ok : T.ink }}>{found.length}</span>
            <span style={{ color: T.dim }}> / {allEndings.length}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {allEndings.map((id) => {
            const done = endings.includes(id);
            const title = done ? script.nodes[id].ending.title : "?";
            return (
              <span
                key={id}
                className="text-xs rounded-full px-3 py-1"
                style={{
                  background: done ? T.lamp + "22" : T.raised,
                  color: done ? T.lamp : T.dim,
                  border: "1px solid " + (done ? T.lamp + "66" : T.line),
                  minWidth: done ? 0 : 34,
                  textAlign: "center",
                }}
              >
                {title}
              </span>
            );
          })}
        </div>
      </section>

      <section>
        <button
          onClick={() => setShowLines((v) => !v)}
          className="w-full flex items-center justify-between py-2 text-sm"
          style={{ color: T.muted }}
        >
          <span>כל השורות ({c.recorded} מתוך {c.total} הוקלטו)</span>
          {showLines ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showLines && blind && (
          <div
            className="rounded-2xl p-4 mt-2 text-sm leading-relaxed"
            style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}
          >
            הקלטה עיוורת פעילה, אז רשימת השורות מוסתרת — היא מסודרת לפי הסיפור והיא תגלה לך אותו.
            <div className="mt-1" style={{ color: T.dim }}>אפשר לכבות את המצב הזה בהגדרות.</div>
          </div>
        )}
        {showLines && !blind && (
          <div className="flex flex-col gap-5 mt-2">
            {groups.map((g) => (
              <div key={g.nodeId}>
                <div className="mb-2"><SceneLabel text={g.scene} /></div>
                <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: "1px solid " + T.line }}>
                  {g.items.map((l, j) => {
                    const ch = getChar(chars, l.speaker);
                    const done = !!recordings[l.id];
                    return (
                      <button
                        key={l.id}
                        onClick={() => onStudio(l.index)}
                        className="w-full text-right flex items-center gap-3 px-3 py-3"
                        style={{
                          borderTop: j ? "1px solid " + T.line : "none",
                          background: l.kind === "choice" ? "rgba(126,226,208,0.05)" : "transparent",
                        }}
                      >
                        <Avatar char={ch} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs" style={{ color: ch.color }}>
                            {ch.name}
                            {l.kind === "choice" && <span style={{ color: T.dim }}> (תשובה)</span>}
                          </div>
                          <div className="text-sm truncate" style={{ color: done ? T.ink : T.muted }}>{l.text}</div>
                        </div>
                        <div
                          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                          style={{
                            background: done ? "rgba(134,197,143,0.15)" : "transparent",
                            border: "1px solid " + (done ? T.ok : T.line),
                            color: done ? T.ok : T.dim,
                          }}
                        >
                          {done ? <Check size={14} /> : <Mic size={13} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </div>

      <div className="shrink-0 flex flex-col gap-2">
        <PrimaryButton onClick={onPlay} disabled={c.total === 0} tone={ready ? "ok" : "quiet"}>
          <Play size={18} /> {ready ? "לשחק" : "לשחק בכל זאת (חסרות " + npcMissing + " שורות)"}
        </PrimaryButton>
        <footer className="flex gap-2">
          <button
            onClick={onScript}
            className="flex-1 rounded-2xl py-2.5 text-sm flex items-center justify-center gap-2"
            style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}
          >
            <FileText size={16} /> תסריט
          </button>
          <button
            onClick={onMore}
            className="flex-1 rounded-2xl py-2.5 text-sm flex items-center justify-center gap-2"
            style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}
          >
            <Settings size={16} /> הגדרות
          </button>
        </footer>
      </div>
    </div>
  );
}
