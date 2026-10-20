// Structured experiences: the Inner Ravan self-check and the 10-day "Defeat Ravan" journey.

export const HEADS = [
  { slug: "kaam", name: "Kaam", en: "endless desire", virtue: "self-control",
    q: "Do cravings (food, phone, shopping, wanting more) pull you off track?" },
  { slug: "krodh", name: "Krodh", en: "anger", virtue: "patience",
    q: "Do you lose your temper and regret it later?" },
  { slug: "lobh", name: "Lobh", en: "greed", virtue: "contentment",
    q: "Do you feel you need more, even when you already have enough?" },
  { slug: "moh", name: "Moh", en: "attachment", virtue: "letting go",
    q: "Is it hard for you to let go of people, things or the past?" },
  { slug: "mada", name: "Mada", en: "pride", virtue: "humility",
    q: "Do you like feeling above others, or need to be admired?" },
  { slug: "matsarya", name: "Matsarya", en: "jealousy", virtue: "gratitude",
    q: "Does someone else's success sting a little?" },
  { slug: "swarth", name: "Swarth", en: "selfishness", virtue: "generosity",
    q: "Do you put your own benefit first, even when it costs others?" },
  { slug: "ahankara", name: "Ahankara", en: "ego, \"I know best\"", virtue: "surrender",
    q: "Do you feel \"I know best\" and find it hard to take advice?" },
  { slug: "sankirnata", name: "Sankirnata", en: "narrow-mindedness", virtue: "an open mind",
    q: "Do you judge people quickly by their background or a first impression?" },
  { slug: "hatha", name: "Hatha", en: "stubbornness", virtue: "flexibility",
    q: "Do you dig in your heels even when you sense you may be wrong?" },
];

// Button titles (each within WhatsApp's 20-character limit).
export const BTN = {
  journey: "Start journey 🔥",
  next: "Next day ➡️",
  done: "Done ✅",
  progress: "My progress 📊",
  check: "Inner Ravan check 🪞",
  quiz: "Quiz me 🎯",
  story: "Tell me a story 📖",
  more: "Tell me more",
  often: "Often",
  sometimes: "Sometimes",
  rarely: "Rarely",
};

export function detectCommand(text) {
  const t = text.toLowerCase().trim();
  if (/^(reset|restart|start over)$/.test(t)) return "reset";
  if (/^(menu|options|topics)$/.test(t)) return "menu";
  if (/inner ravan check|self.?check|ravan (test|check)|which head (am|is|do)|retake/.test(t)) return "check";
  if (/^(restart|reset) journey$/.test(t)) return "journey_restart";
  if (/start (the )?(10.day )?journey|10.day journey|defeat ravan|start journey/.test(t)) return "journey_start";
  if (/^skip day$/.test(t)) return "journey_skip"; // testing helper: unlock the next day now
  if (/^next day|^continue( the)? journey|^aaj ka (din|lesson)|^today'?s (lesson|day)/.test(t)) return "journey_next";
  if (/^(done|did it|ho gaya|kar liya|completed?)\b/.test(t)) return "journey_done";
  if (/^(my )?(progress|streak)|^my progress/.test(t)) return "progress";
  return null;
}

export function scoreAnswer(text) {
  const t = text.toLowerCase().trim();
  if (/^(often|always|yes|haan|ha|bahut|mostly|frequently)\b/.test(t)) return 2;
  if (/^(sometimes|kabhi|kabhi kabhi|maybe|occasionally)\b/.test(t)) return 1;
  if (/^(rarely|never|no|nahi|nahin|hardly|not really)\b/.test(t)) return 0;
  return null;
}

// Today's date in India (YYYY-MM-DD), used for daily unlocks and streaks.
export function istDate(ms = Date.now()) {
  return new Date(ms + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export function progressBar(done, total = 10) {
  return "▓".repeat(done) + "░".repeat(Math.max(0, total - done));
}

export function topHeads(answers) {
  return answers
    .map((score, i) => ({ ...HEADS[i], score }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score || HEADS.indexOf(a) - HEADS.indexOf(b))
    .slice(0, 3);
}

// A short line for Claude about where this person is, so replies can be personal.
export function personContext(user) {
  const lines = [];
  if (user.check?.result?.length) {
    lines.push(`Inner Ravan check result (their top heads to work on): ${user.check.result.map((h) => `${h.name} (${h.en})`).join(", ")}.`);
  }
  const j = user.journey;
  if (j && !j.finished) {
    lines.push(`On the 10-day Defeat Ravan journey: day ${j.day} of 10 (${HEADS[j.day - 1]?.name}), ${j.done.length} day(s) completed, streak ${j.streak}.`);
  } else if (j?.finished) {
    lines.push("Has completed the 10-day Defeat Ravan journey.");
  } else {
    lines.push(`Has not started the 10-day journey yet; you can invite them with the option "${BTN.journey}".`);
  }
  if (!user.check?.result) lines.push(`Has not taken the Inner Ravan check yet; you can invite them with the option "${BTN.check}".`);
  return lines.join("\n");
}
