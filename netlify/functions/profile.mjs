// Private owner tool: set the bot's WhatsApp profile (photo, about, description, website).
// POST /admin/profile?key=<WHATSAPP_VERIFY_TOKEN>
// body: {"phone_number_id":"…","app_id":"…","image_url":"…","about":"…","description":"…","websites":["…"]}

const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION || "v25.0"}`;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  const key = new URL(req.url).searchParams.get("key");
  if (!key || key !== process.env.WHATSAPP_VERIFY_TOKEN) return new Response("Not found", { status: 404 });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const token = process.env.WHATSAPP_TOKEN;
  const b = await req.json();
  const out = {};
  let handle = null;

  if (b.image_url) {
    const img = await fetch(b.image_url);
    if (!img.ok) return json({ error: "could not fetch image", status: img.status }, 400);
    const bytes = new Uint8Array(await img.arrayBuffer());
    // 1. start a resumable upload session
    const s = await fetch(`${GRAPH}/${b.app_id}/uploads?file_name=profile.jpg&file_length=${bytes.length}&file_type=image/jpeg&access_token=${token}`, { method: "POST" });
    const sj = await s.json();
    out.session = sj;
    if (!sj.id) return json({ error: "upload session failed", out }, 502);
    // 2. upload the bytes
    const u = await fetch(`${GRAPH}/${sj.id}`, { method: "POST", headers: { authorization: `OAuth ${token}`, file_offset: "0" }, body: bytes });
    const uj = await u.json();
    out.upload = uj;
    handle = uj.h;
    if (!handle) return json({ error: "upload failed", out }, 502);
  }

  // 3. update the business profile
  const profile = { messaging_product: "whatsapp" };
  if (handle) profile.profile_picture_handle = handle;
  for (const k of ["about", "description", "websites", "vertical", "email", "address"]) if (b[k]) profile[k] = b[k];
  const p = await fetch(`${GRAPH}/${b.phone_number_id}/whatsapp_business_profile`, {
    method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(profile),
  });
  out.profile = { status: p.status, body: await p.json().catch(() => null) };
  // read back
  const r = await fetch(`${GRAPH}/${b.phone_number_id}/whatsapp_business_profile?fields=about,description,websites,vertical,profile_picture_url`, { headers: { authorization: `Bearer ${token}` } });
  out.now = await r.json().catch(() => null);
  return json(out, p.ok ? 200 : 502);
};

export const config = { path: "/admin/profile" };
