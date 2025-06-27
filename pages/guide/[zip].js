// pages/guide/[zip].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ZipGuide() {
  const router = useRouter();
  const { zip } = router.query;
  const [groupedPlaces, setGroupedPlaces] = useState({});

  useEffect(() => {
    async function fetchData() {
      if (!zip) return;

      // Get lat/lng from ZIP
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=USA&format=json`
      );
      const geoData = await geoRes.json();
      if (!geoData[0]) return;

      const { lat, lon } = geoData[0];

      // Get restaurants from Foursquare
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
      const places = fsqData.results || [];

      const tagMap = {
        "🍻 Happy Hour": (place) =>
          place.categories.some((cat) => /bar|pub|tavern|taproom/i.test(cat.name)) ||
          /bar|pub|tavern|taproom/i.test(place.name),

        "🌙 Late Night Bites": (place) => {
          const openLate = place.hours?.display?.some((time) => /10:00 PM|11:00 PM|12:00 AM|1:00 AM|2:00 AM/.test(time));
          return !!openLate;
        },

        "🚶 Walkable Spots": () => true,

        "⭐ Locals Love": (place) => !!place.website && !!place.location?.address,
      };

      const grouped = {};

      Object.keys(tagMap).forEach((tag) => {
        grouped[tag] = places.filter(tagMap[tag]);
      });

      setGroupedPlaces(grouped);
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

      {Object.keys(groupedPlaces).length === 0 && <p>Loading nearby restaurants...</p>}

      {Object.entries(groupedPlaces).map(([tag, places]) => (
        <div key={tag} style={{ marginBottom: "2rem" }}>
          <h2>{tag}</h2>
          {places.length === 0 ? (
            <p style={{ color: "gray" }}>No results yet in this category.</p>
          ) : (
            places.map((place) => (
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
            ))
          )}
        </div>
      ))}
    </div>
  );
}

