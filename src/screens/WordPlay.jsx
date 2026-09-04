import React, { useEffect, useMemo, useState } from "react";
import { X, Play, RotateCcw, Volume2, ChevronLeft, BookOpen } from "lucide-react";
import { T } from "../theme.js";
import { playRec } from "../lib/audio.js";
import { speak, stopTTS, ttsSupported } from "../lib/tts.js";
import { RULE_PARTS, buildStory, ruleRecId, activeRoster } from "../data/wordgame.js";

// כמה זמן להשאיר טקסט על המסך כדי שאפשר יהיה לקרוא אותו בנחת.
// קצב קבוע לא עובד: משפט של 60 תווים צריך יותר זמן מאחד של 12.
// speed = מכפיל מההגדרות: 1 רגיל, קטן מ-1 מהיר יותר, גדול מ-1 איטי יותר.
function readMs(text, speed) {
  const len = (text || "").trim().length;
  const k = speed || 1;
  if (len < 4) return 500 * k;
  return Math.round(Math.max(1100, Math.min(4200, 800 + len * 45)) * k);
}

const PAGE_CHARS = 320;     // פרק ארוך מזה נחלק לעמודים, שלא ייווצר קיר של טקסט
const CHAPTER_BREATH = 650; // נשימה בתחילת פרק, שהשם הראשון לא יישמע ברגע שהעמוד מתחלף
const PAGE_BREATH = 350;
const POP_MS = 450;         // הנקודות הצהובות קופצות, ורק אז המילה נשמעת
const AFTER_WORD = 200;     // רגע אחרי כל מילה לפני שהטקסט ממשיך
const CHAPTER_HOLD = 800;   // בסוף פרק משאירים אותו על המסך רגע לפני שעוברים הלאה

function weight(p) { return p.slot ? 5 : (p.text || "").length; }

// הטקסט מצטבר בתוך הפרק, חתיכה אחרי חתיכה. רק פרק ארוך במיוחד נשבר לעמודים,
// והחיתוך נעשה במקום הכי מאוזן שמותר: לפני קטע טקסט, לא אחרי שם ולא אחרי
// אות בודדת, ואף פעם לא לפני מילה מוקלטת — הטקסט שלפניה מוביל אליה.
function toPages(parts) {
  const total = parts.reduce((a, p) => a + weight(p), 0);
  if (total <= PAGE_CHARS) return [parts];
  const target = Math.ceil(total / Math.ceil(total / PAGE_CHARS));
  const pages = [];
  let cur = [];
  let len = 0;
  parts.forEach((p, i) => {
    const prev = cur[cur.length - 1];
    const prevShort = !!(prev && prev.text && !prev.isName && prev.text.trim().length < 4);
    const prevName = !!(prev && prev.isName);
    const rest = parts.slice(i).reduce((a, q) => a + weight(q), 0);
    const canBreak = !p.slot && !p.isName && !prevShort && !prevName && cur.length >= 3 && rest >= 60;
    if (canBreak && len + weight(p) > target) { pages.push(cur); cur = []; len = 0; }
    cur.push(p);
    len += weight(p);
  });
  if (cur.length) pages.push(cur);
  return pages;
}

export default function WordPlay({ roster, recordings, seed, onNewStory, onExit, audioRef, narrator, setId, speed, tts, ttsVoice, ttsRate, live }) {
  const players = (roster || []).map((r) => r.name);
  const readerName = narrator >= 0 && roster && roster[narrator] ? roster[narrator].name : null;
  const [phase, setPhase] = useState("intro"); // intro | preview | rules | story | end
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
  // הטלפון מקריא: רק כשאין הקלטה של מקריא אנושי לאותו קטע
  const robot = !!tts && ttsSupported();
  // מישהו מקריא בשידור חי: הטקסט מחכה להקשה במקום להתקדם לפי שעון
  const liveRead = !!live && !robot;

  function stopAudio() {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch (e) { /* ignore */ } }
    stopTTS();
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
      const hold = readMs(rule ? rule.text : "", speed);
      if (r && a) stop = playRec(a, r, () => later(finish, AFTER_WORD), () => later(finish, hold), () => later(finish, hold));
      else if (robot && rule) {
        // אף אחד לא הקליט את החוק הזה — הטלפון מקריא אותו
        setSpeaking(true);
        stop = speak(rule.text, {
          voiceURI: ttsVoice, rate: ttsRate || 1,
          onEnd: () => { setSpeaking(false); later(finish, AFTER_WORD); },
          onFail: () => { setSpeaking(false); later(finish, hold); },
        });
      } else later(finish, hold);
    } else if (part && page) {
      const first = pi === 0;
      const breath = first ? (page.k === 0 ? CHAPTER_BREATH : PAGE_BREATH) : 0;
      const lastOnPage = pi === page.parts.length - 1;
      const lastInChapter = lastOnPage && page.k === page.n - 1;
      const tail = AFTER_WORD + (lastInChapter ? CHAPTER_HOLD : lastOnPage ? 350 : 0);
      const r = part.recId && !part.missing ? recordings[part.recId] : null;
      const isWord = !!(part.slot || part.isName);
      const hold = part.isName ? 1100 : part.missing ? 1400 : readMs(part.text, speed);
      const onEnd = () => { setSpeaking(false); later(finish, tail); };
      const onFail = () => { setSpeaking(false); later(finish, hold); };
      if (r && a) {
        // טקסט: שומעים את המקריא. מילה: קודם הנקודות קופצות, ורק אז שומעים.
        later(() => { setSpeaking(true); stop = playRec(a, r, onEnd, onFail, onFail); }, breath + (isWord ? POP_MS : 120));
      } else if (robot && !isWord && !part.missing) {
        // אין מקריא אנושי לקטע הזה — הטלפון מקריא אותו. הקלטות ושמות אף פעם לא.
        later(() => {
          setSpeaking(true);
          stop = speak(part.text, { voiceURI: ttsVoice, rate: ttsRate || 1, onEnd, onFail });
        }, breath + 80);
      } else if (liveRead && !isWord && !part.missing) {
        // מישהו קורא את זה בקול. מחכים לו, בלי שעון.
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
  }, [phase, ri, pgi, pi, robot, liveRead, ttsVoice, ttsRate]);

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
        {readerName ? (
          <div className="mt-3 rounded-2xl px-4 py-3 text-sm leading-relaxed flex items-start gap-2" style={{ background: T.lamp + "1a", border: "1px solid " + T.lamp + "66", color: T.ink }}>
            <BookOpen size={16} className="shrink-0 mt-0.5" style={{ color: T.lamp }} />
            <div>
              <span style={{ color: T.lamp, fontWeight: 700 }}>{readerName}</span>
              {narrated ? " מספר את הסיפור. הטקסט מתקדם לפי הקול שלו, והמילים שלכם נכנסות באמצע."
                : robot ? " נבחר להקריא אבל עוד לא הקליט — בינתיים הטלפון מקריא את הסיפור."
                : " נבחר להקריא אבל עוד לא הקליט את הסיפור — הטקסט יעבור לבד בקצב קריאה."}
            </div>
          </div>
        ) : liveRead ? (
          <div className="mt-3 rounded-2xl px-4 py-3 text-sm leading-relaxed flex items-start gap-2" style={{ background: T.lamp + "1a", border: "1px solid " + T.lamp + "66", color: T.ink }}>
            <BookOpen size={16} className="shrink-0 mt-0.5" style={{ color: T.lamp }} />
            <div>
              אחד מכם <span style={{ color: T.lamp, fontWeight: 700 }}>קורא בקול מהמסך</span>. הטקסט מחכה להקשה אחרי כל משפט, וההקלטות מתנגנות לבד.
            </div>
          </div>
        ) : robot ? (
          <div className="mt-3 rounded-2xl px-4 py-3 text-sm leading-relaxed flex items-start gap-2" style={{ background: T.lamp + "1a", border: "1px solid " + T.lamp + "66", color: T.ink }}>
            <Volume2 size={16} className="shrink-0 mt-0.5" style={{ color: T.lamp }} />
            <div>
              <span style={{ color: T.lamp, fontWeight: 700 }}>הטלפון מקריא</span> את הסיפור בקול, והמילים והשמות שהקלטתם נשמעים בקול שלכם.
            </div>
          </div>
        ) : null}
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
          onClick={() => setPhase("preview")}
          className="vg-press mt-2 w-full rounded-2xl py-3 text-sm flex items-center justify-center gap-2"
          style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}
        >
          <BookOpen size={16} /> לקרוא את הסיפור לפני
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

  // קריאה מראש: כל הסיפור כטקסט אחד, בלי להשמיע כלום
  if (phase === "preview") {
    return shell(
      <>
        <div className="flex-1 vg-scroll px-5 py-4">
          <h2 className="text-xl font-bold">{story.setTitle || "הסיפור"}</h2>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: T.dim }}>
            זה כל הסיפור שיצא הפעם. ●●● זאת מילה מוקלטת של מישהו — היא תישמע רק בהשמעה,
            אז גם מי שקורא מראש לא יודע מה ייצא. אף אחד לא שומע כלום עכשיו.
          </p>
          {story.map((ch, ci) => (
            <div key={ci} className="mt-5">
              <div className="text-xs mb-1" style={{ color: T.lamp }}>פרק {ci + 1} · {ch.title}</div>
              <p className="text-base leading-relaxed">
                {ch.parts.map((p, k) => {
                  if (p.isName) return <span key={k} style={{ color: T.ok, fontWeight: 700 }}>{p.text} </span>;
                  if (p.text) {
                    const t = p.text.trim();
                    return <span key={k} style={{ color: T.ink }}>{t}{/־$/.test(t) ? "" : " "}</span>;
                  }
                  const missing = p.missing || !recordings[p.recId];
                  return (
                    <span key={k} style={{ color: missing ? T.rec : T.lamp, fontWeight: 700 }}>
                      {missing ? "[" + p.label + " — חסר] " : "●●● "}
                    </span>
                  );
                })}
              </p>
            </div>
          ))}
          <div className="h-4" />
        </div>
        <div className="shrink-0 px-4 pb-5 pt-2 flex gap-2">
          <button
            onClick={startStory}
            className="vg-press flex-1 rounded-2xl py-3 font-bold flex items-center justify-center gap-2"
            style={{ background: T.lamp, color: T.onLamp }}
          >
            <Play size={18} /> להתחיל
          </button>
          <button
            onClick={() => setPhase("intro")}
            className="vg-press rounded-2xl px-4 py-3 text-sm"
            style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}
          >
            חזרה
          </button>
        </div>
      </>
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
  const partRec = part && part.recId && !part.missing ? recordings[part.recId] : null;
  const waitingForMe = phase === "story" && liveRead && !!part && !part.slot && !part.isName && !part.missing && !partRec;
  const who = !part ? null
    : part.narr ? readerName
    : part.player != null ? ((roster || []).find((r) => r.id === part.player) || {}).name || "מישהו"
    : robot && part.text ? "הטלפון מקריא"
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
            if (p.text) {
              // "נוגע ב" + מילה מוקלטת: מדביקים את האות עם מקף, שלא תרחף לבד
              const t = p.text.trim();
              const glue = /־$/.test(t) || /(^|\s)[בלמוכשה]$/.test(t);
              const shown = glue && !/־$/.test(t) ? t + "־" : t;
              return (
                <span key={k} className={last ? "vg-fade" : ""} style={{ color: last ? T.ink : T.muted }}>{shown}{glue ? "" : " "}</span>
              );
            }
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
      <div className="shrink-0 px-4 pb-5 text-center text-xs" style={{ color: waitingForMe ? T.lamp : T.dim }}>
        {waitingForMe ? "תקריא בקול, ואז הקש כדי להמשיך" : "הקשה על המסך מדלגת קדימה"}
      </div>
    </>
  );
}
