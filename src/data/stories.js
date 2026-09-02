import { DEFAULT_SCRIPT } from "./script.js";
import { STORY_2 } from "./stories/story2.js";
import { STORY_3 } from "./stories/story3.js";
import { ADULT_1 } from "./stories/adult1.js";
import { ADULT_2 } from "./stories/adult2.js";
import { ADULT_3 } from "./stories/adult3.js";

// fit = לכמה שחקנים הסיפור מכוון, משמש להמלצה במסך הבחירה
export const STORY_1 = { ...DEFAULT_SCRIPT, id: "s1", players: "1–3 שחקנים", fit: [1, 2] };

export const STORIES = [
  STORY_1,
  { ...STORY_2, fit: [3, 5] },
  { ...STORY_3, fit: [6, 12] },
];

// המדף הנעול. נפתח בשלוש הקשות על הכותרת במסך הפתיחה ואישור.
export const ADULT_STORIES = [
  { ...ADULT_1, fit: [1, 2] },
  { ...ADULT_2, fit: [3, 5] },
  { ...ADULT_3, fit: [6, 12] },
];

export const ALL_STORIES = [...STORIES, ...ADULT_STORIES];

export function storiesFor(adultUnlocked) {
  return adultUnlocked ? ALL_STORIES : STORIES;
}

export function getStory(id) {
  return ALL_STORIES.find((s) => s.id === id) || STORIES[0];
}

export function isAdult(id) {
  return ADULT_STORIES.some((s) => s.id === id);
}
