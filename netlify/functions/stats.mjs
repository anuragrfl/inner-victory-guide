// Private usage page for the owner: who is using the bot and how much.
// Open https://inner-victory-guide.netlify.app/stats?key=<WHATSAPP_VERIFY_TOKEN>
// Shows names, masked numbers and activity only — never message contents.

import { getStore } from "@netlify/blobs";

const IST = 5.5 * 3600 * 1000;
const fmt = (ms) => (ms ? new Date(ms + IST).toISOString().slice(0, 16).replace("T", " ") : "—");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export default async (req) => {
  const key = new URL(req.url).searchParams.get("key");
  if (!key || key !== process.env.WHATSAPP_VERIFY_TOKEN) return new Response("Not found", { status: 404 });

  const store = getStore("inner-victory-whatsapp");
  const { blobs } = await store.list({ prefix: "user/" });
  const people = [];
  for (const { key: k } of blobs) {
    let u; try { u = await store.get(k, { type: "json" }); } catch { continue; }
    if (!u) continue;
    const num = k.slice(5);
    people.push({
      name: u.name || "", num: num.length > 6 ? `+${num.slice(0, 2)} ••••• ${num.slice(-4)}` : num,
      first: u.firstAt || u.lastInAt, last: u.lastInAt, msgs: u.msgs || 0, lang: u.lang === "hi" ? "हिंदी" : "English",
      med: u.meditations || 0, slain: (u.slain || []).length, journey: u.journey ? (u.journey.finished ? "done" : `day ${u.journey.day}`) : "",
      check: u.check?.result ? "✓" : "", quiz: u.quizStats?.played || 0, moods: (u.moods || []).length,
    });
  }
  people.sort((a, b) => (b.last || 0) - (a.last || 0));
  const now = Date.now(), day = 86400000;
  const active1 = people.filter((p) => now - (p.last || 0) < day).length;
  const active7 = people.filter((p) => now - (p.last || 0) < 7 * day).length;
  const new1 = people.filter((p) => now - (p.first || 0) < day).length;

  const rows = people.map((p) => `<tr><td>${esc(p.name) || "<i>—</i>"}</td><td>${esc(p.num)}</td><td>${fmt(p.first)}</td><td>${fmt(p.last)}</td><td>${p.msgs}</td><td>${p.lang}</td><td>${p.med}</td><td>${p.moods}</td><td>${p.quiz}</td><td>${p.check}</td><td>${esc(p.journey)}</td><td>${p.slain}</td></tr>`).join("");
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inner Victory Guide · Users</title>
<style>body{font-family:system-ui,sans-serif;margin:16px;background:#fbf7f0;color:#2b2118}h1{font-size:20px}.k{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}.k div{background:#fff;border:1px solid #e8dccb;border-radius:10px;padding:10px 14px}.k b{display:block;font-size:22px}
.w{overflow-x:auto}table{border-collapse:collapse;background:#fff;font-size:13px;min-width:820px}th,td{border-bottom:1px solid #eee;padding:7px 9px;text-align:left;white-space:nowrap}th{background:#f3e9da}p{color:#7a6a58;font-size:12px}</style>
<h1>🪔 Inner Victory Guide · Users</h1>
<div class="k"><div><b>${people.length}</b>people total</div><div><b>${new1}</b>new in 24h</div><div><b>${active1}</b>active in 24h</div><div><b>${active7}</b>active in 7 days</div></div>
<div class="w"><table><tr><th>Name</th><th>Number</th><th>First message</th><th>Last active</th><th>Msgs</th><th>Language</th><th>Meditations</th><th>Feelings</th><th>Quizzes</th><th>Ravan check</th><th>Journey</th><th>Heads slain</th></tr>${rows}</table></div>
<p>Times in IST. Message counts start from 21 Oct 2026. Only people who messaged the bot appear here; WhatsApp doesn't tell anyone who merely opened a link.</p>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
};

export const config = { path: "/stats" };
