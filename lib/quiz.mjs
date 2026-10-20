// Scored button quizzes. Questions live in lib/quizbank.mjs: { id, topic, q, options: [3], answer: index, why, card? }.
import { QUIZ_BANK } from "./quizbank.mjs";

export const QUIZ_LEN = 3;
export const QUIZ_TOPICS = {
  any: "everything",
  devis: "the 9 Devis",
  ravan: "Ravan & Dussehra",
  nidhis: "the 9 Nidhis",
  siddhis: "the 8 Siddhis",
};

export function topicFromText(text) {
  const t = text.toLowerCase();
  if (/devi|navratri|durga|navadurga|chakra/.test(t)) return "devis";
  if (/ravan|ravana|dussehra|dasara|dashera|head|vice/.test(t)) return "ravan";
  if (/nidhi|kuber|treasure/.test(t)) return "nidhis";
  if (/siddhi|power|hanuman/.test(t)) return "siddhis";
  return "any";
}

// Pick questions the person hasn't seen recently, mixing topics when "any".
export function pickQuestions(topic, seen = [], n = QUIZ_LEN) {
  let pool = QUIZ_BANK.filter((q) => topic === "any" || q.topic === topic);
  let fresh = pool.filter((q) => !seen.includes(q.id));
  if (fresh.length < n) fresh = pool; // everything seen: start the cycle again
  const shuffled = [...fresh].sort(() => Math.random() - 0.5);
  if (topic !== "any") return shuffled.slice(0, n);
  const out = [];
  for (const q of shuffled) {
    if (out.length >= n) break;
    if (!out.some((x) => x.topic === q.topic) || shuffled.length - out.length <= n) out.push(q);
  }
  for (const q of shuffled) { if (out.length >= n) break; if (!out.includes(q)) out.push(q); }
  return out.slice(0, n);
}

// Shuffle a question's options so the answer isn't always in the same place.
export function presentQuestion(q) {
  const order = [0, 1, 2].sort(() => Math.random() - 0.5);
  return { options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
}

export function matchOption(text, options) {
  const t = text.trim().toLowerCase();
  let i = options.findIndex((o) => o.toLowerCase() === t);
  if (i >= 0) return i;
  const m = t.match(/^\s*([1-3abc])\s*[.)]?\s*$/); // a bare "1", "b", "c)" only
  if (m) return "1a".includes(m[1]) ? 0 : "2b".includes(m[1]) ? 1 : 2;
  i = options.findIndex((o) => t.length >= 3 && t.length <= o.length && o.toLowerCase().startsWith(t));
  return i;
}

export function quizVerdict(score, n = QUIZ_LEN) {
  if (score === n) return "🏆 Perfect score! You're a true Gyani.";
  if (score === n - 1) return "🔥 So close! Brilliant effort.";
  if (score >= 1) return "🌱 Good start! Every quiz plants a seed.";
  return "🙏 Tough round! Now you know three new things.";
}
