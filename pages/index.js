import { useState } from "react";

export default function Home() {
  const [results, setResults] = useState([]);
  const [zip, setZip] = useState("");

  const categoryIcons = {
    "Pizza Place": "🍕",
    "Bakery": "🥐",
    "Steakhouse": "🥩",
    "Sushi Restaurant": "🍣",
    "Coffee Shop": "☕",
    "Burger Joint": "🍔",
    "Mexican Restaurant": "🌮",
    "Seafood Restaurant": "🦞",
    "Breakfast Spot": "🍳",
    "Dessert Shop": "🍰",
  };

  const fetchRestaurants = async (lat, lon) => {
    const res = await fetch(
      `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=13065&limit=10&fields=fsq_id,name,location,categories,hours,website`,
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

  const getTip = (name = "", category = "", hours) => {
    const n = name.toLowerCase();
    const c = category.toLowerCase();
    let closesLate = false;
    let closesEarly = false;

    try {
      const closingTime = hours?.regular?.[0]?.close?.hour;
      if (closingTime < 17) closesEarly = true;
      if (closingTime >= 21) closesLate = true;
    } catch (e) {}

    if (closesEarly) return "Great for early risers";
    if (n.includes("steak") || n.includes("bistro") || c.includes("fine")) return "Upscale dinner spot";
    if (n.includes("pizza") || c.includes("fast")) return "Great for quick bites";
    if (n.includes("cafe") || n.includes("breakfast") || c.includes("bakery")) return "Perfect breakfast spot";
    if (n.includes("bar") || n.includes("brew") || c.includes("pub")) return "Good for groups";
    if (c.includes("vegetarian") || n.includes("vegan")) return "Vegetarian options available";
    if (n.includes("grill") || n.includes("deli")) return "Popular with business travelers";
    if (closesLate) return "Great for late check-ins";

    return "Guest favorite in this area";
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "Arial", maxWidth: "600px", margin: "auto" }}>
      <h1>🍽️ GuestBites</h1>
      <p>
        Curated local eats + delivery perks, built for short-term rental guests!
      </p>

      <input
        placeholder="Enter ZIP code"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        style={{ padding: "0.5rem", fontSize: "1rem", width: "60%" }}
      />
      <button onClick={handleZipSearch} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
        Search
      </button>
      <div style={{ marginTop: "0.5rem" }}>
        <button onClick={handleLocationSearch} style={{ padding: "0.5rem", fontSize: "0.9rem" }}>
          📍 Use My Location
        </button>
      </div>

      {zip && (
        <h2 style={{ fontSize: "1.1rem", marginTop: "2rem", marginBottom: "1rem" }}>
          🎯 Showing results for ZIP: <strong>{zip}</strong>
        </h2>
      )}

      <div>
        {results.map((r) => {
          const icon = categoryIcons[r.categories?.[0]?.name] || "🍽️";
          const tip = getTip(r.name, r.categories?.[0]?.name || "", r.hours);

          return (
            <div key={r.fsq_id} style={{ borderBottom: "1px solid #ddd", padding: "1rem 0" }}>
              <strong>{icon} {r.name}</strong>
              <div>
                📍 {r.location?.formatted_address || r.location?.address || "Address not available"}
              </div>
              <div style={{ color: "#555", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                ✅ <strong>Guest Tip:</strong> {tip}
              </div>
              {r.website && (
                <div style={{ marginTop: "0.5rem" }}>
                  🌐 <a href={r.website} target="_blank" rel="noreferrer">Visit Website</a>
                </div>
              )}
              <div style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
                🎁 <strong>Perks for Guests </strong><br />
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1.2rem" }}>
                  <li>
                    🛵 <a href="https://ubereats.com/feed?promoCode=eats-adoramsue" target="_blank" rel="noreferrer">
                      $20 off your first Uber Eats order
                    </a>
                  </li>
                  <li>
                    🍔 <a href="https://drd.sh/rhocnPsAKvRbkw3J" target="_blank" rel="noreferrer">
                      $5 off your first DoorDash order
                    </a>
                  </li>
                </ul>
                <p style={{ fontStyle: "italic", fontSize: "0.85rem", color: "#777" }}>
                  This is a test version — more local deals coming soon!
                </p>
              </div>
            </div>
          );
        })}
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

      <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "2px solid #eee", textAlign: "center", fontSize: "0.9rem", color: "#666" }}>
        <p>💬 Are you a host or a local restaurant?</p>
        <p>
          <a href="mailto:hello@guestbites.com">Partner with GuestBites</a> — we’d love to hear from you.
        </p>
        <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#777" }}>
        </p>
      </div>
    </main>
  );
}
