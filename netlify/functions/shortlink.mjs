// Private owner tool: create a WhatsApp short link (wa.me/message/…) that hides the number.
// POST /admin/shortlink?key=<WHATSAPP_VERIFY_TOKEN>  body: {"phone_number_id":"…","message":"Jai Mata Di"}
const GRAPH = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION || "v25.0"}`;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });

export default async (req) => {
  const key = new URL(req.url).searchParams.get("key");
  if (!key || key !== process.env.WHATSAPP_VERIFY_TOKEN) return new Response("Not found", { status: 404 });
  const b = req.method === "POST" ? await req.json() : {};
  const pid = b.phone_number_id;
  const headers = { "content-type": "application/json", authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };
  if (b.message) {
    const r = await fetch(`${GRAPH}/${pid}/message_qrdls`, { method: "POST", headers, body: JSON.stringify({ prefilled_message: b.message, generate_qr_image: "PNG" }) });
    const j = await r.json();
    return json({ code: j.code, link: j.deep_link_url, message: j.prefilled_message, error: j.error?.message }, r.ok ? 200 : 502);
  }
  const r = await fetch(`${GRAPH}/${pid}/message_qrdls`, { headers });
  const j = await r.json();
  return json({ links: (j.data || []).map((x) => ({ code: x.code, link: x.deep_link_url, message: x.prefilled_message })), error: j.error?.message });
};

export const config = { path: "/admin/shortlink" };
