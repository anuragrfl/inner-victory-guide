// "9 Nidhis, one a day": each morning's treasure goes to everyone still inside WhatsApp's free
// 24-hour window. Runs hourly from 8 AM to 8 PM IST so people whose window opens later still get
// it, but each person gets it at most once a day, never while they're mid-chat, never outside the window.
// Free: these are service messages inside the window, no paid templates.

import { getStore } from "@netlify/blobs";
import { BTN, istDate } from "../../lib/flows.mjs";
import { NIDHI_SERIES, seriesIndex } from "../../lib/nidhi-series.mjs";
import { setLang, trLabel } from "../../lib/i18n.mjs";

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION || "v25.0"}`;
const H = 3600 * 1000;

export default async () => {
  const now = Date.now();
  const istHour = new Date(now + 5.5 * H).getUTCHours();
  if (istHour < 8 || istHour > 20) return new Response("Quiet hours");
  const idx = seriesIndex(now);
  if (idx < 0) return new Response("No series today");
  const item = NIDHI_SERIES[idx];
  const today = istDate(now);

  const store = getStore("inner-victory-whatsapp");
  const { blobs } = await store.list({ prefix: "user/" });
  let sent = 0;
  for (const { key } of blobs) {
    let user;
    try { user = await store.get(key, { type: "json" }); } catch { continue; }
    if (!user?.pn || !user.lastInAt || user.seriesDate === today) continue;
    const since = now - user.lastInAt;
    if (since > 23 * H) continue;            // outside the free window
    if (since < 30 * 60 * 1000) continue;     // they're chatting right now; try next hour
    if (user.optOut) continue;

    const to = key.slice("user/".length);
    setLang(user.lang);
    const hi = user.lang === "hi";
    const body = hi ? item.hi : item.en;
    const options = [item.deeper, item.extra || "Did you know? 💡", item.extra ? "Did you know? 💡" : BTN.talk].map(trLabel);
    const ok = await sendButtons(user.pn, to, body, options);
    if (!ok) continue;
    sent++;
    user.seriesDate = today;
    await store.setJSON(key, user);
    try {
      const chat = (await store.get(`chat/${to}`, { type: "json" })) || { turns: [] };
      const turns = [...(chat.turns || [])];
      const note = `${body}\n(Options offered: ${options.join(" / ")})`;
      if (turns.length && turns.at(-1).role === "assistant") turns[turns.length - 1] = { role: "assistant", content: turns.at(-1).content + "\n\n" + note };
      else if (turns.length) turns.push({ role: "assistant", content: note });
      if (turns.length) await store.setJSON(`chat/${to}`, { ...chat, at: now, turns });
    } catch {}
  }
  console.log(`Morning series day ${idx + 1} (${item.slug}): sent ${sent}`);
  return new Response(`sent ${sent}`);
};

export const config = { schedule: "@hourly" };

async function sendButtons(phoneNumberId, to, body, options) {
  try {
    const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
      body: JSON.stringify({
        messaging_product: "whatsapp", to, type: "interactive",
        interactive: { type: "button", body: { text: body.slice(0, 1024) },
          action: { buttons: options.map((title, i) => ({ type: "reply", reply: { id: `series_${i}`, title: title.slice(0, 20) } })) } },
      }),
    });
    if (!res.ok) console.error("Series send failed", res.status, await res.text());
    return res.ok;
  } catch (e) { console.error("Series send error", e?.message); return false; }
}
