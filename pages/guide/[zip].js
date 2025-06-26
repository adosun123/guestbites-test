import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function GuidePage() {
  const router = useRouter();
  const { zip } = router.query;

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!zip) return;

    async function fetchData() {
      try {
        // Convert ZIP to lat/lng
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=USA&format=json`);
        const geoData = await geoRes.json();
        const { lat, lon } = geoData[0];

        // Fetch places from Foursquare
        const fsqRes = await fetch(`https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=13065&limit=10&fields=fsq_id,name,location,categories,hours,website`, {
          headers: {
            Accept: "application/json",
            Authorization: process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY
          }
        });
        const fsqData = await fsqRes.json();
        setPlaces(fsqData.results || []);
      } catch (err) {
        console.error(err);
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [zip]);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Local Picks for {zip}</h1>
      {loading && <p>Loading...</p>}
      {!loading && places.length === 0 && <p>No places found.</p>}
      <ul>
        {places.map((place) => (
          <li key={place.fsq_id}>
            <strong>{place.name}</strong><br />
            {place.location?.formatted_address || ""}<br />
            {place.website && <a href={place.website} target="_blank" rel="noopener noreferrer">Website</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}
