import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [zipInput, setZipInput] = useState("");

  const normZip = (v) => v.replace(/\D/g, "").slice(0, 5);

  const goToZip = (z) => {
    const zip = normZip(z);
    if (zip.length !== 5) {
      setErr("Please enter a 5-digit US ZIP.");
      return;
    }
    router.push(`/guide/${zip}`);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    goToZip(zipInput);
  };

  const useMyLocation = () => {
    setErr("");
    if (!navigator.geolocation) {
      setErr("Geolocation not supported.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(`/api/zip?lat=${latitude}&lon=${longitude}`, { cache: "no-store" });
          const j = await r.json();
          if (!r.ok) throw new Error(j?.error || "Could not resolve ZIP");
          router.push(`/guide/${encodeURIComponent(j.zip)}`);
        } catch {
          setErr("Couldn’t detect ZIP. Try entering it below.");
          setLoading(false);
        }
      },
      () => {
        setErr("Location permission denied. Try entering your ZIP below.");
        setLoading(false);
      }
    );
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 780, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ marginBottom: 8 }}>GuestBites</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        QR guides for short-term rentals — scan in-room to discover curated local restaurants and easy ordering.
      </p>

      {/* ZIP input */}
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <input
          inputMode="numeric"
          pattern="\d*"
          placeholder="Enter ZIP (e.g., 43209)"
          value={zipInput}
          onChange={(e) => setZipInput(normZip(e.target.value))}
          style={{ padding: "0.6rem 0.8rem", borderRadius: 8, border: "1px solid #ddd", minWidth: 220 }}
        />
        <button type="submit" style={{ padding: "0.6rem 1rem", borderRadius: 8, cursor: "pointer" }}>
          See my guide →
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={loading}
          style={{ padding: "0.6rem 1rem", borderRadius: 8, cursor: "pointer" }}
        >
          {loading ? "Finding your ZIP…" : "Use My Location"}
        </button>
        <a
          href="/guide/43209"
          style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid #ddd", textDecoration: "none" }}
        >
          See a live guide →
        </a>
      </form>

      {err && <p style={{ color: "crimson", marginTop: 12 }}>{err}</p>}

      <p style={{ marginTop: 24, fontSize: 12, color: "#888" }}>
        Data sources: © OpenStreetMap contributors • Foursquare Places
      </p>
    </div>
  );
}



