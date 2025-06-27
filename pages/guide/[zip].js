// pages/guide/[zip].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function decodeCustomParam(param) {
  try {
    return JSON.parse(decodeURIComponent(param));
  } catch (e) {
    return [];
  }
}

function encodeCustomParam(data) {
  return encodeURIComponent(JSON.stringify(data));
}

export default function ZipGuide() {
  const router = useRouter();
  const { zip, custom } = router.query;
  const [groupedPlaces, setGroupedPlaces] = useState({});
  const [customPlaces, setCustomPlaces] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", category: "", link: "" });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (custom) {
      setCustomPlaces(decodeCustomParam(custom));
    }
  }, [custom]);

  useEffect(() => {
    async function fetchData() {
      if (!zip) return;

      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=USA&format=json`
        );
        const geoData = await geoRes.json();
        if (!geoData[0]) {
          setError("Could not locate ZIP code.");
          return;
        }

        const { lat, lon } = geoData[0];

        const fsqRes = await fetch(
          `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=13065&limit=20&fields=fsq_id,name,location,categories,website,distance,rating`,
          {
            headers: {
              Authorization: process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY,
              Accept: "application/json",
            },
          }
        );

        const fsqData = await fsqRes.json();
        if (!fsqData.results) {
          throw new Error("Foursquare API returned no results");
        }

        const places = fsqData.results;

        const bucketOrder = ["Breakfast", "Lunch", "Pizza", "Dinner", "Dessert", "Other"];

        const getBucket = (categories = []) => {
          const names = categories.map((c) => c.name.toLowerCase()).join(" ");
          if (/pizza|pizzeria|pizza place/.test(names)) return "Pizza";
          if (/coffee|cafe|bakery|diner|brunch/.test(names)) return "Breakfast";
          if (/deli|sandwich|burger|fast food|lunch/.test(names)) return "Lunch";
          if (/grill|steak|seafood|dinner|bar|restaurant/.test(names)) return "Dinner";
          if (/ice cream|dessert|chocolate|sweet|cake/.test(names)) return "Dessert";
          return "Other";
        };

        const grouped = {};
        for (const bucket of bucketOrder) {
          grouped[bucket] = [];
        }

        places.forEach((place) => {
          const bucket = getBucket(place.categories);
          grouped[bucket].push(place);
        });

        setGroupedPlaces(grouped);
      } catch (err) {
        console.error("Guide fetch error:", err);
        setError("Something went wrong loading the guide.");
      }
    }

    fetchData();
  }, [zip]);

  const getCategoryLabel = (categories) => {
    if (!categories || categories.length === 0) return "";
    return categories
      .slice(0, 2)
      .map((cat) => cat.name)
      .join(" • ");
  };

  const bucketEmojis = {
    Breakfast: "🍳 Breakfast",
    Lunch: "🥪 Lunch",
    Pizza: "🍕 Pizza",
    Dinner: "🍽️ Dinner",
    Dessert: "🍰 Dessert",
    Other: "🗂️ Other",
    Custom: "➕ Added by Host",
  };

  const handleAddPlace = () => {
    const updated = [...customPlaces, { ...form }];
    const newParam = encodeCustomParam(updated);
    setCustomPlaces(updated);
    setForm({ name: "", address: "", category: "", link: "" });
    setShowForm(false);
    router.replace({ pathname: router.pathname, query: { zip, custom: newParam } }, undefined, { shallow: true });
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>🍽️ GuestBites: Local Picks for {zip}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!error && Object.keys(groupedPlaces).length === 0 && <p>Loading nearby restaurants...</p>}

      {Object.entries(groupedPlaces).map(([bucket, places]) => (
        places.length > 0 && (
          <div key={bucket} style={{ marginBottom: "2rem" }}>
            <h2>{bucketEmojis[bucket]}</h2>
            {places.map((place) => (
              <div key={place.fsq_id} style={{ marginBottom: "1.5rem" }}>
                <h3>
                  {place.name} {place.rating ? <span style={{ fontWeight: "normal" }}>— ⭐ {place.rating.toFixed(1)}/10</span> : null}
                </h3>
                {place.location && (
                  <p>
                    {place.location.address}, {place.location.locality}
                  </p>
                )}
                <p style={{ fontStyle: "italic", color: "#555" }}>🏷️ {getCategoryLabel(place.categories)}</p>
                {place.website && (
                  <a href={place.website} target="_blank" rel="noopener noreferrer">
                    Visit Website
                  </a>
                )}
                <hr />
              </div>
            ))}
          </div>
        )
      ))}

      {customPlaces.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2>{bucketEmojis.Custom}</h2>
          {customPlaces.map((place, i) => (
            <div key={i} style={{ marginBottom: "1.5rem" }}>
              <h3>{place.name}</h3>
              <p>{place.address}</p>
              <p style={{ fontStyle: "italic", color: "#555" }}>🏷️ {place.category}</p>
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

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{ padding: "0.5rem 1rem", fontSize: "1rem", borderRadius: "6px", cursor: "pointer" }}
        >
          ➕ Add a Custom Spot
        </button>
      )}

      {showForm && (
        <div style={{ marginTop: "1.5rem" }}>
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
          </button>
        </div>
      )}
    </div>
  );
}
