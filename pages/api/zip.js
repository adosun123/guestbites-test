export default async function handler(req, res) {
  try {
    const lat = String(req.query.lat || "");
    const lon = String(req.query.lon || "");
    if (!lat || !lon) return res.status(400).json({ error: "Missing lat/lon" });

    const url =
      "https://nominatim.openstreetmap.org/reverse?" +
      new URLSearchParams({ lat, lon, format: "json", addressdetails: "1" });

    const r = await fetch(url, {
      headers: { "User-Agent": "GuestBites/1.0 (server)" },
      cache: "no-store",
    });

    const data = await r.json();
    const zip = data?.address?.postcode || "";
    if (!zip) return res.status(404).json({ error: "ZIP not found" });

    return res.status(200).json({ zip });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
