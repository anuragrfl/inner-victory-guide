// Every evening at 8:30 PM IST: a short activity report pushed to the owner's phone (ntfy).
import { getStore } from "@netlify/blobs";
import { notify } from "../../lib/health.mjs";

const IST = 5.5 * 3600 * 1000;
const dayStartIST = () => { const n = new Date(Date.now() + IST); n.setUTCHours(0, 0, 0, 0); return n.getTime() - IST; };

export default async () => {
  const store = getStore("inner-victory-whatsapp");
  const { blobs } = await store.list({ prefix: "user/" });
  const start = dayStartIST();
  let total = 0, active = [], fresh = 0, back = 0, meds = 0;
  for (const { key } of blobs) {
    let u; try { u = await store.get(key, { type: "json" }); } catch { continue; }
    if (!u) continue;
    total++;
    if ((u.lastInAt || 0) >= start) {
      const isNew = (u.firstAt || u.lastInAt) >= start;
      isNew ? fresh++ : back++;
      active.push(`${isNew ? "🆕" : "🔁"} ${(u.name || "…" + key.slice(-4)).slice(0, 24)} (${u.msgs || 0})`);
      meds += u.lastMeditation?.at >= start ? 1 : 0;
    }
  }
  const body = `Today: ${active.length} people (${back} returning, ${fresh} new) · ${meds} meditated\nTotal since launch: ${total}\n\n${active.slice(0, 20).join("\n") || "No chats today yet."}`;
  await notify("🪔 Inner Victory · today's activity", body, { priority: "default", tags: "bar_chart" });
  return new Response(body);
};

export const config = { schedule: "0 15 * * *" }; // 15:00 UTC = 8:30 PM IST
