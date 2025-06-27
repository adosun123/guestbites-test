// pages/guide/[zip].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ZipGuide() {
  const router = useRouter();
  const { zip } = router.query;
  const [groupedPlaces, setGroupedPlaces] = useState({});
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
          if (/pizza/.test(names)) return "Pizza";
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
    </div>
  );
}
