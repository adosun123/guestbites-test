import { useState } from "react";

export default function Home() {
  const [results, setResults] = useState([]);
  const [zip, setZip] = useState("");

  const handleSearch = async () => {
    if (!zip) return;

    const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=USA&format=json`);
    const data = await res.json();
    if (!data.length) return alert("ZIP not found");

    const { lat, lon } = data[0];

    const response = await fetch(`https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=13065&limit=10`, {
      headers: {
        Accept: "application/json",
        Authorization: process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY,
      },
    });

    const resultData = await response.json();
    setResults(resultData.results || []);
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
      <button onClick={handleSearch} style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
        Search
      </button>

      <div style={{ marginTop: "2rem" }}>
        {results.map((r) => {
          const encoded = encodeURIComponent(r.name);
          return (
            <div key={r.fsq_id} style={{ borderBottom: "1px solid #ddd", padding: "1rem 0" }}>
              <strong>{r.name}</strong>
              <div>📍 {r.location?.formatted_address || r.location?.address || "Address not available"}</div>
              <div style={{ color: "#555", fontSize: "0.9rem", marginTop: "0.25rem" }}>✅ Guest tip: Great local option</div>
              <div style={{ marginTop: "0.5rem" }}>
                <a href={`https://www.doordash.com/search/store/${encoded}`} target="_blank" rel="noreferrer">DoorDash</a>{" | "}
                <a href={`https://www.ubereats.com/search?q=${encoded}`} target="_blank" rel="noreferrer">Uber Eats</a>{" | "}
                <a href={`https://www.grubhub.com/search?searchTerm=${encoded}`} target="_blank" rel="noreferrer">Grubhub</a>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
