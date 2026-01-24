export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>🍽️ Welcome to GuestBites</h1>
      <p>Enter your ZIP code to discover curated food picks near you.</p>
      <input placeholder="Enter ZIP code" style={{ padding: "0.5rem", fontSize: "1rem" }} />
      <button style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>Search</button>
      <div style={{ marginTop: "2rem" }}>
        <h2>🍕 Blaze Pizza</h2>
        <p>📍 123 Main St — Open until 10PM</p>
        <p>✅ Guest tip: Great for late check-ins</p>
        <a href="#">Order on DoorDash</a> | <a href="#">Uber Eats</a> | <a href="#">Grubhub</a>
      </div>
    </main>
  );
}
