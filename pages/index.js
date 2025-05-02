import { useState } from "react";

export default function Home() {
  const [results, setResults] = useState([]);
  const [zip, setZip] = useState("");

  const fetchRestaurants = async (lat, lon) => {
    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=13065&limit=10`,
      {
        headers: {
          Accept: "application/json",
          Authorization: process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY,
        },
      }
    );
    const data = await res.json();
    setResults(data.results || []);
  };

  const handleZipSearch = async () => {
    if (!zip) return;
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=USA&format=json`
    );
    const geoData = await geoRes.json();
    if (!geoData.length) return alert("ZIP not found");
    const { lat, lon } = geoData[0];
    fetchRestaurants(lat, lon);
  };

  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      alert("Location access not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchRestaurants(latitude, longitude);
      },
      () => {
        alert("Location access denied. Please enter a ZIP code.");
      }
    );
  };

  const getTip = (name = "", category = "") => {
    const n = name.toLowerCase();
    const c = category.toLowerCase();

    if (n.includes("steak") || n.includes("bistro") || c.includes("fine")) return "Upscale dinner spot";
    if (n.includes("pizza") || c.includes("fast")) return "Great for quick bites";
    if (n.includes("cafe") || c.includes("breakfast")) return "Perfect breakfast spot";
    if (n.includes("bar") || n.includes("brew") || c.includes("pub")) return "Good for groups";
    if (c.includes("vegetarian") || n.includes("vegan")) return "Vegetarian options available";
    if (n.includes("grill") || n.includes("deli")) return "Popular with business travelers";

    return "Great for late check-ins";
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "Arial", maxWidth: "600px", margin: "auto" }}>
      <h1>🍽️ GuestBites</h1>
      <p>Curated food picks for your stay</p>
      <input
        placeholder="Enter ZIP code"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        style={{ padding: "0.5rem", fontSize: "1rem" }}
      />
      <button onClick={handleZipSearch} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
        Search
      </button>
      <div style={{ marginTop: "0.5rem" }}>
        <button onClick={handleLocationSearch} style={{ padding: "0.5rem", fontSize: "0.9rem" }}>
          📍 Use My Location
        </button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        {results.map((r) => (
          <div key={r.fsq_id} style={{ borderBottom: "1px solid #ddd", padding: "1rem 0" }}>
            <strong>{r.name}</strong>
            <div>
              📍 {r.location?.formatted_address || r.location?.address || "Address not available"}
            </div>
            <div style={{ color: "#555", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              ✅ <strong>Guest Tip:</strong> {getTip(r.name, r.categories?.[0]?.name || "")}
            </div>
            <div style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
              Delivery Perks:<br />
              🛵 <a href="https://ubereats.com/feed?promoCode=eats-adoramsue" target="_blank" rel="noreferrer">Uber Eats — $20 off</a><br />
              🍔 <a href="https://drd.sh/rhocnPsAKvRbkw3J" target="_blank" rel="noreferrer">DoorDash — $5 off</a>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: "3rem", paddingTop: "1rem", borderTop: "2px solid #eee" }}>
          <h3>🛒 Need groceries?</h3>
          <p>
            Get <strong>$10 off</strong> your first Instacart order:<br />
            <a href="https://inst.cr/t/c4fab097b" target="_blank" rel="noreferrer">
              Order with Instacart
            </a>
          </p>
        </div>
      )}
    </main>
  );
}

  );
}
