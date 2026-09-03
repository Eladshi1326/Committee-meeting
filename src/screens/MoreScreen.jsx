import React, { useRef, useState } from "react";
import { Home, Download, Upload, Trash2, Share, Smartphone, CheckCircle2, Shuffle } from "lucide-react";
import { T } from "../theme.js";
import { Toggle } from "../components/ui.jsx";

function Section({ title, children }) {
  return (
    <section className="rounded-3xl px-4 py-2" style={{ background: T.surface, border: "1px solid " + T.line }}>
      <div className="text-xs pt-2 pb-1" style={{ color: T.dim }}>{title}</div>
      <div className="flex flex-col vg-divide">{children}</div>
    </section>
  );
}

function DangerButton({ label, armedLabel, onConfirm }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      onClick={() => {
        if (armed) { onConfirm(); setArmed(false); }
        else { setArmed(true); setTimeout(() => setArmed(false), 3500); }
      }}
      className="w-full py-3 text-sm flex items-center gap-2 text-right"
      style={{ color: armed ? T.rec : T.muted }}
    >
      <Trash2 size={16} /> {armed ? armedLabel : label}
    </button>
  );
}

export default function MoreScreen({
  settings, onSetSetting, onToggleBlind, onReshuffle, adultUnlocked, onLockAdult, canInstall, installed, ios, onInstall,
  onExport, onImport, exporting, importMsg,
  onClearRecordings, onResetEndings, onResetScript, storageOk, onBack, recordedCount,
}) {
  const fileRef = useRef(null);

  return (
    <div className="flex flex-col flex-1 vg-scroll px-4 pt-3 pb-8 gap-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-xl" style={{ color: T.muted }} aria-label="חזרה">
          <Home size={22} />
        </button>
        <div className="font-bold">הגדרות וגיבוי</div>
        <div style={{ width: 38 }} />
      </div>

      <Section title="משחק">
        <Toggle
          on={!!settings.autoAdvance}
          onChange={(v) => onSetSetting("autoAdvance", v)}
          label="מעבר אוטומטי לשורה הבאה"
          hint="כבוי: כל שורה מחכה להקשה שלך, נוח כשמשחקים עם קהל."
        />
        <Toggle
          on={!!settings.playChoices}
          onChange={(v) => onSetSetting("playChoices", v)}
          label="לנגן את ההקלטות של התשובות שלך"
          hint="כבוי: הבחירה עוברת ישר לשורה הבאה, בלי להשמיע אותך."
        />
        <Toggle
          on={!!settings.muted}
          onChange={(v) => onSetSetting("muted", v)}
          label="טקסט בלבד"
          hint="בלי קול בכלל. השורות מתחלפות לפי אורך הטקסט."
        />
      </Section>

      <Section title="שחקנים">
        <Toggle
          on={settings.realNames !== false}
          onChange={(v) => onSetSetting("realNames", v)}
          label="השמות שלכם בתוך הסיפור"
          hint="כשמשחקים כמה אנשים, הדמויות מקבלות את השמות של השחקנים. מי שמקליט אומר את השם של החבר שלו, ובמשחק שומעים את זה."
        />
        <Toggle
          on={settings.turns !== false}
          onChange={(v) => onSetSetting("turns", v)}
          label="תורות בבחירות"
          hint="בכל צומת מישהו אחר מחליט מה לענות, לפי הסדר של השחקנים. מופיע במשחק: ״התור של דניאל״."
        />
      </Section>

      <Section title="אולפן">
        <Toggle
          on={!!settings.studioAutoNext}
          onChange={(v) => onSetSetting("studioAutoNext", v)}
          label="אחרי כל הקלטה לקפוץ לשורה הבאה שלא הוקלטה"
          hint="מהיר כשמקליטים עשרות שורות ברצף."
        />
        <Toggle
          on={!!settings.studioBlind}
          onChange={onToggleBlind}
          label="הקלטה עיוורת"
          hint="סדר אקראי לגמרי, בלי תיאורי סצנה ובלי שמות דמויות — רק הוראה איך לשחק את הקול. ככה לא תדע מה הסיפור עד שתשחק אותו."
        />
        {settings.studioBlind && (
          <button
            onClick={onReshuffle}
            className="w-full py-3 text-sm flex items-center gap-2 text-right"
            style={{ color: T.lamp }}
          >
            <Shuffle size={16} /> לערבב את הסדר מחדש
          </button>
        )}
      </Section>

      {adultUnlocked && (
        <Section title="מדף 18+">
          <div className="py-2 text-xs leading-relaxed" style={{ color: T.dim }}>
            שלושת הסיפורים של 18+ פתוחים ומופיעים ברשימת הסיפורים. הם מיועדים למבוגרים בלבד.
          </div>
          <DangerButton
            label="לנעול בחזרה את המדף של 18+"
            armedLabel="בטוח? לחץ שוב לנעילה"
            onConfirm={onLockAdult}
          />
        </Section>
      )}

      <Section title="להתקין כאפליקציה">
        {installed ? (
          <div className="py-3 text-sm flex items-center gap-2" style={{ color: T.ok }}>
            <CheckCircle2 size={16} /> רץ כאפליקציה מותקנת
          </div>
        ) : canInstall ? (
          <button onClick={onInstall} className="w-full py-3 text-sm flex items-center gap-2 text-right" style={{ color: T.lamp }}>
            <Download size={16} /> להתקין בטלפון (אנדרואיד)
          </button>
        ) : ios ? (
          <div className="py-3 text-sm leading-relaxed" style={{ color: T.muted }}>
            <div className="flex items-center gap-2" style={{ color: T.ink }}><Share size={16} /> באייפון:</div>
            בספארי לוחצים על כפתור השיתוף, ואז ״הוסף למסך הבית״. האפליקציה תיפתח בלי סרגל דפדפן.
          </div>
        ) : (
          <div className="py-3 text-sm leading-relaxed" style={{ color: T.muted }}>
            <div className="flex items-center gap-2" style={{ color: T.ink }}><Smartphone size={16} /> באנדרואיד:</div>
            בכרום פותחים את התפריט (שלוש נקודות) ובוחרים ״הוספה למסך הבית״ או ״התקנת אפליקציה״. אם הכפתור לא מופיע, תן לדף לטעון עד הסוף ותנסה שוב.
          </div>
        )}
      </Section>

      <Section title="גיבוי">
        <button
          onClick={onExport}
          disabled={exporting || recordedCount === 0}
          className="w-full py-3 text-sm flex items-center gap-2 text-right"
          style={{ color: recordedCount === 0 ? T.dim : T.ink }}
        >
          <Download size={16} /> {exporting ? "מכין קובץ..." : "לייצא הקלטות ותסריט לקובץ"}
        </button>
        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          className="w-full py-3 text-sm flex items-center gap-2 text-right"
          style={{ color: T.ink }}
        >
          <Upload size={16} /> לייבא מקובץ גיבוי
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) onImport(f); }}
        />
        {importMsg && <div className="py-2 text-xs" style={{ color: importMsg.startsWith("!") ? T.rec : T.ok }}>{importMsg.replace(/^!/, "")}</div>}
        <div className="py-2 text-xs leading-relaxed" style={{ color: T.dim }}>
          הקובץ מכיל את כל ההקלטות, התסריט והסופים שגילית. ככה עוברים בין טלפון למחשב, או שומרים עותק לפני שמשנים תסריט.
          {!storageOk && " כרגע אין אחסון קבוע בדפדפן, אז גיבוי הוא הדרך היחידה לשמור."}
        </div>
      </Section>

      <Section title="איפוס">
        <DangerButton label="למחוק את כל ההקלטות" armedLabel="בטוח? לחץ שוב למחיקה" onConfirm={onClearRecordings} />
        <DangerButton label="לשכוח את הסופים שגילית" armedLabel="בטוח? לחץ שוב" onConfirm={onResetEndings} />
        <DangerButton label="להחזיר את התסריט המקורי" armedLabel="בטוח? לחץ שוב" onConfirm={onResetScript} />
      </Section>

      <div className="text-xs text-center" style={{ color: T.dim }}>ישיבת ועד בית · גרסה 1.0</div>
    </div>
  );
}
