// Hourly reminder for people on the 10-day journey who tapped "Remind me 🔔".
//
// WhatsApp only allows free-form messages within 24 hours of the person's last message
// (and those count as low-cost service messages, not marketing). So we nudge once,
// 20–23 hours after their last message, only if their next day is ready, and only
// during friendly hours in India.

import { getStore } from "@netlify/blobs";
import { HEADS, BTN, istDate } from "../../lib/flows.mjs";
import { HEAD_CHALLENGES } from "../../lib/challenges.mjs";

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION || "v25.0"}`;
const H = 3600 * 1000;

export default async () => {
  const now = Date.now();
  const istHour = new Date(now + 5.5 * H).getUTCHours();
  if (istHour < 7 || istHour >= 21) return new Response("Quiet hours");

  const store = getStore("inner-victory-whatsapp");
  let sent = 0, checked = 0;
  const { blobs } = await store.list({ prefix: "user/" });
  for (const { key } of blobs) {
    checked++;
    let user;
    try { user = await store.get(key, { type: "json" }); } catch { continue; }
    if (!user?.remind || !user.pn || !user.lastInAt) continue;
    const since = now - user.lastInAt;
    if (since < 20 * H || since > 23 * H) continue;          // inside the free window, near its end
    if (user.nudgedAt && user.nudgedAt > user.lastInAt) continue; // once per window

    const today = istDate(now);
    let body = null, options = null;
    const j = user.journey;
    if (j && !j.finished && j.day) {
      const todayDone = j.done.includes(j.day);
      if (j.lessonDate !== today && todayDone && HEADS[j.day]) {
        const next = HEADS[j.day];
        body = `🌅 Good day! *Day ${j.day + 1}: ${next.name}* is ready for you.\n\n👀 ${next.tease}\n\nTap below when you have 2 minutes 🙏`;
        options = [BTN.next, BTN.quiz];
      } else if (!todayDone) {
        body = `🙏 A gentle nudge: today's small challenge for *${HEADS[j.day - 1].name}* is waiting.\n\nTry it, then tap *Done ✅*. Even one minute counts.`;
        options = [BTN.done, BTN.next];
      }
    }
    const h = !body && user.activeHead && HEAD_CHALLENGES.find((x) => x.slug === user.activeHead);
    if (h) {
      const st = user.heads?.[h.slug] || { done: 0 };
      if (st.lastDoneDate && st.lastDoneDate !== today) {
        body = `⚔️ Day ${st.done + 1}/7 against *${h.name}* is ready.\n\nYour mind may say it can wait. That's ${h.name} talking 😉`;
        options = [BTN.killNext, BTN.mind];
      } else if (st.taskDate && st.taskDate !== st.lastDoneDate && st.lastDoneDate !== today) {
        body = `⚔️ Your task against *${h.name}* is still waiting. Try it, then tap *Done ⚔️*.`;
        options = [BTN.killDone, BTN.mind];
      }
    }
    if (!body) continue;

    const to = key.slice("user/".length);
    const ok = await sendButtons(user.pn, to, body, options);
    user.nudgedAt = now;
    await store.setJSON(key, user);
    if (ok) sent++;
  }
  console.log(`Nudge run: checked ${checked}, sent ${sent}`);
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
        interactive: { type: "button", body: { text: body }, action: { buttons: options.map((title, i) => ({ type: "reply", reply: { id: `nudge_${i}`, title } })) } },
      }),
    });
    if (!res.ok) { console.error("Nudge send failed:", res.status, await res.text()); return false; }
    return true;
  } catch (e) {
    console.error("Nudge send error:", e);
    return false;
  }
}
