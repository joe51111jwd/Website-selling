// Receives "Bring me a deal" submissions. For now it logs them (visible in Vercel runtime logs).
// Next step: forward to Andrew's inbox or CRM once he picks where deals should land.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { name = "", email = "", what = "" } = req.body || {};
  if (!name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !what.trim()) {
    return res.status(400).json({ error: "Name, a valid email and one line about what you're building are required." });
  }
  console.log("PITCH", JSON.stringify({ name: name.slice(0, 120), email: email.slice(0, 200), what: what.slice(0, 1000), at: new Date().toISOString() }));
  return res.status(200).json({ ok: true });
}
