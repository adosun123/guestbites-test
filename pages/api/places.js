// pages/api/places.js
// Standard (free) Places search: no ratings/photos/hours → avoids paid "Rich" calls.

const memoryCache = new Map(); // { zip: { ts: number, payload: string } }
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

export default async function handler(req, res) {
  try {
    const zip = String(req.query.zip || "").trim();
    if (!zip) return res.status(400).json({ error: "Missing zip" });

    // Serve from simple in-memory cache if fresh
    const hit = memoryCache.get(zip);
    if (hit && Date.now() - hit.ts < TTL_MS) {
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(hit.payload);
    }

    const key = process.env.FOURSQUARE_SERVER_API_KEY;
    if (!key) {
      return res
        .status(500)
        .json({ error: "Server key missing: set FOURSQUARE_SERVER_API_KEY in Production and redeploy" });
    }

    // IMPORTANT: keep fields "standard" (no rating/photos/hours) to avoid Rich (paid) calls.
    const params = new URLSearchParams({
      near: `${zip}, US`,
      radius: "4000",
      limit: "15",
      fields: "fsq_id,name,location,categories,website", // ← Standard fields only
    });

    const url = `https://api.foursquare.com/v3/places/search?${params}`;

    const r = await fetch(url, {
      headers: {
        Authorization: key, // raw fsq3... key (no "Bearer ")
        accept: "application/json",
      },
      cache: "no-store",
    });

    const text = await r.text();

    // If FSQ still complains about credits, remove the entire `fields` line above and try again.
    if (!r.ok) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(r.status).send(text);
    }

    // Cache & return
    memoryCache.set(zip, { ts: Date.now(), payload: text });
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
