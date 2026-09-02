# -*- coding: utf-8 -*-
import io, os
SRC = "/sessions/rcw-01cpkem2bltguto7kdtcfze9/mnt/משחק לטלפון שיחות/vaad-bait/src"
def rw(rel, pairs):
    p = os.path.join(SRC, rel)
    s = io.open(p, encoding="utf-8").read()
    for old, new, n in pairs:
        assert s.count(old) == n, "MATCH FAIL %s (want %d got %d): %r" % (rel, n, s.count(old), old[:60])
        s = s.replace(old, new)
    io.open(p, "w", encoding="utf-8", newline="\n").write(s)
    print("ok:", rel)

# ---- מעטפת האפליקציה: בדיוק גובה המסך, בלי גלילה ברמת הדף ----
rw("App.jsx", [
 ('<div dir="rtl" className="w-full safe-top safe-bottom" style={{ background: T.bg, color: T.ink, minHeight: "100vh" }}>\n      <div className="mx-auto w-full max-w-md min-h-screen flex flex-col">',
  '<div dir="rtl" className="w-full safe-top safe-bottom vg-screen" style={{ background: T.bg, color: T.ink }}>\n      <div className="mx-auto w-full max-w-md h-full flex flex-col overflow-hidden">', 1),
 ('<div className="flex-1 min-h-screen flex items-center justify-center text-sm"',
  '<div className="flex-1 flex items-center justify-center text-sm"', 1),
])

# ---- כל מסך: גובה מלא, וגלילה רק בחלק שבאמת צריך ----
rw("screens/MoreScreen.jsx", [
 ('<div className="flex flex-col flex-1 min-h-screen px-4 pt-3 pb-8 gap-4">',
  '<div className="flex flex-col flex-1 vg-scroll px-4 pt-3 pb-8 gap-4">', 1),
])
rw("screens/ScriptScreen.jsx", [
 ('<div className="flex flex-col flex-1 min-h-screen px-4 pt-3 pb-6 gap-3">',
  '<div className="flex flex-col flex-1 min-h-0 px-4 pt-3 pb-6 gap-3">', 1),
])
rw("screens/StudioScreen.jsx", [
 ('<div className="flex flex-col flex-1 min-h-screen items-center justify-center gap-4 px-6 text-center">',
  '<div className="flex flex-col flex-1 items-center justify-center gap-4 px-6 text-center">', 1),
 ('<div className="flex flex-col flex-1 min-h-screen">',
  '<div className="flex flex-col flex-1 min-h-0 overflow-hidden">', 1),
 # אזור השורה גדל וגולל בפנים, פקדי ההקלטה נשארים מקובעים בתחתית
 ('      <div className="px-4 mt-2">',
  '      <div className="px-4 mt-2 flex-1 vg-scroll">', 1),
 ('      <div className="mt-auto px-4 pb-6 pt-6 flex flex-col items-center gap-4">',
  '      <div className="shrink-0 px-4 pb-4 pt-3 flex flex-col items-center gap-3">', 1),
])
rw("screens/PlayScreen.jsx", [
 ('<div className="flex flex-col flex-1 min-h-screen items-center justify-center gap-4 px-6 text-center">',
  '<div className="flex flex-col flex-1 items-center justify-center gap-4 px-6 text-center">', 1),
 # מד השפיות נשאר מקובע למעלה, הטקסט גולל בפנים
 ('<div className="flex flex-col flex-1 min-h-screen">\n      <div className="flex items-center gap-3 px-3 pt-3 pb-1">',
  '<div className="flex flex-col flex-1 min-h-0 overflow-hidden">\n      <div className="shrink-0 flex items-center gap-3 px-3 pt-3 pb-1">', 1),
 ('<div className="px-4 mt-3"><SceneLabel text={node.scene} /></div>',
  '<div className="shrink-0 px-4 mt-3"><SceneLabel text={node.scene} /></div>', 1),
 ('            className="flex-1 flex flex-col justify-center px-4 py-6 select-none"',
  '            className="flex-1 vg-scroll flex flex-col justify-center px-4 py-6 select-none"', 1),
 ('          <div className="px-4 pb-6">\n            {phase === "choices" && (',
  '          <div className="shrink-0 px-4 pb-5 max-h-[52%] vg-scroll">\n            {phase === "choices" && (', 1),
 # כרטיס הסוף גולל בפנים
 ('<div className="flex-1 flex flex-col justify-center px-4 py-6 vg-rise">',
  '<div className="flex-1 vg-scroll flex flex-col justify-center px-4 py-6 vg-rise">', 1),
])
