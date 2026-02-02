import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

function makeId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}

function esc(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = (v ?? "").toString().trim();
    if (s) return s;
  }
  return "";
}

function isValidEmail(email = "") {
  // lightweight check (good enough for now)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({
      error:
        "Missing RESEND_API_KEY. Add it to .env.local (local) and Vercel env vars (prod).",
    });
  }

  const data = req.body || {};
  const submissionId = makeId();

  const hostName = (data.hostName || "").toString().trim();
  const hostEmail = (data.hostEmail || "").toString().trim();
  const propertyName = (data.propertyName || "").toString().trim();
  const zip = (data.zip || "").toString().trim();
  const guestUrl = (data.guestUrl || "").toString().trim();

  const who = firstNonEmpty(hostName, hostEmail, "unknown-host");
  const where = firstNonEmpty(zip, "no-zip");

  // IMPORTANT:
  // While your domain is NOT verified, keep onboarding@resend.dev.
  // After verification, switch to: "GuestBites <hello@guestbites.com>"
  const FROM = "GuestBites <hello@guestbites.com>";


  try {
    // 1) Admin notification (to you)
    const adminSend = resend.emails.send({
      from: FROM,
      to: "adoram@pulseip.com",
      subject: `GuestBites Host Submission (${submissionId}) — ${who} — ${where}`,
      html: `
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.4">
          <h2 style="margin:0 0 10px">New Host Created a Guide</h2>

          <p style="margin:0 0 6px"><strong>Submission ID:</strong> ${esc(submissionId)}</p>
          <p style="margin:0 0 6px"><strong>Host Name:</strong> ${esc(hostName || "(not provided)")}</p>
          <p style="margin:0 0 6px"><strong>Host Email:</strong> ${esc(hostEmail || "(not provided)")}</p>
          <p style="margin:0 0 6px"><strong>Property:</strong> ${esc(propertyName || "(not provided)")}</p>
          <p style="margin:0 0 6px"><strong>ZIP:</strong> ${esc(zip || "(not provided)")}</p>
          <p style="margin:0 0 12px"><strong>Guest URL:</strong> ${
            guestUrl
              ? `<a href="${esc(guestUrl)}" target="_blank" rel="noreferrer">${esc(guestUrl)}</a>`
              : esc("(not provided)")
          }</p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0" />

          <div style="font-size:12px;color:#6b7280;margin-bottom:6px">
            Full payload (for debugging / analytics)
          </div>
          <pre style="font-size:12px;background:#0b1220;color:#e5e7eb;padding:12px;border-radius:10px;overflow:auto">${esc(
            JSON.stringify({ submissionId, ...data, hostName }, null, 2)
          )}</pre>
        </div>
      `,
    });

    // 2) Host email (only if hostEmail exists + looks valid)
    let hostSend = null;
    const sendToHost = isValidEmail(hostEmail) && !!guestUrl;

    if (sendToHost) {
      const friendlyName = hostName || "there";
      const niceProperty = propertyName || "your property";

      hostSend = resend.emails.send({
        from: FROM,
        to: hostEmail,
        // this helps you reply back to them easily (optional)
        reply_to: "adoram@pulseip.com",
        subject: "Your GuestBites guide link is ready",
        html: `
          <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5">
            <p style="margin:0 0 12px">Hi ${esc(friendlyName)} 👋</p>

            <p style="margin:0 0 12px">
              Your GuestBites food guide for <strong>${esc(niceProperty)}</strong> is ready.
            </p>

            <p style="margin:0 0 8px"><strong>Your guest link:</strong></p>
            <p style="margin:0 0 16px">
              <a href="${esc(guestUrl)}" target="_blank" rel="noreferrer">${esc(guestUrl)}</a>
            </p>

            <p style="margin:0 0 12px;color:#6b7280;font-size:13px">
              Tip: copy/paste this link into your welcome message, or open it and screenshot the QR code to print.
            </p>

            <p style="margin:18px 0 0">— GuestBites</p>
          </div>
        `,
      });
    }

    // Run both in parallel (faster)
    await Promise.all([adminSend, hostSend].filter(Boolean));

    return res.status(200).json({
      success: true,
      submissionId,
      emailedHost: !!sendToHost,
    });
  } catch (error) {
    console.error("Resend error:", error);
    return res.status(500).json({
      error: "Email failed",
      submissionId,
    });
  }
}
