import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const [zip, setZip] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (zip.trim()) {
      router.push(`/guide/${zip.trim()}`);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", textAlign: "center" }}>
      <h1>🎉 Create a Local Guide for Your Guests</h1>
      <p>Enter your ZIP code to instantly generate a personalized local food page with a QR code you can print or share.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: "2rem" }}>
        <input
          type="text"
          placeholder="Enter ZIP code (e.g., 90210)"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          style={{
            padding: "0.75rem",
            width: "250px",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        />
        <button
          type="submit"
          style={{
            marginLeft: "1rem",
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#0070f3",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Generate Page
        </button>
      </form>
    </div>
  );
}
