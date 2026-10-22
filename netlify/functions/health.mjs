// Every 10 minutes: check that the bot can talk to WhatsApp. Alert the owner's phone when it can't,
// and when it works again, answer any messages that were left unanswered (within WhatsApp's 24h window).

import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
import { incident, resolved } from "../../lib/health.mjs";

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION || "v25.0"}`;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || "1399451136580159";

export default async () => {
  const store = getStore("inner-victory-whatsapp");
  let ok = false, detail = "";
  try {
    const r = await fetch(`${GRAPH}/${PHONE_ID}?fields=verified_name,quality_rating`, { headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } });
    ok = r.ok;
    if (!ok) detail = `${r.status} ${(await r.text()).slice(0, 200)}`;
  } catch (e) { detail = String(e?.message || e); }

  if (!ok) {
    await incident("whatsapp", detail);
    return new Response("whatsapp: down");
  }

  // WhatsApp works: answer anything that was left waiting.
  const { blobs } = await store.list({ prefix: "pending/" });
  let answered = 0, expired = 0;
  for (const { key } of blobs) {
    let p; try { p = await store.get(key, { type: "json" }); } catch { p = null; }
    await store.delete(key);
    if (!p) continue;
    if (Date.now() - p.at > 23 * 3600 * 1000) { expired++; continue; }
    const body = JSON.stringify({ entry: [{ changes: [{ value: {
      metadata: { phone_number_id: p.pn || PHONE_ID },
      messages: [{ id: `retry-${p.from}-${p.at}`, from: p.from, type: "text", text: { body: p.text } }],
    } }] }] });
    const sig = "sha256=" + crypto.createHmac("sha256", process.env.META_APP_SECRET || "").update(body).digest("hex");
    try {
      const r = await fetch(`${(process.env.URL || "https://inner-victory-guide.netlify.app").replace(/\/$/, "")}/whatsapp`, {
        method: "POST", headers: { "content-type": "application/json", "x-hub-signature-256": sig }, body,
      });
      if (r.ok) answered++;
    } catch (e) { console.error("retry failed", e?.message); }
  }
  await resolved("whatsapp", answered ? `Answered ${answered} waiting message(s) automatically.` : "");
  console.log(`health ok; answered ${answered}, expired ${expired}`);
  return new Response(`ok; answered ${answered}`);
};

export const config = { schedule: "*/10 * * * *" };
