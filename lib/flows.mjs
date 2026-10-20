// Structured experiences: the Inner Ravan self-check and the 10-day "Defeat Ravan" journey.

export const HEADS = [
  { slug: "kaam", tease: "the head that hides in your phone screen 📱", name: "Kaam", en: "endless desire", virtue: "self-control",
    q: "Do cravings (food, phone, shopping, wanting more) pull you off track?" },
  { slug: "krodh", tease: "the head that burns the one who holds it first 🔥", name: "Krodh", en: "anger", virtue: "patience",
    q: "Do you lose your temper and regret it later?" },
  { slug: "lobh", tease: "why \"just one more\" is never enough 💰", name: "Lobh", en: "greed", virtue: "contentment",
    q: "Do you feel you need more, even when you already have enough?" },
  { slug: "moh", tease: "the love that can turn into a cage 🔗", name: "Moh", en: "attachment", virtue: "letting go",
    q: "Is it hard for you to let go of people, things or the past?" },
  { slug: "mada", tease: "what happened when Ravan tried to lift a mountain ⛰️", name: "Mada", en: "pride", virtue: "humility",
    q: "Do you like feeling above others, or need to be admired?" },
  { slug: "matsarya", tease: "the quiet sting most people never admit 🐍", name: "Matsarya", en: "jealousy", virtue: "gratitude",
    q: "Does someone else's success sting a little?" },
  { slug: "swarth", tease: "one queen, two boons and a 14-year exile 👑", name: "Swarth", en: "selfishness", virtue: "generosity",
    q: "Do you put your own benefit first, even when it costs others?" },
  { slug: "ahankara", tease: "how Ravan lost his wisest adviser 🗣️", name: "Ahankara", en: "ego, \"I know best\"", virtue: "surrender",
    q: "Do you feel \"I know best\" and find it hard to take advice?" },
  { slug: "sankirnata", tease: "the archer who was judged by his birth 🏹", name: "Sankirnata", en: "narrow-mindedness", virtue: "an open mind",
    q: "Do you judge people quickly by their background or a first impression?" },
  { slug: "hatha", tease: "why not even five villages could stop a war ⚔️", name: "Hatha", en: "stubbornness", virtue: "flexibility",
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
  quizAgain: "Quiz again 🎯",
  remind: "Remind me 🔔",
  killMenu: "Kill a head ⚔️",
  otherHeads: "Other heads 👹",
  startKill: "Start 7-day ⚔️",
  killDone: "Done ⚔️",
  killNext: "Next task ⚔️",
  mind: "Mind tricks 🧠",
  feel: "How I feel 💛",
  deepq: "Deep question 💭",
  anotherq: "Another question 💭",
  mood: "My mood 📈",
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
  // Heart: feelings, deep questions, mood
  if (/^(how i feel|check.?in|mood check|my feelings?|how am i\b|feelings? check)/.test(t)) return "checkin";
  if (/^(deep question|another question|another$|ask me (a|something|anything)|life question|ek sawaal|question for me)/.test(t)) return "deepq";
  if (/^(my mood|mood (tracker|history|log))/.test(t)) return "mood";
  if (/^(i feel|i'?m feeling|im feeling|feeling (very |so |a bit |little )?\w+$|aaj main|mujhe (bahut )?\w+ (lag|feel))/.test(t)) return "feeling";
  // Kill-a-head challenges (checked before the generic journey commands)
  if (/^(kill a head|other heads|next head|kill ravan|ravan challenge|head challenges?|challenges?|slay|defeat a head|10 heads challenge)\b/.test(t)) return "kill_menu";
  if (/^start 7.day/.test(t)) return "kill_start";
  if (/^(next task|continue challenge|aaj ka task)/.test(t)) return "kill_next";
  if (/^skip task$/.test(t)) return "kill_skip";
  if (/^done ⚔/.test(t)) return "kill_done";
  if (/^mind tricks?|^how to (ignore|control|outsmart) (the |my )?mind|^mind control/.test(t)) return "mind";
  if (/^⚔/.test(t) || /^kill \S+/.test(t)) return "kill_head";
  if (/^(stop|no more|band karo) (reminders?|nudges?)|^reminders? off/.test(t)) return "remind_off";
  if (/^remind me|^reminders? on|^yaad dila/.test(t)) return "remind_on";
  if (/^(quiz|quiz me|another quiz|quiz again|play( a)? quiz|new quiz|start quiz|ek quiz)\b/.test(t)) return "quiz";
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

// Monday-based week id, for the once-a-week streak shield.
export function weekId(date) {
  const d = new Date(date + "T00:00:00Z");
  const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000);
  return monday.toISOString().slice(0, 10);
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
  if (user.care && Date.now() - user.care < 3 * 86400000) lines.push("IMPORTANT: Recently shared serious distress. Be especially gentle and human; no quizzes or challenges unless they ask; keep Tele-MANAS 14416 in mind if things sound heavy.");
  if (user.moods?.length) lines.push(`Recent feelings (oldest to newest): ${user.moods.slice(-5).map((m) => m.m).join(", ")}.`);
  if (user.journal?.length) lines.push(`Things they shared in reflections (refer back kindly when it fits): ${user.journal.slice(-3).map((j) => `Q "${j.q}" → "${j.a.slice(0, 160)}"`).join(" | ")}`);
  if (user.slain?.length) lines.push(`Ravan heads slain in challenges: ${user.slain.join(", ")} (${user.slain.length}/10).`);
  if (user.activeHead) lines.push(`Currently on the 7-day challenge to kill ${user.activeHead} (day ${(user.heads?.[user.activeHead]?.done || 0) + 1} of 7).`);
  else lines.push(`Can start a 7-day challenge against any head with the option "${BTN.killMenu}".`);
  if (user.quizStats?.played) lines.push(`Has played ${user.quizStats.played} quiz(zes), best score ${user.quizStats.best}/3.`);
  if (!user.check?.result) lines.push(`Has not taken the Inner Ravan check yet; you can invite them with the option "${BTN.check}".`);
  return lines.join("\n");
}
