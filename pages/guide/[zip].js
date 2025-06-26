import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function GuidePage() {
  const router = useRouter();
  const { zip } = router.query;
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    if (!zip) return;
    const fetchPlaces = async () => {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=USA&format=json`);
        const geoData = await geoRes.json();
        if (geoData.length === 0) return;
        const { lat, lon } = geoData[0];

        const res = await fetch(`/api/places?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        setPlaces(data.results);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlaces();
  }, [zip]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🍽️ GuestBites: Local Picks for {zip}</h1>
      <div className="grid gap-4">
        {places.map((place, i) => (
          <div key={i} className="border rounded p-4 shadow">
            <h2 className="text-lg font-semibold">{place.name}</h2>
            <p>{place.location?.formatted_address}</p>
            {place.website && <a href={place.website} className="text-blue-500" target="_blank" rel="noopener noreferrer">🔗 Visit Website</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
