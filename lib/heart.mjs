// The heart side of the guide: feeling check-ins, deep life questions, mood tracking, and care in distress.

// Each feeling: list-menu title (24 chars max), emoji for the mood log, card, and a hint for the guide.
export const FEELINGS = [
  { key: "peaceful", title: "😌 Peaceful", emoji: "😌", positive: true, card: "mahagauri",
    hint: "Celebrate it. Mahagauri's stillness after the storm. Help them notice what created this peace so they can return to it. Practice: 1 minute of savouring (eyes closed, smile, three slow breaths, 'thank you')." },
  { key: "happy", title: "😊 Happy", emoji: "😊", positive: true, card: "mukunda",
    hint: "Share their joy. Mukunda Nidhi, the treasure of joy and celebration. Practice: tell one person the good news or pass the joy on with a kind message. Ask what made them happy today." },
  { key: "grateful", title: "🙏 Grateful", emoji: "🙏", positive: true, card: "kunda",
    hint: "Kunda/Nanda Nidhi, contentment: 'santosham paramam sukham'. Practice: name three people or things behind this gratitude, and thank one of them today." },
  { key: "anxious", title: "😟 Anxious / worried", emoji: "😟", positive: false, card: "kachchhapa",
    hint: "Kachchhapa (tortoise) stillness: drawing the senses inward. Worry lives in the future; the breath lives now. Practice: 4-7-8 breathing x3 (in 4, hold 7, out 8) or name 5 things you can see, 4 you can hear, 3 you can touch. Gita 2.47: do your part, release the outcome." },
  { key: "angry", title: "😠 Angry / irritated", emoji: "😠", positive: false, card: "krodh",
    hint: "Krodh: valid feeling, risky master. Anger usually guards a hurt or fear. Practice: breathe out longer than in for 60 seconds, delay any reply 20 minutes, then ask 'what am I afraid of?'. Offer the option 'Kill Krodh ⚔️'." },
  { key: "sad", title: "😔 Sad / low", emoji: "😔", positive: false, card: "kalaratri",
    hint: "Be very gentle; listen first. Kalaratri: even the darkest night ends, and facing it is what brings dawn. Sadness is not weakness. Practice: hand on heart, three slow breaths, say 'this is a hard moment, and I'm here with it'; or step into sunlight for 5 minutes. Ask softly if they want to share what's weighing on them." },
  { key: "stressed", title: "😩 Stressed / overloaded", emoji: "😩", positive: false, card: "shailaputri",
    hint: "Shailaputri's grounding: a mountain doesn't run. Practice: feet flat on the floor, notice the ground for 1 minute; then write down the ONE next small step and only that. Remind: one task at a time." },
  { key: "lonely", title: "🥺 Lonely", emoji: "🥺", positive: false, card: "kushmanda",
    hint: "Kushmanda's warm heart: connection begins with one small reach. Practice: message one person 'thinking of you' today, or call an old friend. You are not alone in feeling alone. Ask who they miss or wish they could talk to." },
  { key: "confused", title: "🤔 Confused / stuck", emoji: "🤔", positive: false, card: "katyayani",
    hint: "Katyayani's clarity (Ajna, inner vision). Practice: write the decision at the top of a page, then 'what would I advise my best friend?' and 'what will matter in 5 years?'. Offer to think it through together." },
  { key: "tired", title: "😴 Tired / drained", emoji: "😴", positive: false, card: "laghima",
    hint: "Laghima, lightness: put down what you don't need to carry. Rest is sacred, not lazy. Practice: 5 minutes eyes closed, shoulders dropped; drink water; say no to one non-essential thing today." },
];

export function findFeeling(text) {
  const t = text.toLowerCase();
  return FEELINGS.find((f) => t.includes(f.key) || t === f.title.toLowerCase()) ||
    (/\b(worr|tense|nervous|ghabra|chinta|dar)/.test(t) && FEELINGS.find((f) => f.key === "anxious")) ||
    (/\b(upset|down|dukhi|udaas|udas|depress)/.test(t) && FEELINGS.find((f) => f.key === "sad")) ||
    (/\b(gussa|irritat|mad at)/.test(t) && FEELINGS.find((f) => f.key === "angry")) ||
    (/\b(akela|alone)/.test(t) && FEELINGS.find((f) => f.key === "lonely")) ||
    (/\b(thak|exhaust|burn(ed|t) out)/.test(t) && FEELINGS.find((f) => f.key === "tired")) ||
    (/\b(khush|joy|great|good)\b/.test(t) && FEELINGS.find((f) => f.key === "happy")) || null;
}

// Deep, warm questions about life. The guide listens to the answer, reflects it back and offers wisdom.
export const DEEP_QUESTIONS = [
  { id: "q01", theme: "joy", q: "When did you last feel truly happy, not just busy or entertained? What were you doing?" },
  { id: "q02", theme: "joy", q: "What small thing always lifts your mood, even on a bad day?" },
  { id: "q03", theme: "gratitude", q: "Who is one person who made your life better, who may not even know it?" },
  { id: "q04", theme: "gratitude", q: "What is something ordinary in your life that you'd miss terribly if it were gone?" },
  { id: "q05", theme: "peace", q: "What is one thing you're carrying in your heart right now that you wish you could put down?" },
  { id: "q06", theme: "peace", q: "Where or when do you feel most at peace?" },
  { id: "q07", theme: "self", q: "If your best friend talked to themselves the way you talk to yourself, what would you tell them?" },
  { id: "q08", theme: "self", q: "What is one quality in you that you're quietly proud of?" },
  { id: "q09", theme: "self", q: "What did 10-year-old you dream of becoming? Is any part of that dream still alive?" },
  { id: "q10", theme: "fear", q: "What is one fear that has been quietly making your decisions for you?" },
  { id: "q11", theme: "fear", q: "What would you do this year if you knew you couldn't fail?" },
  { id: "q12", theme: "relationships", q: "Is there someone you need to forgive, or someone you need to ask for forgiveness?" },
  { id: "q13", theme: "relationships", q: "Who do you feel most yourself with? What is it about them?" },
  { id: "q14", theme: "relationships", q: "What is one conversation you've been avoiding?" },
  { id: "q15", theme: "purpose", q: "What makes you lose track of time in a good way?" },
  { id: "q16", theme: "purpose", q: "What would you like people to say about you when you're not in the room?" },
  { id: "q17", theme: "purpose", q: "If you had one extra hour every day, how would you use it?" },
  { id: "q18", theme: "change", q: "What is one habit you know is stealing your peace?" },
  { id: "q19", theme: "change", q: "What is one small change that would make next week better than this one?" },
  { id: "q20", theme: "letting go", q: "What is something from the past you still replay in your mind? What would it take to let it rest?" },
  { id: "q21", theme: "letting go", q: "What are you trying to control right now that isn't really in your hands?" },
  { id: "q22", theme: "emotions", q: "Which emotion do you find hardest to express: anger, sadness, fear or love? Why do you think that is?" },
  { id: "q23", theme: "emotions", q: "When you feel low, what do you usually do? Does it actually help?" },
  { id: "q24", theme: "kindness", q: "What is the kindest thing a stranger ever did for you?" },
  { id: "q25", theme: "kindness", q: "Who in your life could use a little kindness from you this week?" },
  { id: "q26", theme: "faith", q: "What gives you strength when things fall apart?" },
  { id: "q27", theme: "faith", q: "Is there a prayer, song or line of wisdom that has stayed with you through life?" },
  { id: "q28", theme: "today", q: "What is one moment from today you want to remember?" },
  { id: "q29", theme: "today", q: "What drained your energy today, and what gave you energy?" },
  { id: "q30", theme: "inner ravan", q: "Which of Ravan's ten heads has been loudest in your life this month, and when does it show up?" },
  { id: "q31", theme: "inner ravan", q: "Think of your last argument. Which head was really speaking: anger, ego, stubbornness or hurt?" },
  { id: "q32", theme: "abundance", q: "What does a \"rich\" life mean to you, beyond money?" },
  { id: "q33", theme: "abundance", q: "Which inner treasure do you most want more of right now: resilience, generosity, courage, stillness, joy or contentment?" },
  { id: "q34", theme: "time", q: "If you looked back on this year from 10 years ahead, what would you wish you had done more of?" },
  { id: "q35", theme: "body", q: "How have you been treating your body lately: as a temple, a machine, or something you forget?" },
  { id: "q36", theme: "dreams", q: "What is one dream you've put on hold? What is the smallest step back toward it?" },
  { id: "q37", theme: "self-love", q: "What are three things you genuinely like about yourself?" },
  { id: "q38", theme: "self-love", q: "When did you last do something just for yourself, with no guilt?" },
  { id: "q39", theme: "self-love", q: "What would change if you treated yourself with the same kindness you give to the people you love?" },
  { id: "q40", theme: "self-love", q: "What is one thing you've been too hard on yourself about lately?" },
  { id: "q41", theme: "stress", q: "What is stressing you most these days, and what part of it is actually in your hands?" },
  { id: "q42", theme: "stress", q: "When you feel overwhelmed, where do you feel it in your body?" },
  { id: "q43", theme: "bliss", q: "When did you last feel completely at peace, as if nothing was missing?" },
  { id: "q44", theme: "bliss", q: "If your happiness didn't depend on anything outside you, what would you feel right now?" },
  { id: "q45", theme: "meditation", q: "If you could sit in silence for 5 minutes every day, what do you think would change?" },
];

export function pickDeepQuestion(seen = []) {
  const fresh = DEEP_QUESTIONS.filter((q) => !seen.includes(q.id));
  const pool = fresh.length ? fresh : DEEP_QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Signs someone may be in danger. On a match, the bot always shares real help first.
const CRISIS = /\b(suicid\w*|kill myself|killing myself|end (it all|my life)|want to die|wanna die|don'?t want to live|no reason to live|better off dead|self[- ]?harm\w*|hurt myself|cut myself|khud ?kushi|aatmahatya|atmahatya|marna chahta|marna chahti|mar jaana chahta|mar jana chahti|jeena nahi chahta|jeena nahi chahti|zindagi khatam)\b/i;
export function isCrisis(text) { return CRISIS.test(text); }

export const CRISIS_MESSAGE = `💛 I'm really glad you told me. What you're feeling matters, and you don't have to carry it alone.

Please talk to someone right now:
📞 *Tele-MANAS: 14416* or *1-800-891-4416* (free, 24×7, in many Indian languages)
🚨 If you're in immediate danger, call *112*

If you can, also reach out to someone you trust and let them be with you.

I'm here too. Would you like to tell me a little about what's happening?`;

export function moodLine(moods = [], days = 7) {
  const recent = moods.slice(-days);
  return recent.map((m) => (FEELINGS.find((f) => f.key === m.m)?.emoji || "•")).join(" ");
}
