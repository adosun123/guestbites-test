// pages/api/places.js
// 1) Try Foursquare Places with STANDARD (free) fields only.
// 2) If FSQ says "no credits" (or other non-OK), fall back to OpenStreetMap (free) to keep the page working.

const memoryCache = new Map(); // { key: { ts, payload } }
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

export default async function handler(req, res) {
  try {
    const zip = String(req.query.zip || "").trim();
    if (!zip) return res.status(400).json({ error: "Missing zip" });

    // Serve from in-memory cache if fresh
    const cacheKey = `zip:${zip}`;
    const hit = memoryCache.get(cacheKey);
    if (hit && Date.now() - hit.ts < TTL_MS) {
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(200).send(hit.payload);
    }

    // ---------- First try: Foursquare STANDARD (free) ----------
    const fsqKey = process.env.FOURSQUARE_SERVER_API_KEY; // raw fsq3... (no "Bearer ")
    if (fsqKey) {
      const fsqParams = new URLSearchParams({
        near: `${zip}, US`,
        radius: "4000",
        limit: "15",
        // IMPORTANT: keep fields standard to avoid "Rich" (paid) classification.
        // If "no credits" persists, REMOVE the 'fields' line entirely.
        fields: "fsq_id,name,location,categories,website",
      });
      const fsqUrl = `https://api.foursquare.com/v3/places/search?${fsqParams}`;
      const fsqResp = await fetch(fsqUrl, {
        headers: { Authorization: fsqKey, accept: "application/json" },
        cache: "no-store",
      });
      const fsqText = await fsqResp.text();

      // If FSQ is happy, return it
      if (fsqResp.ok) {
        memoryCache.set(cacheKey, { ts: Date.now(), payload: fsqText });
        res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.status(200).send(fsqText);
      }

      // If FSQ explicitly says "no credits", we’ll fall back to OSM
      try {
        const maybeJson = JSON.parse(fsqText);
        const msg = (maybeJson && (maybeJson.message || maybeJson.error)) || "";
        if (String(msg).toLowerCase().includes("no api credits")) {
          // continue to OSM fallback
        } else {
          // Some other FSQ error → pass through (helps debugging)
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          return res.status(fsqResp.status).send(fsqText);
        }
      } catch {
        // Non-JSON error from FSQ; continue to fallback
      }
    }
    // ---------- Foursquare unavailable/denied → Fall back to OpenStreetMap ----------

    // 1) Geocode ZIP → lat/lon via Nominatim
    const geoUrl =
      `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({ postalcode: zip, country: "US", format: "json", limit: "1" });
    const geoResp = await fetch(geoUrl, {
      headers: { "User-Agent": "GuestBites/1.0 (server)" }, // be polite for OSM
      cache: "no-store",
    });
    const geoJson = await geoResp.json();
    if (!Array.isArray(geoJson) || !geoJson.length) {
      return res.status(500).json({ error: "Fallback geocode failed" });
    }
    const { lat, lon, display_name } = geoJson[0];

    // 2) Query Overpass for nearby restaurants (nodes/ways/relations) within ~4km
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="restaurant"](around:4000,${lat},${lon});
        way["amenity"="restaurant"](around:4000,${lat},${lon});
        relation["amenity"="restaurant"](around:4000,${lat},${lon});
      );
      out center 20;
    `;
    const osmResp = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "GuestBites/1.0 (server)" },
      body: new URLSearchParams({ data: overpassQuery }),
      cache: "no-store",
    });
    const osmJson = await osmResp.json();

    // 3) Map OSM results → FSQ-like shape so your UI works without changes
    const elements = Array.isArray(osmJson.elements) ? osmJson.elements : [];
    const mapped = elements
      .map((el) => {
        const t = el.tags || {};
        const name = t.name || t["brand"] || null;
        if (!name) return null;

        // Address assembly from OSM tags
        const parts = [
          t["addr:housenumber"] || "",
          t["addr:street"] || "",
        ].filter(Boolean);
        const address = parts.join(" ").trim() || (t["addr:full"] || "");
        const locality = t["addr:city"] || t["addr:town"] || t["addr:municipality"] || "";

        return {
          fsq_id: `osm-${el.type}-${el.id}`,
          name,
          location: { address, locality },
          categories: [{ id: "osm-restaurant", name: "Restaurant" }],
          website: t.website || t.url || null,
          distance: null, // unknown here
          // no rating in fallback (keeps it "standard" and free)
        };
      })
      .filter(Boolean)
      .slice(0, 20);

    const payload = JSON.stringify({ results: mapped, source: "osm", center: { lat, lon, display_name } });

    // cache & return
    memoryCache.set(cacheKey, { ts: Date.now(), payload });
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(payload);
  } catch (e) {
    // Final safety
    return res.status(500).json({ error: "Server error" });
  }
}
