// Hindi / English layer. The bot's logic runs in English; text going out is shown in Hindi
// for people who prefer it, and Hindi taps coming in are mapped back to the English commands.
//
// 1. Exact phrases (buttons, menus, fixed screens, meditations, questions) come from lib/hi.mjs, instantly.
// 2. Anything still mostly English (challenge tasks, quiz questions…) is translated once by Claude
//    and cached in Netlify Blobs, so each sentence is only ever translated one time.

import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
import { BTN, HEADS } from "./flows.mjs";
import { MEDITATIONS } from "./meditate.mjs";
import { DEEP_QUESTIONS, CRISIS_MESSAGE } from "./heart.mjs";
import { MIND_TOOLKIT, HEAD_CHALLENGES } from "./challenges.mjs";
import { HI_BTN, HI_LABELS, HI_TEMPLES, HI_FIXED, HI_MEDITATIONS, HI_CHECK_QS, HI_DEEP_QS, HI_CRISIS, HI_MIND_TOOLKIT, WELCOME_EN, WELCOME_HI } from "./hi.mjs";

let LANG = "en";
export function setLang(l) { LANG = l === "hi" ? "hi" : "en"; }
export function isHindi() { return LANG === "hi"; }

// English → Hindi exact map.
const TO_HI = new Map();
const add = (en, hi) => { if (en && hi) TO_HI.set(en, hi); };
for (const [k, en] of Object.entries(BTN)) add(en, HI_BTN[k]);
for (const [en, hi] of Object.entries(HI_LABELS)) add(en, hi);
for (const [en, hi] of Object.entries(HI_FIXED)) add(en, hi);
for (const [en, hi] of Object.entries(HI_TEMPLES)) { add(en, hi); add(`🛕 ${en}`, `🛕 ${hi}`); }
for (const m of MEDITATIONS) add(m.text, HI_MEDITATIONS[m.key]);
HEADS.forEach((h, i) => add(h.q, HI_CHECK_QS[i]));
for (const q of DEEP_QUESTIONS) add(q.q, HI_DEEP_QS[q.id]);
add(CRISIS_MESSAGE, HI_CRISIS);
add(WELCOME_EN, WELCOME_HI);
add(MIND_TOOLKIT, HI_MIND_TOOLKIT);
for (const h of HEAD_CHALLENGES) { add(`⚔️ ${h.name}`, `⚔️ ${h.hi}`); add(`Kill ${h.name} ⚔️`, `${h.hi} को मारें ⚔️`); }
add("Train again ⚔️", "फिर अभ्यास ⚔️");

// Hindi → English, for taps and typed commands.
const TO_EN = new Map([...TO_HI].filter(([en]) => en.length <= 72).map(([en, hi]) => [hi, en]));

// Phrases replaced inside longer messages (longest first so nothing is cut in half).
const PHRASES = [...TO_HI].filter(([en]) => en.length >= 8).sort((a, b) => b[0].length - a[0].length);
const PATTERNS = [
  [/\bDay (\d+)\/(\d+)/g, "दिन $1/$2"], [/\bDay (\d+)/g, "दिन $1"], [/\bStreak\b/g, "स्ट्रीक"], [/\bBest\b/g, "सर्वश्रेष्ठ"],
  [/\b(\d+)\/10 heads slain\b/g, "$1/10 सिर मारे गए"], [/\b(\d+)\/10 slain\b/g, "$1/10 मारे गए"], [/\bdays?\b/g, "दिन"],
];

function phraseSwap(s) {
  let out = s;
  for (const [en, hi] of PHRASES) if (out.includes(en)) out = out.split(en).join(hi);
  for (const [re, hi] of PATTERNS) out = out.replace(re, hi);
  return out;
}

const latin = (s) => (s.replace(/https?:\/\/\S+/g, "").match(/[A-Za-z]/g) || []).length;
const deva = (s) => (s.match(/[ऀ-ॿ]/g) || []).length;

// Short labels (buttons, rows): exact match only, so titles keep their length limits.
export function trLabel(s) {
  if (LANG !== "hi" || !s) return s;
  return TO_HI.get(s) || s;
}

// Message bodies: exact → phrase swap → cached Claude translation when still mostly English.
export async function trBody(s) {
  if (LANG !== "hi" || !s) return s;
  const exact = TO_HI.get(s);
  if (exact) return exact;
  const swapped = phraseSwap(s);
  if (latin(swapped) < 30 || deva(swapped) > latin(swapped) * 1.5) return swapped;
  return (await translate(s)) || swapped;
}

// Incoming Hindi taps → the English command the bot understands.
export function toEnglish(text) {
  return TO_EN.get(text) || text;
}

export function wantsLanguage(text) {
  const t = text.trim().toLowerCase();
  if (/^(hindi|हिंदी|हिन्दी|hindi me|hindi mein|हिंदी में|हिन्दी में)$/.test(t)) return "hi";
  if (/^(english|अंग्रेज़ी|अंग्रेजी|इंग्लिश|english please)$/.test(t)) return "en";
  return null;
}

export const hasDevanagari = (s) => /[ऀ-ॿ]/.test(s);

async function translate(en) {
  const key = "tr/hi/" + crypto.createHash("sha1").update(en).digest("hex");
  let store;
  try { store = getStore("inner-victory-whatsapp"); const hit = await store.get(key); if (hit) return hit; } catch {}
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
        max_tokens: 2000,
        thinking: { type: "disabled" },
        system: "You translate WhatsApp messages from a warm spiritual-guide app into simple, natural, warm Hindi (Devanagari), the way a caring friend in India speaks. " +
          "Keep every emoji, line break, number, *bold* and _italic_ marker exactly where it is. Keep names of Devis, heads of Ravan, Nidhis, Siddhis, temples and Sanskrit terms (write them in Devanagari). " +
          "Output only the translation, nothing else.",
        messages: [{ role: "user", content: en }],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) { console.error("Translate failed", res.status); return null; }
    const data = await res.json();
    const hi = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!hi) return null;
    try { await store?.set(key, hi); } catch {}
    return hi;
  } catch (e) {
    console.error("Translate error", e?.name || e);
    return null;
  }
}
