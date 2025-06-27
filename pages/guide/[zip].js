// pages/guide/[zip].js
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
          `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=13065&limit=12&fields=fsq_id,name,location,categories,website,distance,rating`,
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

        setPlaces(fsqData.results);
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

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>🍽️ GuestBites: Local Picks for {zip}</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!error && places.length === 0 && <p>Loading nearby restaurants...</p>}

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
  );
}
