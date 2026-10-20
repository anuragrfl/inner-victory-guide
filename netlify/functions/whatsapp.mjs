// Inner Victory Guide — WhatsApp bot (Meta WhatsApp Cloud API + Claude API) on Netlify Functions.
//
// GET  /whatsapp  → Meta webhook verification (hub.challenge handshake)
// POST /whatsapp  → incoming WhatsApp messages; replies with a Claude answer
//
// Environment variables (set in Netlify → Site configuration → Environment variables):
//   ANTHROPIC_API_KEY        Claude API key (console.anthropic.com)
//   WHATSAPP_TOKEN           Meta access token (System User permanent token)
//   WHATSAPP_VERIFY_TOKEN    Any secret phrase you choose; must match the one typed in Meta's webhook form
//   META_APP_SECRET          Meta App → Settings → Basic → App secret (used to verify messages really come from Meta)
//   CLAUDE_MODEL             Optional. Defaults to claude-haiku-5-5 (fast and low cost)
//   GRAPH_API_VERSION        Optional. Defaults to v25.0

import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
import { SYSTEM_PROMPT, CARD_SLUGS } from "../../lib/knowledge.mjs";

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION || "v25.0"}`;
const HISTORY_TURNS = 10;        // remembered messages per person (user + bot)
const HISTORY_TTL_MS = 6 * 60 * 60 * 1000; // forget a conversation after 6 hours of silence
const MAX_WA_CHARS = 3900;       // WhatsApp text limit is 4096

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
  const store = getStore("inner-victory-whatsapp");

  // Meta retries a webhook it thinks failed; answer each message only once.
  const seenKey = `seen/${msg.id}`;
  if (await store.get(seenKey)) return ok();
  await store.set(seenKey, String(Date.now()));

  markRead(phoneNumberId, msg.id).catch(() => {});

  if (msg.type !== "text" || !msg.text?.body?.trim()) {
    await sendText(phoneNumberId, from,
      "Please send your question as a text message. You can ask about the 9 Devis and chakras, the 8 Siddhis, the 9 Nidhis or Ravan's 10 heads.");
    return ok();
  }

  const text = msg.text.body.trim().slice(0, 2000);
  const historyKey = `chat/${from}`;

  if (/^(reset|restart|new|start over)$/i.test(text)) {
    await store.delete(historyKey);
    await sendText(phoneNumberId, from, "Fresh start. Ask me anything about Navratri, the Devis, the Nidhis, the Siddhis or the ten vices.");
    return ok();
  }

  let history = [];
  let lastCard = null;
  try {
    const saved = await store.get(historyKey, { type: "json" });
    if (saved && Date.now() - (saved.at || 0) < HISTORY_TTL_MS) { history = saved.turns || []; lastCard = saved.lastCard || null; }
  } catch { history = []; }

  const messages = trimHistory([...history, { role: "user", content: text }]);

  let answer;
  try {
    answer = await askClaude(messages);
  } catch (err) {
    console.error("Claude error:", err);
    await sendText(phoneNumberId, from, "Sorry, I couldn't answer just now. Please send your question again in a minute.");
    return ok();
  }

  // Pull out the [[card:slug]] tag Claude adds, send that picture first, then the text.
  const { text: replyText, card } = extractCard(answer);
  const reply = toWhatsApp(replyText);
  const link = card && card !== lastCard ? `${siteUrl()}/cards/${card}.jpg` : null;
  if (link && reply.length <= 1000) {
    // Picture and answer arrive together as one message (WhatsApp captions allow up to 1024 characters).
    const sent = await sendImage(phoneNumberId, from, link, reply);
    if (!sent) await sendText(phoneNumberId, from, reply);
  } else {
    if (link) await sendImage(phoneNumberId, from, link);
    await sendText(phoneNumberId, from, reply);
  }
  await store.setJSON(historyKey, { at: Date.now(), lastCard: card || lastCard, turns: trimHistory([...messages, { role: "assistant", content: reply }]) });
  return ok();
};

export const config = { path: "/whatsapp" };

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
      max_tokens: 700,
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

function extractCard(s) {
  let card = null;
  const text = s.replace(/\[\[\s*card\s*:\s*([a-z-]+)\s*\]\]/gi, (_, slug) => {
    const k = slug.toLowerCase();
    if (!card && CARD_SLUGS.has(k)) card = k;
    return "";
  }).trim();
  return { text: text || s.trim(), card };
}

function siteUrl() {
  return (process.env.CARDS_BASE_URL || process.env.URL || "https://inner-victory-guide.netlify.app").replace(/\/$/, "");
}

async function sendImage(phoneNumberId, to, link, caption) {
  try {
    const image = caption ? { link, caption } : { link };
    const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "image", image }),
    });
    if (!res.ok) { console.error("WhatsApp image send failed:", res.status, await res.text()); return false; }
    return true;
  } catch (e) {
    console.error("WhatsApp image send error:", e);
    return false;
  }
}

// Convert any stray Markdown to WhatsApp formatting (*bold*, _italic_) and fit the length limit.
function toWhatsApp(s) {
  let out = s
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/^#{1,6}\s+(.*)$/gm, "*$1*")
    .replace(/^\s*[-•]\s+/gm, "• ");
  if (out.length > MAX_WA_CHARS) out = out.slice(0, MAX_WA_CHARS - 1).replace(/\s+\S*$/, "") + "…";
  return out;
}

async function sendText(phoneNumberId, to, body) {
  const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body } }),
  });
  if (!res.ok) console.error("WhatsApp send failed:", res.status, await res.text());
}

async function markRead(phoneNumberId, messageId) {
  await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
  });
}
