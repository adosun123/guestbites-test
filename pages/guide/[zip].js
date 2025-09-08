// pages/guide/[zip].js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

function decodeCustomParam(param) {
  try {
    return JSON.parse(decodeURIComponent(param));
  } catch {
    return [];
  }
}

function encodeCustomParam(data) {
  return encodeURIComponent(JSON.stringify(data));
}

const BUCKET_ORDER = ["Breakfast", "Lunch", "Pizza", "Dinner", "Dessert", "Other"];
const BUCKET_EMOJIS = {
  Breakfast: "🍳 Breakfast",
  Lunch: "🥪 Lunch",
  Pizza: "🍕 Pizza",
  Dinner: "🍽️ Dinner",
  Dessert: "🍰 Dessert",
  Other: "🗂️ Other",
  Custom: "➕ Added by Host",
};

// Minimal local fallback so the page never “spins forever”
const FALLBACK_BY_ZIP = (zip) => ({
  Breakfast: [],
  Lunch: [],
  Pizza: [],
  Dinner: [],
  Dessert: [],
  Other: [
    {
      fsq_id: `fallback-1-${zip}`,
      name: "Local Favorite #1",
      location: { address: String(zip), locality: "" },
      categories: [],
    },
    {
      fsq_id: `fallback-2-${zip}`,
      name: "Local Favorite #2",
      location: { address: String(zip), locality: "" },
      categories: [],
    },
  ],
});

export default function ZipGuide() {
  const router = useRouter();
  const { zip, custom } = router.query;

  const [groupedPlaces, setGroupedPlaces] = useState({});
  const [customPlaces, setCustomPlaces] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", category: "", link: "" });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Decode any custom places passed in the URL
  useEffect(() => {
    if (custom) setCustomPlaces(decodeCustomParam(custom));
  }, [custom]);

  // Build empty buckets
  const emptyBuckets = useMemo(
    () => Object.fromEntries(BUCKET_ORDER.map((b) => [b, []])),
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (!zip) return;
      setLoading(true);
      setError(null);

      try {
        // Call your server-side proxy to Foursquare
        const fsqRes = await fetch(`/api/places?zip=${encodeURIComponent(zip)}`, { cache: "no-store" });

        if (!fsqRes.ok) {
          const txt = await fsqRes.text();
          console.error("Proxy error:", fsqRes.status, txt);
          throw new Error(`Proxy error ${fsqRes.status}`);
        }

        const fsqData = await fsqRes.json();
        const places = fsqData?.results || [];
        if (!places.length) throw new Error("No places returned");

        // Bucketing
        const getBucket = (categories = []) => {
          const names = categories.map((c) => (c?.name || "").toLowerCase()).join(" ");
          if (/pizza|pizzeria|pizza place/.test(names)) return "Pizza";
          if (/coffee|cafe|bakery|diner|brunch/.test(names)) return "Breakfast";
          if (/deli|sandwich|burger|fast food|lunch/.test(names)) return "Lunch";
          if (/grill|steak|seafood|dinner|bar|restaurant/.test(names)) return "Dinner";
          if (/ice cream|dessert|chocolate|sweet|cake/.test(names)) return "Dessert";
          return "Other";
        };

        const grouped = { ...emptyBuckets };
        for (const p of places) {
          grouped[getBucket(p.categories)].push(p);
        }

        if (!cancelled) setGroupedPlaces(grouped);
      } catch (e) {
        console.error("Guide fetch error:", e);
        if (!cancelled) {
          setError("Couldn’t load places right now. Showing a few local favorites.");
          setGroupedPlaces(FALLBACK_BY_ZIP(String(zip)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [zip, emptyBuckets]);

  const getCategoryLabel = (categories) => {
    if (!categories || !categories.length) return "";
    return categories
      .slice(0, 2)
      .map((c) => c?.name || "")
      .filter(Boolean)
      .join(" • ");
  };

  const handleAddPlace = () => {
    const updated = [...customPlaces, { ...form }];
    const newParam = encodeCustomParam(updated);
    setCustomPlaces(updated);
    setForm({ name: "", address: "", category: "", link: "" });
    setShowForm(false);
    router.replace(
      { pathname: router.pathname, query: { zip, custom: newParam } },
      undefined,
      { shallow: true }
    );
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <h1>🍽️ GuestBites: Local Picks for {zip}</h1>

      {loading && !error && <p>Loading nearby restaurants…</p>}
      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>
          {error}{" "}
          <button
            onClick={() => router.replace(router.asPath)}
            style={{ marginLeft: 8, padding: "0.25rem 0.5rem", borderRadius: 6, cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Render buckets */}
      {Object.keys(groupedPlaces).length > 0 &&
        Object.entries(groupedPlaces).map(([bucket, places]) =>
          places.length ? (
            <div key={bucket} style={{ marginBottom: "2rem" }}>
              <h2>{BUCKET_EMOJIS[bucket]}</h2>
              {places.map((place) => (
                <div key={place.fsq_id} style={{ marginBottom: "1.25rem" }}>
                  <h3 style={{ margin: 0 }}>
                    {place.name}{" "}
                    {typeof place.rating === "number" && (
                      <span style={{ fontWeight: "normal" }}>— ⭐ {place.rating.toFixed(1)}/10</span>
                    )}
                  </h3>
                  {place.location && (place.location.address || place.location.locality) && (
                    <p style={{ margin: "0.25rem 0" }}>
                      {place.location.address || ""} {place.location.locality ? `, ${place.location.locality}` : ""}
                    </p>
                  )}
                  <p style={{ fontStyle: "italic", color: "#555", margin: "0.25rem 0" }}>
                    🏷️ {getCategoryLabel(place.categories)}
                  </p>
                  {place.website && (
                    <a href={place.website} target="_blank" rel="noopener noreferrer">
                      Visit Website
                    </a>
                  )}
                  <hr />
                </div>
              ))}
            </div>
          ) : null
        )}

      {/* Custom (host-added) places */}
      {customPlaces.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2>{BUCKET_EMOJIS.Custom}</h2>
          {customPlaces.map((place, i) => (
            <div key={i} style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0 }}>{place.name}</h3>
              {(place.address || place.category) && (
                <p style={{ margin: "0.25rem 0", color: "#555" }}>
                  {place.address}
                  {place.address && place.category ? " • " : ""}
                  {place.category}
                </p>
              )}
              {place.link && (
                <a href={place.link} target="_blank" rel="noopener noreferrer">
                  Visit Website
                </a>
              )}
              <hr />
            </div>
          ))}
        </div>
      )}

      {/* Add custom place form */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem", borderRadius: "6px", cursor: "pointer" }}
        >
          ➕ Add a Custom Spot
        </button>
      )}

      {showForm && (
        <div style={{ marginTop: "1.25rem" }}>
          <h3>Add Your Own Favorite</h3>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
          />
          <input
            type="text"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
          />
          <input
            type="text"
            placeholder="Category (e.g. Breakfast, Pizza)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
          />
          <input
            type="text"
            placeholder="Website Link (optional)"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
          />
          <button
            onClick={handleAddPlace}
            style={{ padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer" }}
          >
            ✅ Add to My Guide
          </button>{" "}
          <button
            onClick={() => setShowForm(false)}
            style={{ padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", marginLeft: 8 }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
