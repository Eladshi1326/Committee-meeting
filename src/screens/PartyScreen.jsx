import React, { useState } from "react";
import { Home, Plus, Minus, Users, Shuffle } from "lucide-react";
import { T } from "../theme.js";
import { Toggle } from "../components/ui.jsx";

const MAX = 12;

export default function PartyScreen({ players, splitMode, onApply, onBack, lineCount }) {
  const [names, setNames] = useState(players.length ? players.slice() : ["", ""]);
  const [mode, setMode] = useState(splitMode || "line");

  const count = names.length;
  const each = count > 1 ? Math.round(lineCount / count) : lineCount;

  function setCount(n) {
    const c = Math.max(1, Math.min(MAX, n));
    setNames((prev) => {
      const next = prev.slice(0, c);
      while (next.length < c) next.push("");
      return next;
    });
  }

  function save() {
    const clean = names.map((n, i) => (n.trim() || "שחקן " + (i + 1)));
    onApply(count > 1 ? clean : [], mode);
    onBack();
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen px-4 pt-3 pb-8 gap-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ color: T.muted }} aria-label="חזרה">
          <Home size={22} />
        </button>
        <div className="font-bold">מי משחק</div>
        <div style={{ width: 38 }} />
      </div>

      <p className="text-sm leading-relaxed" style={{ color: T.muted }}>
        כל שחקן מקבל את הטלפון ומקליט רק את השורות שלו, בסדר אקראי ובלי לדעת מי הדמות ומה קורה בסיפור.
        אף אחד לא רואה את השורות של האחרים.
      </p>

      <section className="rounded-3xl p-4" style={{ background: T.surface, border: "1px solid " + T.line }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm"><Users size={18} style={{ color: T.lamp }} /> כמה שחקנים</div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCount(count - 1)} disabled={count <= 1}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: T.raised, color: count <= 1 ? T.dim : T.ink }} aria-label="פחות">
              <Minus size={16} />
            </button>
            <div className="text-2xl font-bold w-8 text-center">{count}</div>
            <button onClick={() => setCount(count + 1)} disabled={count >= MAX}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: T.raised, color: count >= MAX ? T.dim : T.ink }} aria-label="עוד">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs" style={{ color: T.dim }}>
          {count > 1 ? "בערך " + each + " שורות לכל אחד" : "אתה מקליט את כל " + lineCount + " השורות"}
        </div>
      </section>

      {count > 1 && (
        <section className="rounded-3xl p-4 flex flex-col gap-2" style={{ background: T.surface, border: "1px solid " + T.line }}>
          <div className="text-xs pb-1" style={{ color: T.dim }}>שמות</div>
          {names.map((n, i) => (
            <input
              key={i}
              value={n}
              onChange={(e) => setNames((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder={"שחקן " + (i + 1)}
              className="w-full rounded-xl px-3 py-2 text-base outline-none"
              style={{ background: T.bg, color: T.ink, border: "1px solid " + T.line }}
            />
          ))}
        </section>
      )}

      {count > 1 && (
        <section className="rounded-3xl px-4 py-2" style={{ background: T.surface, border: "1px solid " + T.line }}>
          <Toggle
            on={mode === "line"}
            onChange={(v) => setMode(v ? "line" : "char")}
            label="הקלטות רנדומליות"
            hint="דלוק: כל אחד מקבל שורות אקראיות, אז כל דמות נשמעת בכל פעם בקול אחר. יותר מצחיק, וחלוקה שווה בדיוק. כבוי: כל דמות שייכת לשחקן אחד ושומרת קול קבוע, אבל אז החלוקה לא שווה."
          />
        </section>
      )}

      <button
        onClick={save}
        className="mt-auto w-full rounded-2xl py-4 font-bold flex items-center justify-center gap-2"
        style={{ background: T.lamp, color: T.onLamp }}
      >
        <Shuffle size={18} /> {count > 1 ? "לחלק את השורות" : "לשחק לבד"}
      </button>
      {players.length > 0 && (
        <div className="text-xs text-center" style={{ color: T.dim }}>
          חלוקה מחדש מערבבת את השורות בין השחקנים. ההקלטות עצמן נשמרות.
        </div>
      )}
    </div>
  );
}
