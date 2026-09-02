import React, { useState } from "react";
import { Home, Copy, Check } from "lucide-react";
import { T } from "../theme.js";
import { DEFAULT_SCRIPT } from "../data/script.js";
import { validateScript } from "../lib/script.js";

export default function ScriptScreen({ script, onApply, onReset, onBack }) {
  const [text, setText] = useState(() => JSON.stringify(script, null, 2));
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [armReset, setArmReset] = useState(false);

  function save() {
    let s;
    try { s = JSON.parse(text); }
    catch (e) { setErr("ה-JSON לא תקין: " + ((e && e.message) || "")); return; }
    const problem = validateScript(s);
    if (problem) { setErr(problem); return; }
    setErr("");
    onApply(s);
    onBack();
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) { /* בלי גישה ללוח */ }
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen px-4 pt-3 pb-6 gap-3">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ color: T.muted }} aria-label="חזרה">
          <Home size={22} />
        </button>
        <div className="font-bold">התסריט</div>
        <button onClick={copyAll} className="p-2 rounded-xl" style={{ color: copied ? T.ok : T.muted }} aria-label="העתקה">
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: T.muted }}>
        כל שורה ותשובה צריכות id ייחודי. ההקלטות נשמרות לפי ה-id, אז אם משנים id ההקלטה שלו מתנתקת.
        תשובה יכולה לכלול sanity, sets, clears ו-requires (דגלים שפותחים תשובות נסתרות).
        אפשר להעתיק את הכול, לבקש תסריט חדש באותו מבנה, ולהדביק כאן.
      </p>
      <textarea
        dir="ltr"
        value={text}
        onChange={(e) => { setText(e.target.value); setErr(""); }}
        spellCheck={false}
        className="flex-1 w-full rounded-2xl p-3 text-xs outline-none"
        style={{
          background: T.surface,
          color: T.ink,
          border: "1px solid " + (err ? T.rec : T.line),
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          minHeight: 320,
          resize: "vertical",
        }}
      />
      {err && <div className="text-xs" style={{ color: T.rec }}>{err}</div>}
      <div className="flex gap-2">
        <button onClick={save} className="flex-1 rounded-2xl py-3 font-bold" style={{ background: T.lamp, color: T.onLamp }}>
          לשמור תסריט
        </button>
        <button
          onClick={() => {
            if (armReset) {
              onReset();
              setText(JSON.stringify(DEFAULT_SCRIPT, null, 2));
              setErr("");
              setArmReset(false);
            } else {
              setArmReset(true);
              setTimeout(() => setArmReset(false), 3500);
            }
          }}
          className="rounded-2xl px-4 py-3 text-sm"
          style={{
            background: armReset ? "rgba(224,67,63,0.15)" : T.surface,
            border: "1px solid " + (armReset ? T.rec : T.line),
            color: armReset ? T.rec : T.muted,
          }}
        >
          {armReset ? "בטוח? לחץ שוב" : "ברירת מחדל"}
        </button>
      </div>
    </div>
  );
}
