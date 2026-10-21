// Inner Victory Guide — WhatsApp bot (Meta WhatsApp Cloud API + Claude API) on Netlify Functions.
//
// GET  /whatsapp  → Meta webhook verification (hub.challenge handshake)
// POST /whatsapp  → incoming WhatsApp messages; replies with a Claude answer,
//                   an illustrated card and tappable buttons or a menu.
//
// Environment variables (set in Netlify → Project configuration → Environment variables):
//   ANTHROPIC_API_KEY        Claude API key
//   WHATSAPP_TOKEN           Meta access token (System User permanent token)
//   WHATSAPP_VERIFY_TOKEN    Phrase typed in Meta's webhook form
//   META_APP_SECRET          Meta App → Settings → Basic → App secret (verifies messages come from Meta)
//   CLAUDE_MODEL             Optional. Defaults to claude-haiku-5-5
//   GRAPH_API_VERSION        Optional. Defaults to v25.0
//   CARDS_BASE_URL           Optional. Where the card images live; defaults to this site

import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
import { SYSTEM_PROMPT, CARD_SLUGS } from "../../lib/knowledge.mjs";
import { FEELINGS, findFeeling, DEEP_QUESTIONS, pickDeepQuestion, isCrisis, CRISIS_MESSAGE, moodLine } from "../../lib/heart.mjs";
import { MEDITATIONS, findMeditation } from "../../lib/meditate.mjs";
import { TEMPLE_GROUPS, findTempleGroup, findTemple } from "../../lib/temples.mjs";
import { HEAD_CHALLENGES, MIND_TOOLKIT, CHALLENGE_LEN, findHead, slainBar } from "../../lib/challenges.mjs";
import { QUIZ_LEN, QUIZ_TOPICS, topicFromText, pickQuestions, presentQuestion, matchOption, quizVerdict } from "../../lib/quiz.mjs";
import { QUIZ_BANK } from "../../lib/quizbank.mjs";
import { HI_HEAD_NAMES, WELCOME_EN } from "../../lib/hi.mjs";
import { setLang, isHindi, trLabel, trBody, toEnglish, wantsLanguage, hasDevanagari } from "../../lib/i18n.mjs";
import { HEADS, BTN, detectCommand, scoreAnswer, istDate, daysBetween, weekId, progressBar, topHeads, personContext } from "../../lib/flows.mjs";

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION || "v25.0"}`;
const HISTORY_TURNS = 16;                          // remembered messages per person (user + bot)
const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;    // forget a conversation after 7 days of silence
const MAX_WA_CHARS = 3900;                          // WhatsApp text limit is 4096
const MAX_BODY = 1024;                              // interactive message body / image caption limit

// Fixed menu anyone can open by typing "menu".
const MAIN_MENU = {
  button: "Open 🪔",
  rows: [
    { title: "My heart 💛", description: "Share how you feel, reflect, self-love" },
    { title: "Meditate 🧘", description: "1-2 minute guided pauses: breath, calm, sleep" },
    { title: "Grow ⚔️", description: "Kill Ravan's heads, 10-day journey, self-check" },
    { title: "Learn 📚", description: "Stories, quizzes, Devis, temples and more" },
  ],
};

// What each door opens.
const DOORS = {
  heart: { body: "💛 *My heart*\nThis is your space. What would feel good right now?", button: "Choose", rows: [
    { title: "How I feel 💛", description: "Share a feeling; get comfort and a tiny practice" },
    { title: "Deep question 💭", description: "One meaningful question about your life" },
    { title: "Self-love 🌷", description: "A gentle reminder of your worth" },
    { title: "My mood 📈", description: "Your recent check-ins" },
  ] },
  grow: { body: "⚔️ *Grow*\nSmall daily steps to defeat the Ravan within. Where shall we start?", button: "Choose", rows: [
    { title: "Kill a head ⚔️", description: "Pick one head of Ravan: 7-day challenge" },
    { title: "10-day journey 🔥", description: "One head a day, with streaks and a badge" },
    { title: "Inner Ravan check 🪞", description: "10 quick questions: your top 3 heads" },
    { title: "My progress 📊", description: "Streaks, heads slain, check result" },
  ] },
  learn: { body: "📚 *Learn*\nStories and wisdom to light the way. What are you curious about?", button: "Choose", rows: [
    { title: "Tell me a story 📖", description: "A short story with a lesson" },
    { title: "Quiz me 🎯", description: "3 quick questions, mixed topics" },
    { title: "Sacred places 🛕", description: "Shakti Peethas, Jyotirlingas, temples" },
    { title: "The 9 Devis 🌸", description: "Navratri: one quality a night" },
    { title: "Ravan's 10 heads 🔥", description: "The ten negatives inside every human" },
    { title: "The 9 Nidhis 💎", description: "Inner treasures that make life rich" },
    { title: "The 8 Siddhis ✨", description: "Inner powers, used for good" },
  ] },
};

export default async (req) => {
  if (req.method === "GET") return verifyWebhook(req);
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let body;
  try { body = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }

  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const msg = value?.messages?.[0];
  if (!msg) return ok(); // delivery/read status updates — nothing to do

  const phoneNumberId = value.metadata?.phone_number_id;
  const from = msg.from;
  const profileName = value.contacts?.[0]?.profile?.name || "";
  const store = getStore("inner-victory-whatsapp");

  // Meta retries a webhook it thinks failed; answer each message only once.
  const seenKey = `seen/${msg.id}`;
  if (await store.get(seenKey)) return ok();
  await store.set(seenKey, String(Date.now()));

  markRead(phoneNumberId, msg.id).catch(() => {});

  const rawText = incomingText(msg);
  if (!rawText) {
    setLang((await loadUser(store, from)).lang);
    await sendButtons(phoneNumberId, from, {
      body: "I can only read text for now 🙏 Tap a button or type your question about the Devis, Nidhis, Siddhis or Ravan's 10 heads.",
      options: [BTN.check, BTN.journey, BTN.quiz],
    });
    return ok();
  }

  const ctx = { phoneNumberId, from, store, profileName };
  const user = await loadUser(store, from);
  user.lastInAt = Date.now();
  user.firstAt = user.firstAt || user.lastInAt;
  user.msgs = (user.msgs || 0) + 1;
  if (profileName) user.name = profileName.slice(0, 40);
  user.pn = phoneNumberId;
  // Language: "हिंदी"/"hindi" or "english" switches; writing in Devanagari switches to Hindi automatically.
  const askedLang = wantsLanguage(rawText);
  if (askedLang) { user.lang = askedLang; user.langChosen = true; }
  else if (hasDevanagari(rawText) && user.lang !== "hi" && !user.langChosen) user.lang = "hi";
  setLang(user.lang);
  await saveUser(store, from, user);
  if (askedLang) {
    await sendList(phoneNumberId, from, {
      body: askedLang === "hi" ? "जय माता दी 🙏 अब से हम हिंदी में बात करेंगे 🌸\n\nबताइए, आज आपका मन कैसा है? या नीचे से कोई द्वार चुनें 👇\n\n(अंग्रेज़ी के लिए *English* लिखें)"
        : "Jai Mata Di 🙏 We'll talk in English now 🌸\n\nHow is your heart today? Or pick a door below 👇\n\n(For Hindi, type *हिंदी*)",
      ...MAIN_MENU,
    });
    await remember(store, from, rawText, askedLang === "hi" ? "(Switched to Hindi. Reply in Hindi from now on.)" : "(Switched to English.)");
    return ok();
  }
  const text = toEnglish(rawText);
  // Safety first: if someone may be in danger, share real help before anything else.
  if (isCrisis(text)) {
    user.care = Date.now();
    delete user.quiz; if (user.check && !user.check.result) delete user.check;
    await saveUser(store, from, user);
    await sendText(phoneNumberId, from, CRISIS_MESSAGE);
    await remember(store, from, text, CRISIS_MESSAGE);
    console.log("Care message sent");
    return ok();
  }

  let cmd = FEELINGS.some((f) => f.title === text) ? "feeling" : detectCommand(text);
  if (!cmd && hasDevanagari(text) && text.length < 80 && /(महसूस|लग रहा|लग रही|हूँ|हूं)/.test(text) && findFeeling(text)) cmd = "feeling";

  // Welcome: on "reset", or when someone new (or back after a long gap) says hello.
  const greeting = /^(hi+|hello+|hey+|hlo|namaste|namaskar|pranam|jai mata di|jai shree ram|jai shri ram|radhe radhe|ram ram|good (morning|afternoon|evening)|start|नमस्ते|नमस्कार|प्रणाम|जय माता दी|जय श्री राम|राधे राधे|राम राम|हाय|हेलो)(?![A-Za-z\u0900-\u097F])/i.test(text) && text.length < 40;
  if (cmd === "reset" || (!cmd && greeting && !(await loadChat(store, from)).turns.length)) {
    await store.delete(`chat/${from}`);
    if (user.check && !user.check.result) delete user.check;
    user.welcomed = Date.now();
    await saveUser(store, from, user);
    const options = ["Happy 😊", "A bit stressed 😩", "Low 😔"];
    await sendButtons(phoneNumberId, from, { body: WELCOME_EN, options, image: cardUrl("mandala") });
    await remember(store, from, rawText, WELCOME_EN + `\n(Options offered: ${options.join(" / ")})`);
    return ok();
  }

  if (cmd === "menu") {
    await sendList(phoneNumberId, from, { body: "🪔 Four doors, one journey. Where would your heart like to go? 👇", ...MAIN_MENU });
    return ok();
  }

  // An Inner Ravan check in progress takes the person's answers until it's done.
  if (user.check && !user.check.result) {
    if (/^(stop|exit|quit|cancel|band karo)$/i.test(text)) {
      delete user.check; await saveUser(store, from, user);
      await sendButtons(phoneNumberId, from, { body: "No problem, check stopped 🙂 What would you like instead?", options: [BTN.journey, BTN.quiz, BTN.story] });
      return ok();
    }
    if (!cmd || cmd === "check") {
      await continueCheck(ctx, user, cmd === "check" ? null : text);
      return ok();
    }
  }

  // A quiz in progress takes the person's taps until it's done.
  if (user.quiz && !cmd) {
    if (/^(stop|exit|quit|cancel|band karo)$/i.test(text)) {
      delete user.quiz; await saveUser(store, from, user);
      await sendButtons(phoneNumberId, from, { body: "Quiz stopped 🙂 What next?", options: [BTN.journey, BTN.story, BTN.check] });
      return ok();
    }
    const cur = user.quiz.qs[user.quiz.i];
    if (matchOption(text, cur.options) >= 0) { await answerQuiz(ctx, user, text); return ok(); }
    // Anything else is a new message: close the quiz quietly and answer it.
    delete user.quiz; await saveUser(store, from, user);
    await converse(ctx, user, text, { note: "They left a quiz midway to say or ask this. Answer it fully and warmly; at the end you may offer \"Quiz again 🎯\" as one option." });
    return ok();
  }

  switch (cmd) {
    case "quiz": await startQuiz(ctx, user, text); return ok();
    case "check": await startCheck(ctx, user); return ok();
    case "journey_start": await journeyStart(ctx, user, text); return ok();
    case "journey_restart": delete user.journey; await journeyStart(ctx, user, text); return ok();
    case "journey_next": await journeyNext(ctx, user, text, false); return ok();
    case "journey_skip": await journeyNext(ctx, user, text, true); return ok();
    case "journey_done": {
      const j = user.journey;
      const journeyPending = j && !j.finished && !j.done.includes(j.day);
      if (journeyPending) { await journeyDone(ctx, user); return ok(); }
      if (user.activeHead) { await killDone(ctx, user); return ok(); }
      if (j && !j.finished) { await journeyDone(ctx, user); return ok(); }
      break; // "done" with nothing active: let the guide reply normally
    }
    case "progress": await showProgress(ctx, user); return ok();
    case "door_heart": case "door_grow": case "door_learn": {
      const d = DOORS[cmd.slice(5)];
      if (!(await sendList(phoneNumberId, from, d))) await sendText(phoneNumberId, from, d.body + "\n\n" + d.rows.map((r) => r.title).join("\n"));
      await remember(store, from, text, d.body);
      return ok();
    }
    case "meditate": await meditateMenu(ctx, user); return ok();
    case "selflove": await converse(ctx, user, text, { note: "They want a self-love moment. Warmly remind them of their worth (specific, not generic), share one line of wisdom (e.g. Gita 6.5: be your own friend), give one tiny self-love practice to do today, and end with a gentle personal question about how they treat themselves. Under 110 words. No options or menu.", card: "kushmanda", options: [] }); return ok();
    case "sacred": await sacredMenu(ctx, user); return ok();
    case "checkin": await feelingsMenu(ctx, user); return ok();
    case "feeling": {
      const f = findFeeling(text);
      if (f) { await shareFeeling(ctx, user, f, text); return ok(); }
      break;
    }
    case "deepq": await askDeepQuestion(ctx, user); return ok();
    case "mood": await showMood(ctx, user); return ok();
    case "kill_menu": await killMenu(ctx, user); return ok();
    case "kill_head": {
      const h = findHead(text);
      if (h) { await headIntro(ctx, user, h); return ok(); }
      break;
    }
    case "kill_start": await killStart(ctx, user, text); return ok();
    case "kill_next": await killNext(ctx, user, false); return ok();
    case "kill_skip": await killNext(ctx, user, true); return ok();
    case "kill_done": await killDone(ctx, user); return ok();
    case "mind": await mindTricks(ctx, user); return ok();
    case "remind_on": await setReminder(ctx, user, true); return ok();
    case "remind_off": await setReminder(ctx, user, false); return ok();
  }

  // A meditation chosen from the list.
  if (!cmd) {
    const med = findMeditation(text);
    if (med) { await guideMeditation(ctx, user, med); return ok(); }
  }

  // Taps in the Sacred places menus.
  if (!cmd) {
    const g = findTempleGroup(text);
    if (g) { await templeList(ctx, user, g); return ok(); }
    const tp = /^🛕/.test(text) ? findTemple(text) : null;
    if (tp) { await templeStory(ctx, user, tp, text); return ok(); }
  }

  // An answer to a deep question gets a listening, reflective reply.
  const looksLikeNewQuestion = /\?\s*$/.test(text) && !/\b(i|me|my|main|mera|meri|mujhe)\b/i.test(text);
  if (!cmd && user.pendingQ && looksLikeNewQuestion) delete user.pendingQ;
  if (!cmd && user.pendingQ && Date.now() - user.pendingQ.at < 24 * 3600 * 1000) {
    await answerDeepQuestion(ctx, user, text);
    return ok();
  }

  await converse(ctx, user, text);
  return ok();
};

export const config = { path: "/whatsapp" };

// ---------- conversation with the guide ----------

async function loadChat(store, from) {
  try {
    const saved = await store.get(`chat/${from}`, { type: "json" });
    if (saved && Date.now() - (saved.at || 0) < HISTORY_TTL_MS) return { turns: saved.turns || [], lastCard: saved.lastCard || null };
  } catch {}
  return { turns: [], lastCard: null };
}

async function saveChat(store, from, chat) {
  await store.setJSON(`chat/${from}`, { at: Date.now(), lastCard: chat.lastCard, turns: trimHistory(chat.turns) });
}

// Record a fixed (non-Claude) bot message in the history, so the guide knows what happened.
async function remember(store, from, userText, botText) {
  const chat = await loadChat(store, from);
  chat.turns = trimHistory([...chat.turns, { role: "user", content: userText }, { role: "assistant", content: botText }]);
  await saveChat(store, from, chat);
}

// Ask the guide, then send the reply with its card and buttons.
// opts.note: private instruction for this turn; opts.options / opts.card force the choices or card;
// opts.prefix: fixed text placed above the guide's words.
async function converse({ phoneNumberId, from, store, profileName }, user, text, opts = {}) {
  const chat = await loadChat(store, from);
  let userTurn = text;
  if (chat.turns.length === 0 && profileName) userTurn = `[WhatsApp name: ${profileName.slice(0, 40)}]\n${userTurn}`;
  const forClaude = opts.note ? `${userTurn}\n\n[GUIDE NOTE, not written by the person: ${opts.note}]` : userTurn;
  const messages = trimHistory([...chat.turns, { role: "user", content: forClaude }]);

  let answer;
  try {
    answer = await askClaude(messages, personContext(user));
  } catch (err) {
    console.error("Claude error:", err);
    await sendText(phoneNumberId, from, "Sorry, I couldn't answer just now 🙏 Please send your message again in a minute.");
    return;
  }

  const parsed = parseReply(answer);
  if (opts.options) { parsed.options = opts.options; parsed.menu = null; }
  if (opts.card !== undefined) parsed.card = opts.card;
  if (user.care && Date.now() - user.care < 24 * 3600 * 1000) parsed.card = null; // no picture cards right after distress
  let reply = toWhatsApp(parsed.text);
  if (opts.prefix) reply = `${opts.prefix}\n\n${reply}`;
  const image = parsed.card && parsed.card !== chat.lastCard ? cardUrl(parsed.card) : null;

  await deliver(phoneNumberId, from, { reply, image, options: parsed.options, menu: parsed.menu });

  // Remember what we offered, so a tap on a button makes sense to the guide next turn.
  const offered = parsed.options.length ? `\n(Options offered: ${parsed.options.join(" / ")})`
    : parsed.menu ? `\n(Menu offered: ${parsed.menu.rows.map((r) => r.title).join(" / ")})` : "";
  chat.turns = [...messages.slice(0, -1), { role: "user", content: userTurn }, { role: "assistant", content: reply + offered }];
  chat.lastCard = parsed.card || chat.lastCard;
  await saveChat(store, from, chat);
}

// ---------- per-person state (journey, self-check) ----------

async function loadUser(store, from) {
  try { return (await store.get(`user/${from}`, { type: "json" })) || {}; } catch { return {}; }
}

async function saveUser(store, from, user) {
  await store.setJSON(`user/${from}`, user);
}

// ---------- scored quizzes ----------

async function startQuiz(ctx, user, text) {
  const topic = topicFromText(text);
  const picked = pickQuestions(topic, user.quizSeen || []);
  if (!picked.length) return converse(ctx, user, text);
  user.quiz = { topic, i: 0, score: 0, qs: picked.map((q) => ({ id: q.id, ...presentQuestion(q) })) };
  await saveUser(ctx.store, ctx.from, user);
  const intro = `🎯 *Quiz time: ${QUIZ_TOPICS[topic]}*\n${QUIZ_LEN} quick questions. Tap your answer!\n\n`;
  await askQuizQuestion(ctx, user, intro);
}

function bankItem(id) { return QUIZ_BANK.find((q) => q.id === id); }

async function askQuizQuestion({ phoneNumberId, from }, user, lead = "") {
  const cur = user.quiz.qs[user.quiz.i];
  const q = bankItem(cur.id);
  const body = `${lead}*Q${user.quiz.i + 1}/${QUIZ_LEN}*  ${q.q}`;
  const sent = await sendButtons(phoneNumberId, from, { body, options: cur.options });
  if (!sent) await sendText(phoneNumberId, from, `${body}\n\n${cur.options.map((o, k) => `${k + 1}. ${o}`).join("\n")}`);
}

async function answerQuiz(ctx, user, text) {
  const { phoneNumberId, from, store } = ctx;
  const cur = user.quiz.qs[user.quiz.i];
  const q = bankItem(cur.id);
  const pick = matchOption(text, cur.options);
  if (pick < 0) {
    await sendButtons(phoneNumberId, from, { body: `Tap one of the answers 🙂 (or type *stop*)\n\n*Q${user.quiz.i + 1}/${QUIZ_LEN}*  ${q.q}`, options: cur.options });
    return;
  }
  const right = pick === cur.answer;
  if (right) user.quiz.score += 1;
  const praise = ["Correct! 👏", "Spot on! ✨", "Yes! 🔥", "Shabaash! 👏"][user.quiz.i % 4];
  const feedback = right ? `✅ ${praise}\n${q.why}` : `❌ Not quite. It's *${cur.options[cur.answer]}*.\n${q.why}`;
  user.quizSeen = [...(user.quizSeen || []), cur.id].slice(-80);
  user.quiz.i += 1;

  if (user.quiz.i < QUIZ_LEN) {
    await saveUser(store, from, user);
    return askQuizQuestion(ctx, user, `${feedback}\n\n`);
  }

  const score = user.quiz.score;
  const stats = user.quizStats || { played: 0, best: 0, total: 0 };
  stats.played += 1; stats.total += score; stats.best = Math.max(stats.best, score);
  user.quizStats = stats;
  const topic = user.quiz.topic;
  delete user.quiz;
  await saveUser(store, from, user);
  const body = `${feedback}\n\n━━━━━━━━━━\n*Score: ${score}/${QUIZ_LEN}*  ${"⭐".repeat(score)}${"☆".repeat(QUIZ_LEN - score)}\n${quizVerdict(score)}\n` +
    `_Quizzes played: ${stats.played}_`;
  const third = user.journey && !user.journey.finished ? BTN.next : user.check?.result ? BTN.journey : BTN.check;
  const options = [BTN.quizAgain, BTN.story, third];
  if (!(await sendButtons(phoneNumberId, from, { body, options }))) await sendText(phoneNumberId, from, body);
  await remember(store, from, `(Took a quiz on ${QUIZ_TOPICS[topic]})`, `Quiz finished: ${score}/${QUIZ_LEN}.\n(Options offered: ${options.join(" / ")})`);
}

// ---------- meditate with me ----------

async function meditateMenu({ phoneNumberId, from, store }, user) {
  const body = "🧘 *Meditate with me*\nLet's take a small pause together. Even one minute brings you home to yourself. Choose one 👇";
  const rows = MEDITATIONS.map((m) => ({ title: m.title, description: m.description }));
  if (!(await sendList(phoneNumberId, from, { body, button: "Choose", rows }))) {
    await sendText(phoneNumberId, from, body + "\n\n" + MEDITATIONS.map((m) => m.title).join("\n"));
  }
  await remember(store, from, BTN.meditate, body);
}

async function guideMeditation({ phoneNumberId, from, store }, user, med) {
  user.meditations = (user.meditations || 0) + 1;
  user.lastMeditation = { key: med.key, at: Date.now() };
  await saveUser(store, from, user);
  const prompt = `${med.text}\n\nTake your time. When you open your eyes, tell me: *how do you feel now?*`;
  await deliver(phoneNumberId, from, { reply: prompt, image: cardUrl(med.card), options: [BTN.calmer, BTN.restless, BTN.anotherMed], menu: null });
  await remember(store, from, med.title, prompt + "\n(Guided meditation sent. If they reply 'I feel calmer', celebrate it warmly and ask what they noticed; if 'Still restless', reassure them that's completely normal, the mind is like a puppy that learns to sit, and offer one gentler tip.)");
}

// ---------- sacred places ----------

async function sacredMenu({ phoneNumberId, from, store }, user) {
  const body = "🛕 *Sacred places of India*\nEvery tirtha carries a story, and every story a teaching. Where shall we go? 👇";
  const rows = [...TEMPLE_GROUPS.map((g) => ({ title: g.title, description: g.description })), { title: BTN.templeQuiz, description: "3 questions on India's temples" }];
  if (!(await sendList(phoneNumberId, from, { body, button: "Choose", rows }))) {
    await sendText(phoneNumberId, from, body + "\n\n" + rows.map((r) => r.title).join("\n"));
  }
  await remember(store, from, BTN.sacred, body);
}

async function templeList({ phoneNumberId, from, store }, user, g) {
  const body = `${g.title}\nTap a temple to hear its story 👇`;
  const rows = g.temples.map((t) => ({ title: `🛕 ${t}` }));
  if (!(await sendList(phoneNumberId, from, { body, button: "Temples", rows }))) {
    await sendText(phoneNumberId, from, body + "\n\n" + g.temples.join("\n"));
  }
  await remember(store, from, g.title, body);
}

async function templeStory(ctx, user, tp, text) {
  const note = `Tell them about *${tp.name}* using the TEMPLE KNOWLEDGE. Shape: one vivid opening line; the legend in 2-3 short lines; ` +
    "1-2 surprising facts; the main festival; one line connecting it to an inner teaching (a Devi, a Nidhi, or a head of Ravan it helps conquer). " +
    "Do not give timings, prices, booking steps or rules as facts; if relevant, say they change and to check the official site or shrine board (name it if known). " +
    "Under 140 words. End with a light question.";
  await converse(ctx, user, text, { note, card: tp.group.card, options: [BTN.anotherTemple, BTN.templeQuiz, BTN.feel] });
}

// ---------- heart: feelings, deep questions, mood ----------

async function feelingsMenu({ phoneNumberId, from, store }, user) {
  const body = "💛 *How are you feeling right now?*\nBe honest; every feeling is welcome here. Tap the one closest to your heart 👇";
  const rows = FEELINGS.map((f) => ({ title: f.title }));
  if (!(await sendList(phoneNumberId, from, { body, button: "My feeling", rows }))) {
    await sendText(phoneNumberId, from, body + "\n\n" + FEELINGS.map((f) => f.title).join("\n"));
  }
  await remember(store, from, BTN.feel, body);
}

async function shareFeeling(ctx, user, f, text) {
  user.moods = [...(user.moods || []), { d: istDate(), m: f.key, at: Date.now() }].slice(-60);
  await saveUser(ctx.store, ctx.from, user);
  const recentLow = user.moods.slice(-5).filter((m) => !FEELINGS.find((x) => x.key === m.m)?.positive).length;
  const note = `The person just shared that they feel *${f.key}*. Respond like a caring friend: ` +
    `first acknowledge the feeling warmly in their language (1-2 lines; ${f.positive ? "celebrate with them" : "validate it, no 'just be positive', no fixing yet"}); ` +
    `then one short teaching that genuinely fits (${f.hint}); then the 1-minute practice they can do right now, in simple steps; ` +
    `end with ONE gentle open question inviting them to share more about what's behind the feeling. No options, no menu. Under 120 words.` +
    (recentLow >= 3 && !f.positive ? " They have felt low several times recently: gently ask how they are coping, encourage talking to someone they trust, and if it sounds heavy, softly mention Tele-MANAS 14416 (free, 24x7)." : "");
  await converse(ctx, user, text, { note, card: f.card, options: [] });
}

async function askDeepQuestion({ phoneNumberId, from, store }, user) {
  const q = pickDeepQuestion(user.deepSeen || []);
  user.deepSeen = [...(user.deepSeen || []), q.id].slice(-40);
  user.pendingQ = { id: q.id, q: q.q, at: Date.now() };
  await saveUser(store, from, user);
  const body = `💭 *A question for you*\n\n_${q.q}_\n\nTake your time and reply in your own words; there's no right answer 🙏\n(Type *another* for a different question.)`;
  await sendText(phoneNumberId, from, body);
  await remember(store, from, BTN.deepq, body);
}

async function answerDeepQuestion(ctx, user, text) {
  const q = user.pendingQ;
  user.journal = [...(user.journal || []), { q: q.q, a: text.slice(0, 400), d: istDate() }].slice(-20);
  delete user.pendingQ;
  await saveUser(ctx.store, ctx.from, user);
  const note = `They are answering your reflection question: "${q.q}". Listen deeply. ` +
    "First reflect back what you heard, in their own words (1-2 lines), and honour their honesty. " +
    "Then offer ONE insight from the wisdom that truly fits what they said (a line from the Gita, a Devi's quality, a Nidhi, or the head of Ravan at play), and one tiny practice for today. " +
    "If they shared pain, stay gentle and human; don't rush to teach. Finish by either asking one soft follow-up question (no options) or offering [[options: Another question 💭 | How I feel 💛 | Kill a head ⚔️]] if they seem complete. Under 130 words. " +
    "If something sounds like serious distress, encourage reaching out to someone they trust and mention Tele-MANAS 14416.";
  await converse(ctx, user, text, { note });
}

async function showMood({ phoneNumberId, from, store }, user) {
  const moods = user.moods || [];
  let body;
  if (!moods.length) {
    body = "📈 You haven't checked in yet. Tap *How I feel 💛* anytime, and I'll keep a gentle record of your week.";
  } else {
    const recent = moods.slice(-14);
    const pos = recent.filter((m) => FEELINGS.find((f) => f.key === m.m)?.positive).length;
    const counts = {};
    for (const m of recent) counts[m.m] = (counts[m.m] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    body = `📈 *Your recent check-ins*\n${moodLine(moods, 10)}\n\nMost often: *${top}*\nBright moments: ${pos} of ${recent.length}\n\n` +
      (pos >= recent.length / 2 ? "Your heart has had good light lately 🌸 Keep doing what helps." : "It's been a heavier stretch 💛 Be gentle with yourself. Small practices add up, and talking to someone you trust helps too.");
  }
  await sendButtons(phoneNumberId, from, { body, options: [BTN.feel, BTN.deepq, BTN.killMenu] });
  await remember(store, from, BTN.mood, body);
}

// ---------- Kill Ravan's 10 heads: 7-day challenges ----------

function headState(user, slug) {
  user.heads = user.heads || {};
  return (user.heads[slug] = user.heads[slug] || { done: 0 });
}

async function killMenu({ phoneNumberId, from, store }, user) {
  const slain = user.slain || [];
  const rows = HEAD_CHALLENGES.map((h) => {
    const st = user.heads?.[h.slug];
    if (isHindi()) {
      const hn = HI_HEAD_NAMES[h.slug];
      const st2 = slain.includes(h.slug) ? "🗡️ मारा गया!" : st?.done ? `जारी · ${st.done}/7 दिन` : `${hn.virtue} से जीतें`;
      return { title: `⚔️ ${h.name}`, description: `${hn.en} · ${st2}`.slice(0, 72) };
    }
    const status = slain.includes(h.slug) ? "🗡️ Slain!" : st?.done ? `In progress · ${st.done}/7 days` : `Kill it with ${h.virtue}`;
    return { title: `⚔️ ${h.name}`, description: `${h.en} · ${status}`.slice(0, 72) };
  });
  const top = user.check?.result?.[0];
  const body = `👹 *Kill Ravan's 10 heads*\n${slainBar(slain)}  ${slain.length}/10 slain\n\n` +
    "Pick *one head* to fight. You'll learn its tricks, then defeat it with a 7-day challenge, one small task a day." +
    (top && !slain.includes(top.slug) ? `\n\n💡 Your check said *${top.name}* needs attention most.` : "");
  if (!(await sendList(phoneNumberId, from, { body, button: "Choose a head", rows }))) {
    await sendText(phoneNumberId, from, body + "\n\n" + HEAD_CHALLENGES.map((h, i) => `${i + 1}. ${h.name} (${h.en})`).join("\n") + "\n\n_Reply with a head's name._");
  }
  await remember(store, from, BTN.killMenu, body);
}

async function headIntro({ phoneNumberId, from, store }, user, h) {
  user.headView = h.slug;
  await saveUser(store, from, user);
  const slain = (user.slain || []).includes(h.slug);
  const reply = `⚔️ *${h.name}* (${h.hi}) · ${h.en}\n${h.what}\n\n` +
    `👀 *Signs it's ruling you*\n${h.signs.map((x) => `• ${x}`).join("\n")}\n\n` +
    `🧠 *What your mind will say*\n_${h.trick}_\n\n` +
    `🗡️ *How to kill it*\n${h.tips.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n` +
    (slain ? "You've already slain this head once 🗡️ Want to train again?" : `Ready for 7 days of *${h.virtue}*?`);
  const options = [slain ? "Train again ⚔️" : BTN.startKill, BTN.mind, BTN.otherHeads];
  await deliver(phoneNumberId, from, { reply, image: cardUrl(h.slug), options, menu: null });
  await remember(store, from, `⚔️ ${h.name}`, reply + `\n(Options offered: ${options.join(" / ")})`);
}

async function killStart(ctx, user, text) {
  const h = findHead(text) || HEAD_CHALLENGES.find((x) => x.slug === user.headView) || HEAD_CHALLENGES.find((x) => x.slug === user.activeHead);
  if (!h) return killMenu(ctx, user);
  const st = headState(user, h.slug);
  if (st.done >= CHALLENGE_LEN) { st.done = 0; delete st.lastDoneDate; } // training again
  user.activeHead = h.slug;
  await saveUser(ctx.store, ctx.from, user);
  return sendKillTask(ctx, user, h, st.done ? "Welcome back to the fight 💪" : `The fight against *${h.name}* begins today 🔥`);
}

async function killNext(ctx, user, force) {
  const h = HEAD_CHALLENGES.find((x) => x.slug === user.activeHead);
  if (!h) return killMenu(ctx, user);
  const st = headState(user, h.slug);
  if (!force && st.lastDoneDate === istDate()) {
    const body = `✅ Today's task is done. *Day ${st.done + 1}/7* against *${h.name}* unlocks tomorrow 🌅\n\nOne task a day lets the change go deep.`;
    const options = [BTN.mind, BTN.quiz, BTN.progress];
    await sendButtons(ctx.phoneNumberId, ctx.from, { body, options });
    return;
  }
  return sendKillTask(ctx, user, h);
}

async function sendKillTask({ phoneNumberId, from, store }, user, h, lead = "") {
  const st = headState(user, h.slug);
  const d = h.days[Math.min(st.done, CHALLENGE_LEN - 1)];
  st.taskDate = istDate();
  await saveUser(store, from, user);
  const body = `${lead ? lead + "\n\n" : ""}⚔️ *Killing ${h.name} · Day ${st.done + 1}/7*\n${progressBar7(st.done)}\n\n` +
    `🎯 *Today's task*\n${d.task}\n\n🧠 *Your mind will say:* _${d.mind}_\n💪 *Answer it:* ${d.answer}\n\nTap *Done ⚔️* when you've done it.`;
  const options = [BTN.killDone, BTN.mind, BTN.otherHeads];
  const image = st.done === 0 ? cardUrl(h.slug) : null;
  await deliver(phoneNumberId, from, { reply: body, image, options, menu: null });
  await remember(store, from, `(Asked for today's ${h.name} task)`, body);
}

function progressBar7(done) { return "▓".repeat(done) + "░".repeat(Math.max(0, CHALLENGE_LEN - done)); }

async function killDone({ phoneNumberId, from, store }, user) {
  const h = HEAD_CHALLENGES.find((x) => x.slug === user.activeHead);
  if (!h) {
    await sendButtons(phoneNumberId, from, { body: "You don't have a head challenge running yet. Pick one to fight 👇", options: [BTN.killMenu, BTN.check, BTN.quiz] });
    return;
  }
  const st = headState(user, h.slug);
  const today = istDate();
  if (st.lastDoneDate === today) {
    await sendButtons(phoneNumberId, from, { body: `Already counted ✅ Day ${st.done + 1} against *${h.name}* unlocks tomorrow 🌅`, options: [BTN.mind, BTN.quiz, BTN.progress] });
    return;
  }
  st.done += 1;
  st.lastDoneDate = today;

  if (st.done >= CHALLENGE_LEN) {
    user.slain = [...new Set([...(user.slain || []), h.slug])];
    delete user.activeHead;
    await saveUser(store, from, user);
    const n = user.slain.length;
    const body = `🗡️ *${h.name} is slain!*\n7 days of ${h.virtue}. That's real Vijayadashami 🙏\n\n${slainBar(user.slain)}  *${n}/10 heads slain*\n\n` +
      (n >= 10 ? "🏆 *ALL TEN HEADS SLAIN!* You are an Inner Victor. Keep the practices alive, because heads like to grow back 😉" :
        "A head can grow back if you stop watching it, so keep one practice going. Ready for the next head?");
    const options = n >= 10 ? [BTN.check, BTN.quiz, BTN.story] : [BTN.otherHeads, BTN.quiz, BTN.progress];
    await sendButtons(phoneNumberId, from, { body, options, image: cardUrl(n >= 10 ? "victor" : h.slug) });
    await remember(store, from, BTN.killDone, body);
    return;
  }
  await saveUser(store, from, user);
  const cheers = ["Strong! 💪", "Shabaash! 👏", "One more strike! ⚔️", "Beautiful! 🌸", "The head is weakening! 🔥", "Almost there! 🗡️"];
  const body = `✅ ${cheers[(st.done - 1) % cheers.length]} Day ${st.done} against *${h.name}* done.\n${progressBar7(st.done)}  ${st.done}/7\n\n` +
    `Your next task unlocks tomorrow 🌅 Tonight, notice once when ${h.name} tried to talk you out of it.`;
  const options = user.remind ? [BTN.mind, BTN.quiz, BTN.progress] : [BTN.remind, BTN.mind, BTN.quiz];
  await sendButtons(phoneNumberId, from, { body, options });
  await remember(store, from, BTN.killDone, body);
}

async function mindTricks({ phoneNumberId, from, store }, user) {
  const h = HEAD_CHALLENGES.find((x) => x.slug === (user.activeHead || user.headView));
  const reply = MIND_TOOLKIT + (h ? `\n\n⚔️ *For ${h.name}*, the mind's favourite line is: _${h.trick}_ Now you'll recognise it.` : "");
  const options = h && user.activeHead ? [BTN.killNext, BTN.otherHeads, BTN.quiz] : [BTN.killMenu, BTN.check, BTN.quiz];
  await deliver(phoneNumberId, from, { reply, image: null, options, menu: null });
  await remember(store, from, BTN.mind, reply);
}

// ---------- Inner Ravan self-check ----------

async function startCheck(ctx, user) {
  if (user.checkPaused && Date.now() - user.checkPaused.started < 24 * 3600 * 1000) {
    user.check = user.checkPaused; delete user.checkPaused;
    await saveUser(ctx.store, ctx.from, user);
    return askCheckQuestion(ctx, user, "🪞 Welcome back! Let's continue where you left off.\n\n");
  }
  delete user.checkPaused;
  user.check = { step: 0, answers: [], started: Date.now() };
  await saveUser(ctx.store, ctx.from, user);
  const intro = "🪞 *Inner Ravan check*\nTen quick questions, about a minute. Be honest, it's just for you 🙂\n\n";
  await askCheckQuestion(ctx, user, intro, cardUrl("mandala"));
}

async function askCheckQuestion({ phoneNumberId, from }, user, intro = "", image = null) {
  const i = user.check.step;
  const body = `${intro}*${i + 1}/10*  ${progressBar(i)}\n\n${HEADS[i].q}`;
  const sent = await sendButtons(phoneNumberId, from, { body, options: [BTN.often, BTN.sometimes, BTN.rarely], image });
  if (!sent) await sendText(phoneNumberId, from, `${body}\n\nReply: Often, Sometimes or Rarely`);
}

async function continueCheck(ctx, user, text) {
  if (text !== null) {
    const score = scoreAnswer(text);
    if (score === null) {
      // Not an answer: pause the check (progress kept) and reply to what they actually said.
      user.checkPaused = user.check; delete user.check;
      await saveUser(ctx.store, ctx.from, user);
      await converse(ctx, user, text, { note: "They paused the Inner Ravan check midway to say or ask this. Answer it fully and warmly; at the end you may offer \"Inner Ravan check 🪞\" as one option to continue it." });
      return;
    }
    user.check.answers[user.check.step] = score;
    user.check.step += 1;
  }
  if (user.check.step < HEADS.length) {
    await saveUser(ctx.store, ctx.from, user);
    return askCheckQuestion(ctx, user);
  }
  return finishCheck(ctx, user);
}

async function finishCheck({ phoneNumberId, from, store }, user) {
  const top = topHeads(user.check.answers);
  user.check.result = top.map(({ slug, name, en, virtue }) => ({ slug, name, en, virtue }));
  user.check.at = Date.now();
  await saveUser(store, from, user);

  let body, options, image;
  if (!top.length) {
    body = "🪞 *Your Inner Ravan*\n\nWow, all ten heads look calm right now 🙏✨ That's rare!\n\nEven so, every human carries all ten in small ways. The 10-day journey keeps them that way.";
    options = [BTN.journey, BTN.quiz, BTN.story];
    image = cardUrl("mandala");
  } else {
    const lines = top.map((h, i) => `${["1️⃣", "2️⃣", "3️⃣"][i]} *${h.name}* (${h.en})  →  ${h.virtue}`).join("\n");
    body = `🪞 *Your Inner Ravan*\n\nThe heads asking for your attention most:\n\n${lines}\n\nEveryone carries all ten. Seeing them clearly is the first victory 🙏\n\nWant to start with *${top[0].name}*?`;
    options = [`Kill ${top[0].name} ⚔️`, BTN.journey, BTN.quiz];
    image = cardUrl(top[0].slug);
  }
  if (!(await sendButtons(phoneNumberId, from, { body, options, image }))) await sendText(phoneNumberId, from, body);
  await remember(store, from, "(Took the Inner Ravan check)", body + `\n(Options offered: ${options.join(" / ")})`);
}

// ---------- 10-day Defeat Ravan journey ----------

async function journeyStart(ctx, user, text) {
  const j = user.journey;
  if (j && !j.finished) return showProgress(ctx, user, "You're already on the journey 🔥 Let's keep going!");
  user.journey = { day: 0, done: [], streak: 0, best: 0, started: istDate() };
  if (j?.finished) user.journey.round = (j.round || 1) + 1;
  return sendJourneyDay(ctx, user, text, 1);
}

async function journeyNext(ctx, user, text, force) {
  const j = user.journey;
  if (!j) return journeyStart(ctx, user, text);
  if (j.finished) return sendComplete(ctx, user);
  const today = istDate();
  if (!force && j.lessonDate === today) {
    const doneToday = j.done.includes(j.day);
    const body = doneToday
      ? `Day ${j.day} is done ✅ *Day ${j.day + 1}: ${HEADS[j.day]?.name}* unlocks tomorrow 🌅\n\nOne head a day lets each lesson really sink in.`
      : `Today's challenge (Day ${j.day}: *${HEADS[j.day - 1].name}*) is still waiting 🙂\n\nTap *Done ✅* once you've tried it, and Day ${j.day + 1} opens tomorrow.`;
    const options = doneToday ? [BTN.quiz, BTN.story, BTN.progress] : [BTN.done, BTN.more, BTN.progress];
    await sendButtons(ctx.phoneNumberId, ctx.from, { body, options });
    return;
  }
  // A new day: move on if yesterday's day was done, otherwise give that day another go.
  const nextDay = j.done.includes(j.day) || j.day === 0 ? j.day + 1 : j.day;
  if (nextDay > 10) return sendComplete(ctx, user);
  return sendJourneyDay(ctx, user, text, nextDay);
}

async function sendJourneyDay(ctx, user, text, day) {
  const j = user.journey;
  const h = HEADS[day - 1];
  j.day = day;
  j.lessonDate = istDate();
  await saveUser(ctx.store, ctx.from, user);
  const prefix = `🔥 *Defeat Ravan · Day ${day}/10*\n${progressBar(j.done.length)}`;
  const note = `They are on the 10-day "Defeat Ravan" journey. Write Day ${day} of 10: Ravan's head *${h.name}* (${h.en}), conquered by ${h.virtue}. ` +
    `Do not repeat the "Day ${day}/10" heading or a progress bar; they are added above your text. Shape: a catchy one-line hook; ` +
    `how ${h.name} shows up in everyday life (2-3 short lines, relatable: work, family, phone, money); ` +
    `one tiny, specific challenge for today that takes under 5 minutes; then ask them to tap "Done ✅" after trying it. ` +
    `Keep it under 110 words.` + (day === 1 ? " As this is the start, add one warm line welcoming them to the journey." : "");
  await converse(ctx, user, text, { note, prefix, options: [BTN.done, BTN.more, BTN.quiz], card: h.slug });
}

async function journeyDone({ phoneNumberId, from, store }, user) {
  const j = user.journey;
  const today = istDate();
  if (j.done.includes(j.day)) {
    const body = `Already marked ✅ for Day ${j.day}. *Day ${j.day + 1}${HEADS[j.day] ? `: ${HEADS[j.day].name}` : ""}* unlocks tomorrow 🌅`;
    await sendButtons(phoneNumberId, from, { body, options: [BTN.quiz, BTN.story, BTN.progress] });
    return;
  }
  j.done.push(j.day);

  // Streaks: +1 for consecutive days; one missed day per week is forgiven by the streak shield;
  // otherwise a gentle fresh start (never "you lost your streak").
  let streakNote = "";
  const gap = j.lastDoneDate ? daysBetween(j.lastDoneDate, today) : null;
  if (gap === null) j.streak = 1;
  else if (gap === 0) { /* same day, keep */ }
  else if (gap === 1) j.streak += 1;
  else if (gap === 2 && j.shieldWeek !== weekId(today)) {
    j.streak += 1; j.shieldWeek = weekId(today);
    streakNote = "\n🛡️ Your weekly *streak shield* covered yesterday. Streak saved!";
  } else {
    j.streak = 1;
    streakNote = "\n🌱 A *fresh start* today. Every day you show up counts.";
  }
  j.best = Math.max(j.best || 0, j.streak);
  j.lastDoneDate = today;
  const h = HEADS[j.day - 1];

  if (j.done.length >= 10 || j.day === 10) {
    j.finished = today;
    await saveUser(store, from, user);
    return sendComplete({ phoneNumberId, from, store }, user, true);
  }
  await saveUser(store, from, user);
  const next = HEADS[j.day];
  const cheers = ["Wonderful", "Beautiful", "Shabaash", "Well done", "That's the spirit"];
  const milestone = j.streak === 3 ? "\n🎉 *3-day streak!* The habit is taking root." : j.streak === 7 ? "\n🌟 *7-day streak!* People who reach 7 days usually go all the way." : "";
  const body = `${cheers[j.done.length % cheers.length]}! ✅ *${h.name}* faced, Day ${j.day} complete.\n\n` +
    `${progressBar(j.done.length)}  ${j.done.length}/10\n🔥 Streak: ${j.streak} day${j.streak === 1 ? "" : "s"}${streakNote}${milestone}\n\n` +
    `👀 *Tomorrow, Day ${j.day + 1}:* ${next.tease}`;
  const options = user.remind ? [BTN.quiz, BTN.story, BTN.progress] : [BTN.remind, BTN.quiz, BTN.story];
  await sendButtons(phoneNumberId, from, { body, options });
  await remember(store, from, BTN.done, body + `\n(Options offered: ${options.join(" / ")})`);
}

async function setReminder({ phoneNumberId, from, store }, user, on) {
  user.remind = on;
  await saveUser(store, from, user);
  const body = on
    ? "🔔 Done! I'll send you a gentle nudge when your next day is ready, at most once a day. Reply *stop reminders* anytime to turn them off."
    : "🔕 Reminders off. You can always come back and tap *Next day ➡️* yourself 🙏";
  const options = user.journey && !user.journey.finished ? [BTN.quiz, BTN.story, BTN.progress] : [BTN.journey, BTN.quiz, BTN.story];
  await sendButtons(phoneNumberId, from, { body, options });
  await remember(store, from, on ? BTN.remind : "stop reminders", body);
}

async function sendComplete({ phoneNumberId, from, store }, user, justFinished = false) {
  const j = user.journey;
  const body = (justFinished ? "🏆 *You did it!* All ten heads of Ravan faced, one by one.\n\n" : "🏆 You've completed the 10-day journey!\n\n") +
    `${progressBar(10)}  10/10\n🔥 Best streak: ${j.best || j.streak} day${(j.best || j.streak) === 1 ? "" : "s"}\n\n` +
    "This is the real Vijayadashami: victory inside, not outside. Keep one practice going, and come back whenever a head rises again 🙏";
  const options = [BTN.check, "The 9 Nidhis 💎", BTN.story];
  const ok1 = await sendButtons(phoneNumberId, from, { body, options, image: cardUrl("victor") });
  if (!ok1) await sendText(phoneNumberId, from, body);
  await remember(store, from, justFinished ? BTN.done : "(Asked about the journey)", body);
}

async function showProgress({ phoneNumberId, from, store }, user, lead = "") {
  const j = user.journey;
  const parts = [];
  if (lead) parts.push(lead);
  if (j && !j.finished) {
    const today = istDate();
    const todayDone = j.done.includes(j.day);
    parts.push(`📊 *Your Defeat Ravan journey*\n${progressBar(j.done.length)}  ${j.done.length}/10\n🔥 Streak: ${j.streak} · Best: ${j.best || j.streak}`);
    parts.push(j.lessonDate === today
      ? (todayDone ? `Day ${j.day} done ✅ Day ${j.day + 1} unlocks tomorrow.` : `Today: Day ${j.day}, *${HEADS[j.day - 1].name}*. Tap Done ✅ after the challenge.`)
      : `Your next step is ready: tap *${BTN.next}* 🌅`);
  } else if (j?.finished) {
    parts.push(`🏆 Journey complete! Best streak: ${j.best || j.streak} days.`);
  } else {
    parts.push("You haven't started the 10-day *Defeat Ravan* journey yet. One head a day, ten days, real change 🔥");
  }
  if (user.check?.result?.length) parts.push(`🪞 Your top heads: ${user.check.result.map((h) => h.name).join(", ")}`);
  if (user.moods?.length) parts.push(`💛 *Recent feelings:* ${moodLine(user.moods, 7)}`);
  const slainList = user.slain || [];
  if (slainList.length || user.activeHead) {
    const act = HEAD_CHALLENGES.find((x) => x.slug === user.activeHead);
    parts.push(`👹 *Heads slain:* ${slainBar(slainList)}  ${slainList.length}/10` +
      (act ? `
⚔️ Fighting *${act.name}*: day ${(user.heads[act.slug].done || 0)}/7 done` : ""));
  }
  const body = parts.join("\n\n");
  let options;
  if (j && !j.finished) options = j.lessonDate === istDate() && !j.done.includes(j.day) ? [BTN.done, BTN.more, BTN.quiz] : [BTN.next, BTN.quiz, BTN.story];
  else options = [BTN.journey, user.check?.result ? BTN.quiz : BTN.check, BTN.story];
  await sendButtons(phoneNumberId, from, { body, options });
  await remember(store, from, BTN.progress, body);
}

// ---------- message handling ----------

function incomingText(msg) {
  if (msg.type === "text") return msg.text?.body?.trim().slice(0, 2000) || "";
  if (msg.type === "interactive") {
    const r = msg.interactive?.button_reply || msg.interactive?.list_reply;
    return (r?.title || "").trim();
  }
  if (msg.type === "button") return (msg.button?.text || "").trim(); // quick-reply from a template
  return "";
}

// Split Claude's answer into text, card, options and menu.
function parseReply(s) {
  let card = null, options = [], menu = null;
  let text = s.replace(/\[\[\s*card\s*:\s*([a-z-]+)\s*\]\]/gi, (_, slug) => {
    const k = slug.toLowerCase();
    if (!card && CARD_SLUGS.has(k)) card = k;
    return "";
  });
  text = text.replace(/\[\[\s*options\s*:([\s\S]*?)\]\]/gi, (_, list) => {
    if (!options.length) options = splitItems(list).slice(0, 3).map((o) => clip(o, 20));
    return "";
  });
  text = text.replace(/\[\[\s*menu\s*:([\s\S]*?)\]\]/gi, (_, list) => {
    const items = splitItems(list);
    if (!menu && items.length >= 2) {
      menu = { button: clip(items[0], 20), rows: items.slice(1, 11).map((t) => ({ title: clip(t, 24) })) };
    }
    return "";
  });
  if (menu && options.length) menu = null; // one kind of choice at a time; buttons win
  text = text.trim() || s.replace(/\[\[[\s\S]*?\]\]/g, "").trim();
  // De-duplicate option titles (WhatsApp rejects duplicates).
  options = [...new Set(options)].filter(Boolean);
  if (menu) menu.rows = menu.rows.filter((r, i, a) => r.title && a.findIndex((x) => x.title === r.title) === i);
  return { text, card, options, menu };
}

function splitItems(list) {
  return list.split("|").map((x) => x.trim()).filter(Boolean);
}

// Fit a title into WhatsApp's limit, counted in UTF-16 units (emojis count as 2+), never splitting an emoji.
function clip(s, n) {
  if (s.length <= n) return s;
  let out = "";
  for (const ch of s) { if (out.length + ch.length > n - 1) break; out += ch; }
  return out.trimEnd() + "…";
}

// Send one reply, combining picture, text and choices into as few messages as WhatsApp allows.
async function deliver(phoneNumberId, to, { reply, image, options, menu }) {
  reply = await trBody(reply);
  const fits = reply.length <= MAX_BODY;

  if (options.length >= 1) {
    if (fits) {
      if (await sendButtons(phoneNumberId, to, { body: reply, options, image })) return;
    } else {
      if (image) await sendImage(phoneNumberId, to, image);
      await sendText(phoneNumberId, to, reply);
      if (await sendButtons(phoneNumberId, to, { body: "What would you like next?", options })) return;
      return sendText(phoneNumberId, to, numbered(options));
    }
    // Buttons failed: fall back to picture + text with numbered choices.
    if (image) await sendImage(phoneNumberId, to, image);
    return sendText(phoneNumberId, to, reply + "\n\n" + numbered(options));
  }

  if (menu) {
    if (image) await sendImage(phoneNumberId, to, image);
    if (fits && await sendList(phoneNumberId, to, { body: reply, ...menu })) return;
    if (!fits) {
      await sendText(phoneNumberId, to, reply);
      if (await sendList(phoneNumberId, to, { body: "Tap below to choose 👇", ...menu })) return;
      return sendText(phoneNumberId, to, numbered(menu.rows.map((r) => r.title)));
    }
    return sendText(phoneNumberId, to, reply + "\n\n" + numbered(menu.rows.map((r) => r.title)));
  }

  if (image && fits) {
    if (await sendImage(phoneNumberId, to, image, reply)) return;
  } else if (image) {
    await sendImage(phoneNumberId, to, image);
  }
  return sendText(phoneNumberId, to, reply);
}

function numbered(items) {
  return items.map((t, i) => `${i + 1}. ${t}`).join("\n") + "\n\n_Reply with your choice._";
}

function cardUrl(slug) {
  const base = (process.env.CARDS_BASE_URL || process.env.URL || "https://inner-victory-guide.netlify.app").replace(/\/$/, "");
  return `${base}/cards/${slug}.jpg`;
}

// ---------- helpers ----------

function ok() { return new Response("OK", { status: 200 }); }

function verifyWebhook(req) {
  const p = new URL(req.url).searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(p.get("hub.challenge") || "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

function validSignature(raw, header) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true; // allowed during first tests; set META_APP_SECRET before going public
  if (!header) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(header), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function trimHistory(turns) {
  let t = turns.slice(-HISTORY_TURNS);
  while (t.length && t[0].role !== "user") t = t.slice(1); // Claude needs the first turn to be the user's
  return t;
}

async function askClaude(messages, person = "") {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-haiku-5-5",
      max_tokens: 600,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        ...(person ? [{ type: "text", text: `ABOUT THIS PERSON (private, from the app):\n${person}` }] : []),
        ...(isHindi() ? [{ type: "text", text: "LANGUAGE: This person has chosen Hindi. Write your whole reply in simple, warm, natural Hindi (Devanagari script), like a caring friend in India. Write [[options]] and [[menu]] choices in Hindi too (each at most 20 characters). Card tags stay as they are." }] : []),
      ],
      messages,
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  if (!text) throw new Error("Empty reply from Claude");
  return text;
}

// Convert any stray Markdown to WhatsApp formatting (*bold*, _italic_) and fit the length limit.
function toWhatsApp(s) {
  let out = s
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/^#{1,6}\s+(.*)$/gm, "*$1*")
    .replace(/^\s*[-•]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (out.length > MAX_WA_CHARS) out = out.slice(0, MAX_WA_CHARS - 1).replace(/\s+\S*$/, "") + "…";
  return out;
}

async function graphSend(phoneNumberId, payload, label) {
  try {
    const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });
    if (!res.ok) { console.error(`WhatsApp ${label} send failed:`, res.status, await res.text()); return false; }
    return true;
  } catch (e) {
    console.error(`WhatsApp ${label} send error:`, e);
    return false;
  }
}

// Every outgoing text passes through the language layer (no-op for English).
async function sendText(phoneNumberId, to, body) {
  body = await trBody(body);
  if (body.length > 4096) body = body.slice(0, 4090) + "…";
  return graphSend(phoneNumberId, { to, type: "text", text: { preview_url: false, body } }, "text");
}

async function sendImage(phoneNumberId, to, link, caption) {
  if (caption) caption = (await trBody(caption)).slice(0, MAX_BODY);
  return graphSend(phoneNumberId, { to, type: "image", image: caption ? { link, caption } : { link } }, "image");
}

async function sendButtons(phoneNumberId, to, { body, options, image }) {
  body = await trBody(body);
  const titles = [...new Set(options.slice(0, 3).map((o) => clip(trLabel(o), 20)))];
  const interactive = {
    type: "button",
    body: { text: body.slice(0, MAX_BODY) },
    action: { buttons: titles.map((title, i) => ({ type: "reply", reply: { id: `opt_${i + 1}`, title } })) },
  };
  if (image) interactive.header = { type: "image", image: { link: image } };
  return graphSend(phoneNumberId, { to, type: "interactive", interactive }, "buttons");
}

async function sendList(phoneNumberId, to, { body, button, rows }) {
  body = await trBody(body);
  const interactive = {
    type: "list",
    body: { text: body.slice(0, MAX_BODY) },
    action: {
      button: clip(trLabel(button || "Choose"), 20),
      sections: [{ title: trLabel("Choose one"), rows: rows.slice(0, 10).map((r, i) => ({ id: `row_${i + 1}`, title: clip(trLabel(r.title), 24), ...(r.description ? { description: trLabel(r.description).slice(0, 72) } : {}) })) }],
    },
  };
  return graphSend(phoneNumberId, { to, type: "interactive", interactive }, "menu");
}

async function markRead(phoneNumberId, messageId) {
  await graphSend(phoneNumberId, { status: "read", message_id: messageId }, "read");
}
