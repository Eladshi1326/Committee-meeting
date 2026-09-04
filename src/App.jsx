import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { T } from "./theme.js";
import { CHARS } from "./data/script.js";
import { storiesFor, getStory, isAdult } from "./data/stories.js";
import { flattenLines, updateLineText, validateScript, shuffleLines, newSeed, personalizeScript, buildNameMap } from "./lib/script.js";
import { assignLines, playerProgress } from "./lib/party.js";
import { buildPlayerTasks, allTasks, storyProgress } from "./data/wordgame.js";
import { makeSilentWav, unlockAudio, blobToDataUrl, dataUrlToBlob, isStandalone, isIOS } from "./lib/audio.js";
import { DEFAULT_SETTINGS, hasIDB, kvGet, kvSet, kvDel, recSet, recDel, recClear, recAll } from "./lib/storage.js";
import HomeScreen from "./screens/HomeScreen.jsx";
import StudioScreen from "./screens/StudioScreen.jsx";
import PlayScreen from "./screens/PlayScreen.jsx";
import ScriptScreen from "./screens/ScriptScreen.jsx";
import MoreScreen from "./screens/MoreScreen.jsx";
import WordStudio from "./screens/WordStudio.jsx";
import WordPlay from "./screens/WordPlay.jsx";

const BACKUP_VERSION = 1;

function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center text-sm" style={{ color: T.dim }}>
      טוען הקלטות…
    </div>
  );
}

export default function App() {
  const [script, setScript] = useState(getStory("s1"));
  const [recordings, setRecordings] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [endings, setEndings] = useState([]);
  const [screen, setScreen] = useState("home"); // home | studio | play | script | more | wordstudio | wordplay
  const [activePlayer, setActivePlayer] = useState(0);
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
      let sid = "s1";
      try {
        const st = await kvGet("settings");
        if (st && typeof st === "object") {
          sid = st.storyId || "s1";
          if (alive) setSettings({ ...DEFAULT_SETTINGS, ...st });
        }
      } catch (e) { /* אין הגדרות */ }
      try {
        const s = await kvGet("script:" + sid);
        if (alive) setScript(s && !validateScript(s) ? s : getStory(sid));
      } catch (e) { if (alive) setScript(getStory(sid)); }
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
    if (storageOk) { try { await kvSet("script:" + (s.id || "s1"), s); } catch (e) { /* ignore */ } }
  }, [storageOk]);

  const resetScript = useCallback(async () => {
    const id = script.id || "s1";
    setScript(getStory(id));
    if (storageOk) { try { await kvDel("script:" + id); } catch (e) { /* ignore */ } }
  }, [storageOk, script]);

  // מעבר בין סיפורים. ההקלטות נשמרות לפי id של שורה, וה-id ייחודי בין הסיפורים,
  // אז מה שהוקלט בסיפור אחד לא נדרס על ידי אחר.
  const selectStory = useCallback(async (id) => {
    let s = getStory(id);
    if (storageOk) {
      try { const saved = await kvGet("script:" + id); if (saved && !validateScript(saved)) s = saved; }
      catch (e) { /* אין גרסה ערוכה */ }
    }
    setScript(s);
    setStudioIdx(0);
    setActivePlayer(0);
    setScreen("home");
    setSettings((prev) => {
      const next = { ...prev, storyId: id };
      if (storageOk) { kvSet("settings", next).catch(() => {}); }
      return next;
    });
  }, [storageOk]);

  // חלוקה מחדש בין שחקנים. זרע חדש = חלוקה חדשה, ההקלטות עצמן נשארות.
  const setAdultUnlocked = useCallback((on) => {
    setSettings((prev) => {
      const next = { ...prev, adultUnlocked: !!on };
      // נעילה חזרה בזמן שסיפור 18+ פעיל מחזירה לסיפור הראשון
      if (!on && isAdult(prev.storyId)) next.storyId = "s1";
      if (storageOk) { kvSet("settings", next).catch(() => {}); }
      return next;
    });
    if (!on && isAdult(script.id)) { setScript(getStory("s1")); setStudioIdx(0); }
  }, [storageOk, script]);

  const newWordStory = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, wordSeed: newSeed() };
      if (storageOk) { kvSet("settings", next).catch(() => {}); }
      return next;
    });
  }, [storageOk]);

  const setParty = useCallback((names, mode) => {
    setSettings((prev) => {
      const next = { ...prev, players: names, splitMode: mode, splitSeed: newSeed() };
      if (storageOk) { kvSet("settings", next).catch(() => {}); }
      return next;
    });
    setActivePlayer(0);
    setStudioIdx(0);
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

  // הקלטה עיוורת: מדליקים, ומגרילים זרע פעם אחת כדי שהסדר יישאר קבוע בין כניסות
  const toggleBlind = useCallback((on) => {
    setSettings((prev) => {
      const next = { ...prev, studioBlind: !!on };
      if (on && !prev.studioSeed) next.studioSeed = newSeed();
      if (storageOk) { kvSet("settings", next).catch(() => {}); }
      return next;
    });
    setStudioIdx(0);
  }, [storageOk]);

  const reshuffleStudio = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, studioSeed: newSeed() };
      if (storageOk) { kvSet("settings", next).catch(() => {}); }
      return next;
    });
    setStudioIdx(0);
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

  // התסריט הגולמי (עם {{key}}) נשמר ונערך. המסכים מקבלים עותק עם שמות אמיתיים.
  const nameMap = useMemo(
    () => buildNameMap(script, settings.players || [], settings.realNames !== false),
    [script, settings.players, settings.realNames]
  );
  const view = useMemo(() => personalizeScript(script, nameMap), [script, nameMap]);
  const lines = useMemo(() => flattenLines(view), [view]);
  const chars = view.characters || CHARS;
  // באולפן: במצב עיוור מקליטים בסדר אקראי קבוע, כדי לא להבין את הסיפור מראש
  const players = settings.players || [];
  const party = players.length > 1;
  const assign = useMemo(
    () => assignLines(lines, players.length, settings.splitMode, settings.splitSeed || 1, chars),
    [lines, players.length, settings.splitMode, settings.splitSeed, chars]
  );
  const studioLines = useMemo(() => {
    const mine = party ? lines.filter((l) => assign[l.id] === activePlayer) : lines;
    return settings.studioBlind ? shuffleLines(mine, (settings.studioSeed || 1) + activePlayer * 7919) : mine;
  }, [lines, assign, party, activePlayer, settings.studioBlind, settings.studioSeed]);
  const safeIdx = Math.min(studioIdx, Math.max(0, studioLines.length - 1));

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
    <div dir="rtl" className="w-full safe-top safe-bottom vg-screen" style={{ background: T.bg, color: T.ink }}>
      <div className="mx-auto w-full max-w-md h-full flex flex-col overflow-hidden">
        {!loaded ? (
          <Loading />
        ) : screen === "studio" ? (
          <StudioScreen
            lines={studioLines}
            index={safeIdx}
            setIndex={setStudioIdx}
            chars={chars}
            recordings={recordings}
            settings={settings}
            onSetSetting={setSetting}
            onToggleBlind={toggleBlind}
            onSave={saveRecording}
            onDelete={deleteRecording}
            onEditText={editLineText}
            onHome={() => setScreen("home")}
            audioRef={audioRef}
          />
        ) : screen === "play" ? (
          <PlayScreen
            script={view}
            players={players}
            chars={chars}
            recordings={recordings}
            settings={settings}
            endings={endings}
            audioRef={audioRef}
            onExit={exitPlay}
            onEnding={recordEnding}
          />
        ) : screen === "wordstudio" ? (
          <WordStudio
            tasks={buildPlayerTasks(activePlayer, Math.max(2, players.length))}
            playerName={players[activePlayer] || "שחקן " + (activePlayer + 1)}
            playerIndex={activePlayer}
            recordings={recordings}
            onSave={saveRecording}
            onDelete={deleteRecording}
            onHome={() => setScreen("home")}
            audioRef={audioRef}
          />
        ) : screen === "wordplay" ? (
          <WordPlay
            playerCount={Math.max(2, players.length)}
            players={players}
            recordings={recordings}
            seed={settings.wordSeed || 1}
            onNewStory={newWordStory}
            onExit={() => setScreen("home")}
            audioRef={audioRef}
          />
        ) : screen === "script" ? (
          <ScriptScreen script={script} onApply={applyScript} onReset={resetScript} onBack={() => setScreen("home")} />
        ) : screen === "more" ? (
          <MoreScreen
            settings={settings}
            onSetSetting={setSetting}
            onToggleBlind={toggleBlind}
            onReshuffle={reshuffleStudio}
            adultUnlocked={!!settings.adultUnlocked}
            onLockAdult={() => setAdultUnlocked(false)}
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
            script={view}
            nameMap={nameMap}
            chars={chars}
            lines={lines}
            recordings={recordings}
            endings={endings}
            storageOk={storageOk}
            storageWarn={storageWarn}
            canInstall={canInstall && !installed}
            blind={!!settings.studioBlind}
            stories={storiesFor(!!settings.adultUnlocked)}
            storyId={script.id || "s1"}
            onSelectStory={selectStory}
            adultUnlocked={!!settings.adultUnlocked}
            onUnlockAdult={() => setAdultUnlocked(true)}
            players={players}
            splitMode={settings.splitMode}
            playerStats={party ? playerProgress(lines, assign, recordings, players.length) : null}
            onSetParty={setParty}
            setupDone={!!settings.setupDone}
            onSetupDone={() => setSetting("setupDone", true)}
            onPlayer={(p) => { setActivePlayer(p); setStudioIdx(0); setScreen("studio"); }}
            wordProgress={party ? storyProgress(players.length, recordings) : null}
            wordTasksFor={(p) => buildPlayerTasks(p, Math.max(2, players.length)).filter((t) => recordings[t.id]).length}
            wordTaskCount={(p) => buildPlayerTasks(p, Math.max(2, players.length)).length}
            onWordStudio={(p) => { setActivePlayer(p); setScreen("wordstudio"); }}
            onWordPlay={() => { unlockAudio(audioRef.current, silentRef.current); setScreen("wordplay"); }}
            onStudio={(i) => {
              const src = lines[i];
              const j = src ? studioLines.findIndex((l) => l.id === src.id) : 0;
              setStudioIdx(j >= 0 ? j : 0);
              setScreen("studio");
            }}
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
