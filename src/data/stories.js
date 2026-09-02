import { DEFAULT_SCRIPT } from "./script.js";
import { STORY_2 } from "./stories/story2.js";
import { STORY_3 } from "./stories/story3.js";

export const STORY_1 = { ...DEFAULT_SCRIPT, id: "s1", players: "1–3 שחקנים" };

export const STORIES = [STORY_1, STORY_2, STORY_3];

export function getStory(id) {
  return STORIES.find((s) => s.id === id) || STORIES[0];
}
