import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const {
      hostName,
      hostEmail,
      propertyName,
      zip,
      picks,
      pageUrl,
      submittedAt,
      referrer,
      userAgent,
      honeypot,
    } = req.body || {};

    // simple bot trap
    if (honeypot) return res.status(200).json({ ok: true });

    // minimal validation: require zip + (propertyName or email)
    if (!zip || (!propertyName && !hostEmail)) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const safePicks = Array.isArray(picks) ? picks : [];
    const picksHtml =
      safePicks
        .filter((p) => p?.name)
        .map((p, i) => {
          const n = esc(p?.name || "");
          const note = esc(p?.note || "");
          return `<li><b>Pick ${i + 1}:</b> ${n}${note ? ` — ${note}` : ""}</li>`;
        })
        .join("") || "<li>(none provided)</li>";

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.4;">
        <h2>New GuestBites Host Submission</h2>
        <p><b>Submitted:</b> ${esc(submittedAt || new Date().toISOString())}</p>
        <p><b>Host name:</b> ${esc(hostName || "")}</p>
        <p><b>Host email:</b> ${esc(hostEmail || "")}</p>
        <p><b>Property name:</b> ${esc(propertyName || "")}</p>
        <p><b>ZIP:</b> ${esc(zip || "")}</p>
        <p><b>Guest guide URL:</b> ${esc(pageUrl || "")}</p>
        <p><b>Host Picks:</b></p>
        <ul>${picksHtml}</ul>
        <hr />
        <p><b>Referrer:</b> ${esc(referrer || "")}</p>
        <p><b>User-Agent:</b> ${esc(userAgent || "")}</p>
      </div>
    `;

    const to = process.env.HOST_SUBMIT_EMAIL_TO;      // adoram@pulseip.com
    const from = process.env.HOST_SUBMIT_EMAIL_FROM;  // verified sender in Resend
    const apiKey = process.env.RESEND_API_KEY;

    if (!to || !from || !apiKey) {
      return res.status(500).json({
        ok: false,
        error: "Email env vars not configured (TO/FROM/RESEND_API_KEY)",
      });
    }

    await resend.emails.send({
      from,
      to,
      subject: `GuestBites Host Submission — ${propertyName || zip}`,
      html,
      replyTo: hostEmail || undefined,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
} 
