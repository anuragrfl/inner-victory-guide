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
import { QUIZ_LEN, QUIZ_TOPICS, topicFromText, pickQuestions, presentQuestion, matchOption, quizVerdict } from "../../lib/quiz.mjs";
import { QUIZ_BANK } from "../../lib/quizbank.mjs";
import { HEADS, BTN, detectCommand, scoreAnswer, istDate, daysBetween, weekId, progressBar, topHeads, personContext } from "../../lib/flows.mjs";

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION || "v25.0"}`;
const HISTORY_TURNS = 16;                          // remembered messages per person (user + bot)
const HISTORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;    // forget a conversation after 7 days of silence
const MAX_WA_CHARS = 3900;                          // WhatsApp text limit is 4096
const MAX_BODY = 1024;                              // interactive message body / image caption limit

// Fixed menu anyone can open by typing "menu".
const MAIN_MENU = {
  button: "Explore 🪔",
  rows: [
    { title: "Ravan's 10 heads 🔥", description: "The ten negatives inside every human" },
    { title: "The 9 Devis 🌸", description: "Navratri: root to crown, one quality a night" },
    { title: "The 9 Nidhis 💎", description: "Inner treasures that make life rich" },
    { title: "The 8 Siddhis ✨", description: "Inner powers, used for good" },
    { title: "10-day journey 🔥", description: "Defeat Ravan: one head a day, with streaks" },
    { title: "Inner Ravan check 🪞", description: "10 quick questions: find your top 3 heads" },
    { title: "Quiz me 🎯", description: "3 quick questions, mixed topics" },
    { title: "Today's challenge 💪", description: "One tiny practice for today" },
    { title: "Tell me a story 📖", description: "A short story with a lesson" },
  ],
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

  const text = incomingText(msg);
  if (!text) {
    await sendButtons(phoneNumberId, from, {
      body: "I can only read text for now 🙏 Tap a button or type your question about the Devis, Nidhis, Siddhis or Ravan's 10 heads.",
      options: [BTN.check, BTN.journey, BTN.quiz],
    });
    return ok();
  }

  const ctx = { phoneNumberId, from, store, profileName };
  const user = await loadUser(store, from);
  user.lastInAt = Date.now();
  user.pn = phoneNumberId;
  await saveUser(store, from, user);
  const cmd = detectCommand(text);

  if (cmd === "reset") {
    await store.delete(`chat/${from}`);
    if (user.check && !user.check.result) { delete user.check; await saveUser(store, from, user); }
    await sendButtons(phoneNumberId, from, {
      body: "Fresh start 🌸 Where shall we begin?",
      options: [BTN.check, BTN.journey, BTN.quiz],
      image: cardUrl("mandala"),
    });
    return ok();
  }

  if (cmd === "menu") {
    await sendList(phoneNumberId, from, { body: "Here's everything we can explore together. Tap *Explore* and pick one 👇", ...MAIN_MENU });
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
    await answerQuiz(ctx, user, text);
    return ok();
  }

  switch (cmd) {
    case "quiz": await startQuiz(ctx, user, text); return ok();
    case "check": await startCheck(ctx, user); return ok();
    case "journey_start": await journeyStart(ctx, user, text); return ok();
    case "journey_restart": delete user.journey; await journeyStart(ctx, user, text); return ok();
    case "journey_next": await journeyNext(ctx, user, text, false); return ok();
    case "journey_skip": await journeyNext(ctx, user, text, true); return ok();
    case "journey_done":
      if (user.journey && !user.journey.finished) { await journeyDone(ctx, user); return ok(); }
      break; // "done" outside a journey: let the guide reply normally
    case "progress": await showProgress(ctx, user); return ok();
    case "remind_on": await setReminder(ctx, user, true); return ok();
    case "remind_off": await setReminder(ctx, user, false); return ok();
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

// ---------- Inner Ravan self-check ----------

async function startCheck(ctx, user) {
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
      await sendButtons(ctx.phoneNumberId, ctx.from, {
        body: `Just tap one of the buttons 🙂 (or type *stop* to leave the check)\n\n*${user.check.step + 1}/10*  ${HEADS[user.check.step].q}`,
        options: [BTN.often, BTN.sometimes, BTN.rarely],
      });
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
    options = [`Help with ${top[0].name}`.slice(0, 20), BTN.journey, BTN.quiz];
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

function sendText(phoneNumberId, to, body) {
  return graphSend(phoneNumberId, { to, type: "text", text: { preview_url: false, body } }, "text");
}

function sendImage(phoneNumberId, to, link, caption) {
  return graphSend(phoneNumberId, { to, type: "image", image: caption ? { link, caption } : { link } }, "image");
}

function sendButtons(phoneNumberId, to, { body, options, image }) {
  const interactive = {
    type: "button",
    body: { text: body.slice(0, MAX_BODY) },
    action: { buttons: options.slice(0, 3).map((title, i) => ({ type: "reply", reply: { id: `opt_${i + 1}`, title } })) },
  };
  if (image) interactive.header = { type: "image", image: { link: image } };
  return graphSend(phoneNumberId, { to, type: "interactive", interactive }, "buttons");
}

function sendList(phoneNumberId, to, { body, button, rows }) {
  const interactive = {
    type: "list",
    body: { text: body.slice(0, MAX_BODY) },
    action: {
      button: button || "Choose",
      sections: [{ title: "Choose one", rows: rows.slice(0, 10).map((r, i) => ({ id: `row_${i + 1}`, title: r.title, ...(r.description ? { description: r.description.slice(0, 72) } : {}) })) }],
    },
  };
  return graphSend(phoneNumberId, { to, type: "interactive", interactive }, "menu");
}

async function markRead(phoneNumberId, messageId) {
  await graphSend(phoneNumberId, { status: "read", message_id: messageId }, "read");
}
