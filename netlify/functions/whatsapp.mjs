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
    { title: "Quiz me 🎯", description: "A quick 3-question quiz" },
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
      options: ["Ravan's 10 heads", "The 9 Devis", "Quiz me 🎯"],
    });
    return ok();
  }

  const historyKey = `chat/${from}`;

  if (/^(reset|restart|start over)$/i.test(text)) {
    await store.delete(historyKey);
    await sendButtons(phoneNumberId, from, {
      body: "Fresh start 🌸 Where shall we begin?",
      options: ["Ravan's 10 heads", "The 9 Devis", "Quiz me 🎯"],
      image: cardUrl("mandala"),
    });
    return ok();
  }

  if (/^(menu|options|topics)$/i.test(text)) {
    await sendList(phoneNumberId, from, { body: "Here's everything we can explore together. Tap *Explore* and pick one 👇", ...MAIN_MENU });
    return ok();
  }

  let history = [];
  let lastCard = null;
  try {
    const saved = await store.get(historyKey, { type: "json" });
    if (saved && Date.now() - (saved.at || 0) < HISTORY_TTL_MS) { history = saved.turns || []; lastCard = saved.lastCard || null; }
  } catch { history = []; }

  // Give Claude the WhatsApp display name on a new conversation, so the greeting can feel personal.
  const userTurn = history.length === 0 && profileName
    ? `[WhatsApp name: ${profileName.slice(0, 40)}]\n${text}`
    : text;
  const messages = trimHistory([...history, { role: "user", content: userTurn }]);

  let answer;
  try {
    answer = await askClaude(messages);
  } catch (err) {
    console.error("Claude error:", err);
    await sendText(phoneNumberId, from, "Sorry, I couldn't answer just now 🙏 Please send your message again in a minute.");
    return ok();
  }

  const parsed = parseReply(answer);
  const reply = toWhatsApp(parsed.text);
  const image = parsed.card && parsed.card !== lastCard ? cardUrl(parsed.card) : null;

  await deliver(phoneNumberId, from, { reply, image, options: parsed.options, menu: parsed.menu });

  // Remember what we offered, so a tap on a button makes sense to Claude next turn.
  const offered = parsed.options.length ? `\n(Options offered: ${parsed.options.join(" / ")})`
    : parsed.menu ? `\n(Menu offered: ${parsed.menu.rows.map((r) => r.title).join(" / ")})` : "";
  await store.setJSON(historyKey, {
    at: Date.now(),
    lastCard: parsed.card || lastCard,
    turns: trimHistory([...messages, { role: "assistant", content: reply + offered }]),
  });
  return ok();
};

export const config = { path: "/whatsapp" };

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

async function askClaude(messages) {
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
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
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
