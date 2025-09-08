export default async function handler(req, res) {
  try {
    const zip = String(req.query.zip || "");
    if (!zip) return res.status(400).json({ error: "Missing zip" });

    const params = new URLSearchParams({
      near: `${zip}, US`,
      radius: "5000",
      // categories: "13065", // uncomment later once working
      limit: "20",
      fields: "fsq_id,name,location,categories,website,distance,rating",
    });

    const key = process.env.FOURSQUARE_SERVER_API_KEY;
    if (!key) {
      console.error("Missing FOURSQUARE_SERVER_API_KEY in Production env");
      return res.status(500).json({ error: "Server key missing" });
    }

    const r = await fetch(`https://api.foursquare.com/v3/places/search?${params}`, {
      headers: { Authorization: key, accept: "application/json" },
      cache: "no-store",
    });

    const text = await r.text();
    console.log(
      "FSQ status:", r.status, "len:", text.length,
      "rate:", r.headers.get("x-ratelimit-remaining"), "/", r.headers.get("x-ratelimit-limit")
    );

    res.status(r.status).send(text);
  } catch (e) {
    console.error("API /places error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
