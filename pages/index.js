export default function Home() {
  const sampleResults = [
    {
      name: 'Blaze Pizza',
      address: '123 Main St',
      tip: 'Great for late check-ins',
    },
    {
      name: 'Northstar Cafe',
      address: '765 High St',
      tip: 'Locals love the brunch',
    },
    {
      name: 'Tacos El Rey',
      address: '42 Taco Blvd',
      tip: 'Fast delivery + great reviews',
    },
  ];

  const handleSearch = () => {
    const zip = document.getElementById('zip').value;
    const results = document.getElementById('results');
    results.innerHTML = sampleResults
      .map((r) => {
        const encoded = encodeURIComponent(r.name);
        return `
          <div style="border-bottom: 1px solid #ddd; padding: 1rem 0;">
            <strong>${r.name}</strong><br/>
            📍 ${r.address}<br/>
            <div style="color: #555; font-size: 0.9rem; margin-top: 0.25rem;">✅ ${r.tip}</div>
            <div style="margin-top: 0.5rem;">
              <a href="https://www.doordash.com/search/store/${encoded}" target="_blank">DoorDash</a> |
              <a href="https://www.ubereats.com/search?q=${encoded}" target="_blank">Uber Eats</a> |
              <a href="https://www.grubhub.com/search?searchTerm=${encoded}" target="_blank">Grubhub</a>
            </div>
          </div>
        `;
      })
      .join('');
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial', maxWidth: '600px', margin: 'auto' }}>
      <h1>🍽️ GuestBites</h1>
      <p>Curated food options for your stay</p>
      <input id="zip" placeholder="Enter ZIP code" style={{ padding: '0.5rem', fontSize: '1rem' }} />
      <button
        onClick={handleSearch}
        style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
      >
        Search
      </button>
      <div id="results" style={{ marginTop: '2rem' }}></div>
    </main>
  );
}
