import React from "react";

export async function getServerSideProps(context) {
  const { query } = context;
  const {
    zip = "",
    propertyName = "",
    h1Name = "",
    h1Note = "",
    h2Name = "",
    h2Note = "",
  } = query;

  const hostPicks = [];
  if (h1Name) hostPicks.push({ name: h1Name, note: h1Note });
  if (h2Name) hostPicks.push({ name: h2Name, note: h2Note });

  return {
    props: {
      zip,
      propertyName,
      hostPicks,
    },
  };
}

const GuestGuidePage = ({ zip, propertyName, hostPicks }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1e293b 0, #020617 55%)",
        padding: 24,
        display: "flex",
        justifyContent: "center",
        color: "#e5e7eb",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 720 }}>
        <header style={{ marginBottom: 16 }}>
          <div
            style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}
          >
            GuestBites · Eats & drinks near your stay
          </div>
          <h1 style={{ margin: 0, fontSize: 22 }}>
            {propertyName || "Your GuestBites Food Guide"}
          </h1>
          <div style={{ fontSize: 13, color: "#9ca3af" }}>
            {zip ? `ZIP ${zip}` : "Nearby area"} · curated by your host
          </div>
        </header>

        {hostPicks.length > 0 && (
          <section
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 16,
              background: "#020617",
              border: "1px solid rgba(245,158,11,0.5)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(245,158,11,0.1)",
                  color: "#fbbf24",
                  fontSize: 11,
                }}
              >
                ⭐ Host Picks
              </span>
              <span style={{ color: "#e5e7eb" }}>
                Places your host personally recommends
              </span>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {hostPicks.map((p, i) => (
                <div
                  key={p.name + i}
                  style={{
                    padding: 8,
                    borderRadius: 12,
                    border: "1px solid rgba(148,163,184,0.7)",
                    background: "#020617",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {p.name}
                  </div>
                  {p.note && (
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      {p.note}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "#9ca3af",
                    }}
                  >
                    Added by your host
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section
          style={{
            padding: 12,
            borderRadius: 16,
            background: "#020617",
            border: "1px solid rgba(148,163,184,0.6)",
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              Nearby ideas
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              A few popular spots in the area (examples). Your host picks above
              are the ones they truly vouch for.
            </div>
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
            <div
              style={{
                padding: 8,
                borderRadius: 12,
                border: "1px solid rgba(55,65,81,0.9)",
                background: "#020617",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#f9fafb",
                }}
              >
                Example: Schmidt&apos;s Sausage Haus
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 2,
                }}
              >
                Classic German · Brunch & dinner · Very popular with visitors
              </div>
            </div>

            <div
              style={{
                padding: 8,
                borderRadius: 12,
                border: "1px solid rgba(55,65,81,0.9)",
                background: "#020617",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#f9fafb",
                }}
              >
                Example: Pistacia Vera
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginTop: 2,
                }}
              >
                Bakery & coffee · Great for a morning walk and pastry
              </div>
            </div>
          </div>
        </section>

        <p
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          GuestBites – prototype guide. Host picks above are specific to your
          stay.
        </p>
      </div>
    </div>
  );
};

export default GuestGuidePage;
