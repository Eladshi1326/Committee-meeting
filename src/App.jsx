import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { T } from "./theme.js";
import { CHARS, DEFAULT_SCRIPT } from "./data/script.js";
import { flattenLines, updateLineText, validateScript } from "./lib/script.js";
import { makeSilentWav, unlockAudio, blobToDataUrl, dataUrlToBlob, isStandalone, isIOS } from "./lib/audio.js";
import { DEFAULT_SETTINGS, hasIDB, kvGet, kvSet, kvDel, recSet, recDel, recClear, recAll } from "./lib/storage.js";
import HomeScreen from "./screens/HomeScreen.jsx";
import StudioScreen from "./screens/StudioScreen.jsx";
import PlayScreen from "./screens/PlayScreen.jsx";
import ScriptScreen from "./screens/ScriptScreen.jsx";
import MoreScreen from "./screens/MoreScreen.jsx";

const BACKUP_VERSION = 1;

function Loading() {
  return (
    <div className="flex-1 min-h-screen flex items-center justify-center text-sm" style={{ color: T.dim }}>
      טוען הקלטות…
    </div>
  );
}

export default function App() {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [recordings, setRecordings] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [endings, setEndings] = useState([]);
  const [screen, setScreen] = useState("home"); // home | studio | play | script | more
  const [studioIdx, setStudioIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [storageWarn, setStorageWarn] = useState("");
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const recRef = useRef({});
  const audioRef = useRef(null);
  const silentRef = useRef(null);
  const installEvtRef = useRef(null);

  // נגן אודיו אחד לכל האפליקציה
  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    audioRef.current = a;
    try { silentRef.current = makeSilentWav(); } catch (e) { silentRef.current = null; }
    return () => { try { a.pause(); } catch (e) { /* ignore */ } };
  }, []);

  // הצעת התקנה (אנדרואיד / כרום)
  useEffect(() => {
    setInstalled(isStandalone());
    const onPrompt = (e) => { e.preventDefault(); installEvtRef.current = e; setCanInstall(true); };
    const onInstalled = () => { installEvtRef.current = null; setCanInstall(false); setInstalled(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // טעינה מהאחסון
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hasIDB()) { if (alive) { setStorageOk(false); setLoaded(true); } return; }
      try {
        const s = await kvGet("script");
        if (s && !validateScript(s) && alive) setScript(s);
      } catch (e) { /* אין תסריט שמור */ }
      try {
        const st = await kvGet("settings");
        if (st && typeof st === "object" && alive) setSettings({ ...DEFAULT_SETTINGS, ...st });
      } catch (e) { /* אין הגדרות */ }
      try {
        const en = await kvGet("endings");
        if (Array.isArray(en) && alive) setEndings(en);
      } catch (e) { /* אין סופים */ }
      try {
        const all = await recAll();
        const restored = {};
        Object.keys(all).forEach((id) => {
          const e = all[id];
          if (e && e.blob) restored[id] = { url: URL.createObjectURL(e.blob), blob: e.blob, secs: e.secs || 0 };
        });
        if (alive) { recRef.current = restored; setRecordings(restored); }
      } catch (e) {
        if (alive) setStorageOk(false);
      }
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  const saveRecording = useCallback(async (id, blob, secs) => {
    const prev = recRef.current[id];
    if (prev && prev.url) { try { URL.revokeObjectURL(prev.url); } catch (e) { /* ignore */ } }
    const entry = { url: URL.createObjectURL(blob), blob, secs: secs || 0 };
    const next = { ...recRef.current, [id]: entry };
    recRef.current = next;
    setRecordings(next);
    if (storageOk) {
      try { await recSet(id, { blob, secs: secs || 0, mime: blob.type || "" }); setStorageWarn(""); }
      catch (e) { setStorageWarn("לא הצלחתי לשמור לאחסון של הטלפון. ההקלטה תישאר רק כל עוד החלון פתוח."); }
    }
  }, [storageOk]);

  const deleteRecording = useCallback(async (id) => {
    const next = { ...recRef.current };
    if (next[id]) {
      try { URL.revokeObjectURL(next[id].url); } catch (e) { /* ignore */ }
      delete next[id];
    }
    recRef.current = next;
    setRecordings(next);
    if (storageOk) { try { await recDel(id); } catch (e) { /* ignore */ } }
  }, [storageOk]);

  const clearRecordings = useCallback(async () => {
    Object.keys(recRef.current).forEach((id) => {
      try { URL.revokeObjectURL(recRef.current[id].url); } catch (e) { /* ignore */ }
    });
    recRef.current = {};
    setRecordings({});
    setStorageWarn("");
    if (storageOk) { try { await recClear(); } catch (e) { /* ignore */ } }
  }, [storageOk]);

  const applyScript = useCallback(async (s) => {
    setScript(s);
    if (storageOk) { try { await kvSet("script", s); } catch (e) { /* ignore */ } }
  }, [storageOk]);

  const resetScript = useCallback(async () => {
    setScript(DEFAULT_SCRIPT);
    if (storageOk) { try { await kvDel("script"); } catch (e) { /* ignore */ } }
  }, [storageOk]);

  const editLineText = useCallback((id, text) => {
    applyScript(updateLineText(script, id, text));
  }, [script, applyScript]);

  const setSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (storageOk) { kvSet("settings", next).catch(() => {}); }
      return next;
    });
  }, [storageOk]);

  const recordEnding = useCallback((nodeId) => {
    setEndings((prev) => {
      if (prev.includes(nodeId)) return prev;
      const next = [...prev, nodeId];
      if (storageOk) { kvSet("endings", next).catch(() => {}); }
      return next;
    });
  }, [storageOk]);

  const resetEndings = useCallback(async () => {
    setEndings([]);
    if (storageOk) { try { await kvDel("endings"); } catch (e) { /* ignore */ } }
  }, [storageOk]);

  // גיבוי: כל ההקלטות כ-base64 בקובץ JSON אחד
  const exportBackup = useCallback(async () => {
    setExporting(true);
    try {
      const recs = {};
      const ids = Object.keys(recRef.current);
      for (const id of ids) {
        const e = recRef.current[id];
        if (!e || !(e.blob instanceof Blob)) continue;
        recs[id] = { dataUrl: await blobToDataUrl(e.blob), secs: e.secs || 0 };
      }
      const payload = { app: "vaad-bait", version: BACKUP_VERSION, exportedAt: new Date().toISOString(), script, endings, settings, recordings: recs };
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = "vaad-bait-backup-" + stamp + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setImportMsg("הקובץ נוצר. שמור אותו במקום שתמצא.");
    } catch (e) {
      setImportMsg("!הייצוא נכשל: " + ((e && e.message) || ""));
    } finally {
      setExporting(false);
    }
  }, [script, endings, settings]);

  const importBackup = useCallback(async (file) => {
    setImportMsg("");
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || data.app !== "vaad-bait" || !data.recordings) throw new Error("זה לא קובץ גיבוי של המשחק");
      let count = 0;
      for (const id of Object.keys(data.recordings)) {
        const e = data.recordings[id];
        if (!e || !e.dataUrl) continue;
        const blob = dataUrlToBlob(e.dataUrl);
        await saveRecording(id, blob, e.secs || 0);
        count++;
      }
      if (data.script && !validateScript(data.script)) await applyScript(data.script);
      if (Array.isArray(data.endings)) {
        setEndings((prev) => {
          const merged = Array.from(new Set([...prev, ...data.endings]));
          if (storageOk) { kvSet("endings", merged).catch(() => {}); }
          return merged;
        });
      }
      if (data.settings && typeof data.settings === "object") {
        setSettings((prev) => {
          const next = { ...prev, ...data.settings };
          if (storageOk) { kvSet("settings", next).catch(() => {}); }
          return next;
        });
      }
      setImportMsg("יובאו " + count + " הקלטות" + (data.script ? " והתסריט" : "") + ".");
    } catch (e) {
      setImportMsg("!הייבוא נכשל: " + ((e && e.message) || ""));
    }
  }, [saveRecording, applyScript, storageOk]);

  const install = useCallback(async () => {
    const evt = installEvtRef.current;
    if (!evt) return;
    try {
      evt.prompt();
      const choice = await evt.userChoice;
      if (choice && choice.outcome === "accepted") { setCanInstall(false); }
    } catch (e) { /* המשתמש ביטל */ }
    installEvtRef.current = null;
    setCanInstall(false);
  }, []);

  const lines = useMemo(() => flattenLines(script), [script]);
  const chars = script.characters || CHARS;
  const safeIdx = Math.min(studioIdx, Math.max(0, lines.length - 1));

  function startGame() {
    // בתוך לחיצה של המשתמש: "פותחים" את נגן האודיו כדי שהשורות ינוגנו אוטומטית גם ב-iOS
    unlockAudio(audioRef.current, silentRef.current);
    setScreen("play");
  }

  function exitPlay() {
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch (e) { /* ignore */ } }
    setScreen("home");
  }

  return (
    <div dir="rtl" className="w-full safe-top safe-bottom" style={{ background: T.bg, color: T.ink, minHeight: "100vh" }}>
      <div className="mx-auto w-full max-w-md min-h-screen flex flex-col">
        {!loaded ? (
          <Loading />
        ) : screen === "studio" ? (
          <StudioScreen
            lines={lines}
            index={safeIdx}
            setIndex={setStudioIdx}
            chars={chars}
            recordings={recordings}
            settings={settings}
            onSetSetting={setSetting}
            onSave={saveRecording}
            onDelete={deleteRecording}
            onEditText={editLineText}
            onHome={() => setScreen("home")}
            audioRef={audioRef}
          />
        ) : screen === "play" ? (
          <PlayScreen
            script={script}
            chars={chars}
            recordings={recordings}
            settings={settings}
            endings={endings}
            audioRef={audioRef}
            onExit={exitPlay}
            onEnding={recordEnding}
          />
        ) : screen === "script" ? (
          <ScriptScreen script={script} onApply={applyScript} onReset={resetScript} onBack={() => setScreen("home")} />
        ) : screen === "more" ? (
          <MoreScreen
            settings={settings}
            onSetSetting={setSetting}
            canInstall={canInstall}
            installed={installed}
            ios={isIOS()}
            onInstall={install}
            onExport={exportBackup}
            onImport={importBackup}
            exporting={exporting}
            importMsg={importMsg}
            onClearRecordings={clearRecordings}
            onResetEndings={resetEndings}
            onResetScript={resetScript}
            storageOk={storageOk}
            recordedCount={Object.keys(recordings).length}
            onBack={() => { setImportMsg(""); setScreen("home"); }}
          />
        ) : (
          <HomeScreen
            script={script}
            chars={chars}
            lines={lines}
            recordings={recordings}
            endings={endings}
            storageOk={storageOk}
            storageWarn={storageWarn}
            canInstall={canInstall && !installed}
            onStudio={(i) => { setStudioIdx(i); setScreen("studio"); }}
            onPlay={startGame}
            onScript={() => setScreen("script")}
            onMore={() => setScreen("more")}
            onInstall={install}
          />
        )}
      </div>
    </div>
  );
}
