import React, { useMemo, useState } from "react";
import { Mic, Play, Check, FileText, Settings, Download, ChevronDown, ChevronUp } from "lucide-react";
import { T } from "../theme.js";
import { getChar, countLines, endingIds } from "../lib/script.js";
import { Avatar, ProgressBar, SceneLabel, PrimaryButton } from "../components/ui.jsx";

export default function HomeScreen({
  script, chars, lines, recordings, endings, storageOk, storageWarn, canInstall,
  onStudio, onPlay, onScript, onMore, onInstall,
}) {
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

  return (
    <div className="flex flex-col flex-1 px-4 pt-7 pb-10 gap-6">
      <header>
        <h1 className="text-3xl font-bold leading-tight">{script.title}</h1>
        <p className="mt-2 text-base leading-relaxed" style={{ color: T.muted }}>{script.intro}</p>
      </header>

      <section className="rounded-3xl p-4 flex flex-col gap-4" style={{ background: T.surface, border: "1px solid " + T.line }}>
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

        <p className="text-xs leading-relaxed" style={{ color: T.dim }}>
          קודם מקליטים כל שורה בקול, בקול שלך או של מי שמתנדב, ורק אז משחקים. תשובות בלי הקלטה יופיעו כטקסט.
        </p>

        <div className="flex flex-col gap-2">
          <PrimaryButton onClick={() => onStudio(firstMissing >= 0 ? firstMissing : 0)} disabled={c.total === 0}>
            <Mic size={18} /> {c.recorded < c.total ? "להקליט שורות" : "לשמוע ולהקליט מחדש"}
          </PrimaryButton>
          <PrimaryButton onClick={onPlay} disabled={c.total === 0} tone={ready ? "ok" : "quiet"}>
            <Play size={18} /> {ready ? "לשחק" : "לשחק בכל זאת (חסרות " + npcMissing + " שורות)"}
          </PrimaryButton>
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

      <section className="rounded-3xl p-4" style={{ background: T.surface, border: "1px solid " + T.line }}>
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
        {showLines && (
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

      <footer className="flex gap-2">
        <button
          onClick={onScript}
          className="flex-1 rounded-2xl py-3 text-sm flex items-center justify-center gap-2"
          style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}
        >
          <FileText size={16} /> תסריט
        </button>
        <button
          onClick={onMore}
          className="flex-1 rounded-2xl py-3 text-sm flex items-center justify-center gap-2"
          style={{ background: T.surface, border: "1px solid " + T.line, color: T.muted }}
        >
          <Settings size={16} /> הגדרות וגיבוי
        </button>
      </footer>
    </div>
  );
}
