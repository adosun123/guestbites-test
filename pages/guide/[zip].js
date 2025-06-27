import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ZipGuide() {
  const router = useRouter();
  const { zip } = router.query;
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState(null);

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
          `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=13065&limit=20&fields=fsq_id,name,location,categories,hours,website`,
          {
            headers: {
              Authorization: process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY,
              Accept: "application/json",
            },
          }
        );

        const fsqData = await fsqRes.json();
        setPlaces(fsqData.results || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Something went wrong loading the guide.");
      }
    }

    fetchData();
  }, [zip]);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>🍽️ GuestBites: Local Picks for {zip}</h1>

      <div style={{ background: "#f3f3f3", padding: "1rem", borderRadius: "8px", marginBottom: "2rem" }}>
        <h3>✨ Local Perks</h3>
        <ul>
          <li>Happy Hour Specials</li>
          <li>Late Night Bites</li>
          <li>Walkable Spots</li>
          <li>Trusted by Local Hosts</li>
        </ul>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!error && places.length === 0 && <p>Loading nearby restaurants...</p>}

      {places.map((place) => (
        <div key={place.fsq_id} style={{ marginBottom: "1.5rem" }}>
          <h3>{place.name}</h3>
          {place.location && (
            <p>
              {place.location.address}, {place.location.locality}
            </p>
          )}
          {place.website && (
            <a href={place.website} target="_blank" rel="noopener noreferrer">
              Visit Website
            </a>
          )}
          <hr />
        </div>
      ))}
    </div>
  );
}
