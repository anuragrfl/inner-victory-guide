// Private owner tool: send one message from the bot to someone who wrote in the last 24 hours.
// POST /admin/send?key=<WHATSAPP_VERIFY_TOKEN>  body: {"last4":"7218","body":"…","options":["…"]}
// WhatsApp only allows free-form messages inside the 24-hour window, so older chats are refused.

import { getStore } from "@netlify/blobs";

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION || "v25.0"}`;

export default async (req) => {
  const key = new URL(req.url).searchParams.get("key");
  if (!key || key !== process.env.WHATSAPP_VERIFY_TOKEN) return new Response("Not found", { status: 404 });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let input; try { input = await req.json(); } catch { return json({ error: "bad JSON" }, 400); }
  const { last4, body, options = [] } = input || {};
  if (!/^\d{4}$/.test(last4 || "") || !body) return json({ error: "need last4 (4 digits) and body" }, 400);

  const store = getStore("inner-victory-whatsapp");
  const { blobs } = await store.list({ prefix: "user/" });
  const matches = blobs.map((b) => b.key).filter((k) => k.endsWith(last4));
  if (matches.length !== 1) return json({ error: `${matches.length} people match ${last4}` }, 400);
  const userKey = matches[0], to = userKey.slice(5);
  const user = await store.get(userKey, { type: "json" });
  if (!user?.pn || !user.lastInAt) return json({ error: "no phone number id on record" }, 400);
  const ageH = (Date.now() - user.lastInAt) / 3600000;
  if (ageH > 23.5) return json({ error: `last message ${ageH.toFixed(1)}h ago: outside WhatsApp's 24h window` }, 400);

  const payload = options.length
    ? { to, type: "interactive", interactive: { type: "button", body: { text: body.slice(0, 1024) },
        action: { buttons: options.slice(0, 3).map((title, i) => ({ type: "reply", reply: { id: `owner_${i}`, title: title.slice(0, 20) } })) } } }
    : { to, type: "text", text: { preview_url: false, body } };
  const res = await fetch(`${GRAPH}/${user.pn}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  const result = await res.text();
  if (!res.ok) return json({ error: "WhatsApp refused", status: res.status, result }, 502);

  // Add it to the conversation history so the guide knows what was said.
  try {
    const chat = (await store.get(`chat/${to}`, { type: "json" })) || { turns: [] };
    const turns = [...(chat.turns || [])];
    const note = body + (options.length ? `\n(Options offered: ${options.join(" / ")})` : "");
    if (turns.length && turns.at(-1).role === "assistant") turns[turns.length - 1] = { role: "assistant", content: turns.at(-1).content + "\n\n" + note };
    else if (turns.length) turns.push({ role: "assistant", content: note });
    await store.setJSON(`chat/${to}`, { ...chat, at: Date.now(), turns });
  } catch {}
  console.log(`Owner message sent to …${last4}`);
  return json({ ok: true, to: `…${last4}`, name: user.name || null });
};

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

export const config = { path: "/admin/send" };
