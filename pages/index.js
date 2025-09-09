// pages/index.js
import Head from "next/head";
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
          setErr("Couldn’t detect ZIP. Try entering it above.");
          setLoading(false);
        }
      },
      () => {
        setErr("Location permission denied. Try entering your ZIP above.");
        setLoading(false);
      }
    );
  };

  return (
    <>
      <Head>
        <title>GuestBites — Local food guides for STR guests</title>
        <meta
          name="description"
          content="QR guides for short-term rentals — scan in-room to discover curated local restaurants and easy ordering."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="wrap">
        <section className="card">
          <header className="brand">
            <div className="logo" aria-hidden>🍽️</div>
            <h1>GuestBites</h1>
          </header>

          <p className="tagline">
            QR guides for short-term rentals — scan in-room to discover curated local restaurants and easy ordering.
          </p>

          <form className="zipForm" onSubmit={onSubmit}>
            <label htmlFor="zip" className="srOnly">Enter ZIP code</label>
            <input
              id="zip"
              inputMode="numeric"
              pattern="\d*"
              placeholder="Enter ZIP (e.g., 43209)"
              value={zipInput}
              onChange={(e) => setZipInput(normZip(e.target.value))}
            />
            <button type="submit" className="primary">See my guide →</button>
          </form>

          <div className="actions">
            <button type="button" onClick={useMyLocation} disabled={loading} className="secondary">
              {loading ? "Finding your ZIP…" : "Use My Location"}
            </button>
          </div>

          {/* Small, de-emphasized demo link */}
          <p className="muted">
            Or try the demo: <a href="/guide/43209">ZIP 43209</a>
          </p>

          {err && <p className="error">{err}</p>}

          <footer className="footer">
            Data sources: © OpenStreetMap contributors • Foursquare Places
          </footer>
        </section>
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: radial-gradient(1200px 600px at 30% -10%, #f3f6ff 0%, transparent 60%),
                      radial-gradient(1000px 500px at 80% 0%, #f9f9fb 0%, transparent 60%),
                      #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        }
        .card {
          width: 100%;
          max-width: 760px;
          background: #fff;
          border: 1px solid #eef0f4;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 28px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          background: #f6f7fb;
          border: 1px solid #eef0f4;
          border-radius: 10px;
          font-size: 22px;
        }
        h1 {
          margin: 0;
          font-size: 26px;
          letter-spacing: 0.2px;
        }
        .tagline {
          margin: 10px 0 18px;
          color: #555;
          line-height: 1.5;
        }
        .zipForm {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .zipForm input {
          flex: 1 1 240px;
          min-width: 220px;
          padding: 12px 14px;
          border: 1px solid #d9dce3;
          border-radius: 10px;
          font-size: 16px;
        }
        .primary {
          padding: 12px 16px;
          border-radius: 10px;
          border: none;
          background: #111827;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }
        .primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .secondary {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #d9dce3;
          background: #fff;
          cursor: pointer;
        }
        .muted {
          margin-top: 8px;
          color: #6b7280;
          font-size: 14px;
        }
        .muted a { color: inherit; }
        .error {
          color: #b00020;
          margin-top: 12px;
        }
        .footer {
          margin-top: 18px;
          color: #8b8e98;
          font-size: 12px;
        }
        .srOnly {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 1px, 1px);
          white-space: nowrap; border: 0;
        }
        @media (max-width: 420px) {
          .primary, .secondary { width: 100%; text-align: center; }
        }
      `}</style>
    </>
  );
}




