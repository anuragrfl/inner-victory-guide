// Health watch: phone alerts (ntfy) when the bot can't reply, and a queue of unanswered messages
// that health.mjs answers automatically once WhatsApp works again.

import { getStore } from "@netlify/blobs";

export const NTFY_TOPIC = process.env.NTFY_TOPIC || "inner-victory-krish-7q2m9x";
const store = () => getStore("inner-victory-whatsapp");

// Send a push notification to the owner's phone (ntfy app, subscribed to NTFY_TOPIC).
export async function notify(title, message, { priority = "high", tags = "warning" } = {}) {
  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: "POST",
      headers: { Title: title, Priority: priority, Tags: tags },
      body: message,
    });
  } catch (e) { console.error("notify failed", e?.message); }
}

// Record a problem; alert at most once per kind every 3 hours.
export async function incident(kind, detail) {
  const s = store();
  let st = {};
  try { st = (await s.get("health/state", { type: "json" })) || {}; } catch {}
  const k = st[kind] || {};
  const now = Date.now();
  const first = !k.since;
  st[kind] = { since: k.since || now, last: now, detail: String(detail).slice(0, 300), notifiedAt: k.notifiedAt || 0, count: (k.count || 0) + 1 };
  if (now - (k.notifiedAt || 0) > 3 * 3600 * 1000) {
    st[kind].notifiedAt = now;
    const help = kind === "whatsapp"
      ? (/blocked|190|session|logged out|token/i.test(detail)
        ? "Meta has blocked or logged out the bot's access. Open developers.facebook.com in Chrome; if it asks to confirm your account, do it. Unanswered messages will be answered automatically once it's fixed."
        : "WhatsApp is refusing the bot's replies. I'll keep retrying and answer waiting messages automatically.")
      : "The AI isn't answering; people are getting the warm ready-made reply instead. Check the Anthropic account (credit balance or limit).";
    await notify(kind === "whatsapp" ? "🔴 Bot can't reply on WhatsApp" : "🟠 Bot's AI not answering", `${help}\n\nDetail: ${st[kind].detail}${first ? "" : `\n(${st[kind].count} times so far)`}`);
  }
  try { await s.setJSON("health/state", st); } catch {}
}

// Clear a problem; tell the owner it recovered.
export async function resolved(kind, extra = "") {
  const s = store();
  let st = {};
  try { st = (await s.get("health/state", { type: "json" })) || {}; } catch {}
  if (!st[kind]?.since) return;
  const mins = Math.round((Date.now() - st[kind].since) / 60000);
  delete st[kind];
  try { await s.setJSON("health/state", st); } catch {}
  await notify(kind === "whatsapp" ? "🟢 Bot is replying again" : "🟢 Bot's AI is back", `Recovered after about ${mins} min. ${extra}`.trim(), { priority: "default", tags: "white_check_mark" });
}

export async function queueUnanswered(from, text, pn) {
  try { await store().setJSON(`pending/${from}`, { from, text: String(text).slice(0, 1000), pn, at: Date.now() }); } catch {}
}
