import React, { useState, useMemo } from "react";
import QRCode from "react-qr-code";

const HostGuidePage = () => {
  const [propertyName, setPropertyName] = useState("");
  const [zip, setZip] = useState("");
  const [h1Name, setH1Name] = useState("");
  const [h1Note, setH1Note] = useState("");
  const [h2Name, setH2Name] = useState("");
  const [h2Note, setH2Note] = useState("");
  const [showResult, setShowResult] = useState(false);

  // Optional: host email field (so you can reply / follow up)
  const [hostEmail, setHostEmail] = useState("");

  // UX states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  const guestUrl = useMemo(() => {
    if (!zip) return "";

    const params = new URLSearchParams();
    params.set("zip", zip);
    if (propertyName) params.set("propertyName", propertyName);

    if (h1Name) {
      params.set("h1Name", h1Name);
      if (h1Note) params.set("h1Note", h1Note);
    }

    if (h2Name) {
      params.set("h2Name", h2Name);
      if (h2Note) params.set("h2Note", h2Note);
    }

    let origin = "";
    if (typeof window !== "undefined") origin = window.location.origin;

    if (!origin) return "/guest-guide?" + params.toString();
    return origin + "/guest-guide?" + params.toString();
  }, [zip, propertyName, h1Name, h1Note, h2Name, h2Note]);

  const handleGenerate = async () => {
    setSubmitMsg("");

    if (!zip) {
      alert("Please enter a ZIP code");
      return;
    }

    setShowResult(true);

    // Submit to your API (lightweight tracking)
    try {
      setIsSubmitting(true);

      const payload = {
        hostEmail: hostEmail.trim() || null,
        propertyName: propertyName.trim() || null,
        zip: zip.trim(),
        hostPicks: [
          h1Name.trim()
            ? { name: h1Name.trim(), note: h1Note.trim() || null }
            : null,
          h2Name.trim()
            ? { name: h2Name.trim(), note: h2Note.trim() || null }
            : null,
        ].filter(Boolean),
        guestUrl,
        source: "host-guide",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      };

      const res = await fetch("/api/host-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }

      setSubmitMsg("✅ Sent! (You’ll receive an email with the created guide.)");
    } catch (err) {
      console.error(err);
      setSubmitMsg(
        "⚠️ Couldn’t send right now. The guide still works, but tracking/email failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = { fontSize: 14, marginBottom: 4, display: "block" };
  const inputStyle = {
    width: "100%",
    padding: "6px 10px",
    marginBottom: 8,
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    fontSize: 14,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #1e293b 0, #020617 55%)",
        padding: 24,
        display: "flex",
        justifyContent: "center",
        color: "#e5e7eb",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 900 }}>
        <h1 style={{ marginBottom: 4 }}>GuestBites · Host Guide Creator</h1>
        <p style={{ marginTop: 0, marginBottom: 16, color: "#9ca3af" }}>
          Fill this out once and get a guest link + QR code for your food guide.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr)",
            gap: 24,
          }}
        >
          {/* Left: form */}
          <div
            style={{
              background: "rgba(15,23,42,0.85)",
              borderRadius: 20,
              padding: 16,
              border: "1px solid rgba(148,163,184,0.6)",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Host email (optional)</label>
              <input
                style={inputStyle}
                placeholder="you@email.com (so we can follow up)"
                value={hostEmail}
                onChange={(e) => setHostEmail(e.target.value)}
              />

              <label style={labelStyle}>Property name</label>
              <input
                style={inputStyle}
                placeholder="Historic 3BR Gem · German Village"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
              />

              <label style={labelStyle}>ZIP code</label>
              <input
                style={inputStyle}
                placeholder="43206"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </div>

            <div
              style={{
                borderTop: "1px dashed rgba(148,163,184,0.6)",
                paddingTop: 10,
                marginTop: 6,
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "#9ca3af" }}>
                Add 1–2 places you recommend (Host Picks)
              </p>

              <label style={labelStyle}>Host Pick #1 – name</label>
              <input
                style={inputStyle}
                placeholder="Schmidt's Sausage Haus"
                value={h1Name}
                onChange={(e) => setH1Name(e.target.value)}
              />
              <label style={labelStyle}>Host Pick #1 – short note</label>
              <input
                style={inputStyle}
                placeholder="Classic German, great with kids"
                value={h1Note}
                onChange={(e) => setH1Note(e.target.value)}
              />

              <label style={labelStyle}>Host Pick #2 – name (optional)</label>
              <input
                style={inputStyle}
                placeholder="Pistacia Vera"
                value={h2Name}
                onChange={(e) => setH2Name(e.target.value)}
              />
              <label style={labelStyle}>Host Pick #2 – short note</label>
              <input
                style={inputStyle}
                placeholder="Coffee + pastries, perfect morning walk"
                value={h2Note}
                onChange={(e) => setH2Note(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isSubmitting}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "10px 0",
                borderRadius: 999,
                border: "none",
                fontSize: 14,
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.75 : 1,
                background: "linear-gradient(120deg,#2563eb,#22c55e)",
                color: "#fff",
              }}
            >
              {isSubmitting ? "Sending..." : "Generate guide link & QR"}
            </button>

            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
              You can paste the guest link into Airbnb, or print the QR for your
              welcome frame / fridge.
            </p>

            {submitMsg ? (
              <p style={{ fontSize: 12, marginTop: 10 }}>{submitMsg}</p>
            ) : null}
          </div>

          {/* Right: link + QR */}
          <div
            style={{
              background: "rgba(15,23,42,0.7)",
              borderRadius: 20,
              padding: 16,
              border: "1px solid rgba(148,163,184,0.6)",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 16 }}>Guest link & QR preview</h2>

            {!showResult || !guestUrl ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>
                Fill the form on the left and click{" "}
                <strong>Generate guide link & QR</strong> to see the result here.
              </p>
            ) : (
              <>
                <div
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    background: "#020617",
                    borderRadius: 14,
                    border: "1px solid rgba(148,163,184,0.7)",
                    fontSize: 12,
                    wordBreak: "break-all",
                  }}
                >
                  <div style={{ color: "#9ca3af", marginBottom: 4 }}>
                    Guest guide URL
                  </div>
                  <a
                    href={guestUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#93c5fd", textDecoration: "none" }}
                  >
                    {guestUrl}
                  </a>
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      padding: 8,
                      borderRadius: 16,
                      background: "#020617",
                      border: "1px dashed rgba(148,163,184,0.8)",
                    }}
                  >
                    <QRCode value={guestUrl} size={120} />
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    <div style={{ marginBottom: 4, color: "#e5e7eb" }}>
                      QR for this guide
                    </div>
                    <div>
                      • Screenshot or print this QR <br />
                      • Or copy and paste the guest link into your welcome message
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostGuidePage;
