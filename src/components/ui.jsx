import React from "react";
import { T } from "../theme.js";

export function Avatar({ char, size = 40, glow = false }) {
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.52),
        lineHeight: 1,
        background: char.color + "22",
        border: "2px solid " + char.color,
        boxShadow: glow ? "0 0 28px " + char.color + "55" : "none",
      }}
    >
      <span>{char.emoji}</span>
    </div>
  );
}

export function ProgressBar({ pct, color }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: T.raised }}>
      <div
        className="h-full rounded-full"
        style={{ width: Math.max(0, Math.min(100, pct)) + "%", background: color || (pct >= 100 ? T.ok : T.lamp), transition: "width .4s" }}
      />
    </div>
  );
}

export function SceneLabel({ text }) {
  if (!text) return null;
  return (
    <div className="flex gap-2 items-start pr-1">
      <span className="shrink-0 w-1 rounded-full mt-1" style={{ background: T.lamp, height: 14 }} />
      <p className="text-xs leading-relaxed" style={{ color: T.muted }}>{text}</p>
    </div>
  );
}

export function TopBar({ onBack, backIcon, title, right }) {
  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-1">
      <button onClick={onBack} className="p-2 rounded-xl" style={{ color: T.muted }} aria-label="חזרה">
        {backIcon}
      </button>
      <div className="text-sm font-bold">{title}</div>
      <div className="min-w-9 text-left">{right || null}</div>
    </div>
  );
}

export function Toggle({ on, onChange, label, hint, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className="w-full flex items-center gap-3 py-3 text-right"
      style={{ opacity: disabled ? 0.5 : 1 }}
      role="switch"
      aria-checked={on}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm" style={{ color: T.ink }}>{label}</div>
        {hint && <div className="text-xs mt-0.5 leading-relaxed" style={{ color: T.dim }}>{hint}</div>}
      </div>
      <div
        className="shrink-0 rounded-full relative"
        style={{ width: 44, height: 26, background: on ? T.lamp : T.raised, border: "1px solid " + (on ? T.lamp : T.line), transition: "background .2s" }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 20, height: 20, top: 2,
            right: on ? 20 : 2,
            background: on ? T.onLamp : T.muted,
            transition: "right .2s",
          }}
        />
      </div>
    </button>
  );
}

export function PrimaryButton({ onClick, disabled, children, tone = "lamp", className = "" }) {
  const styles =
    tone === "ok" ? { background: T.ok, color: "#0f1a12" }
    : tone === "quiet" ? { background: T.raised, color: T.muted, border: "1px solid " + T.line }
    : { background: T.lamp, color: T.onLamp };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={"w-full rounded-2xl py-3 font-bold flex items-center justify-center gap-2 text-base " + className}
      style={{ ...styles, opacity: disabled ? 0.5 : 1 }}
    >
      {children}
    </button>
  );
}
