// Minimal Resend client over their REST API - no SDK dependency. No-ops when
// RESEND_API_KEY is unset so local/dev and pre-launch environments never fail.
// Locale-aware: subjects/bodies are passed in already-localized by the caller.

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from || !to) return; // silently skip when not configured

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      // Never throw into the calling server action - email is best-effort.
      console.error("Email send failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("Email send error", err);
  }
}

function wrap(title: string, bodyLines: string[]): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
    <h2 style="font-size:18px">${title}</h2>
    ${bodyLines.map((l) => `<p style="color:#444;line-height:1.5">${l}</p>`).join("")}
    <p style="color:#888;font-size:12px;margin-top:24px">ProcureLink</p>
  </div>`;
}

// Serbian-first templates (Serbian is the default locale). `locale` selects EN.
type Locale = "sr" | "en";

export function orderPlacedToSupplier(
  locale: Locale,
  data: { orderNumber: string; restaurantName: string }
) {
  const sr = locale !== "en";
  const subject = sr
    ? `Nova porudžbina ${data.orderNumber}`
    : `New order ${data.orderNumber}`;
  const html = wrap(
    subject,
    sr
      ? [
          `Restoran <strong>${data.restaurantName}</strong> je poslao novu porudžbinu (${data.orderNumber}).`,
          "Prijavite se na ProcureLink da je potvrdite.",
        ]
      : [
          `Restaurant <strong>${data.restaurantName}</strong> placed a new order (${data.orderNumber}).`,
          "Sign in to ProcureLink to confirm it.",
        ]
  );
  return { subject, html };
}

export function orderClosedToRestaurant(
  locale: Locale,
  data: { orderNumber: string; status: "delivered" | "cancelled" }
) {
  const sr = locale !== "en";
  const statusText = sr
    ? data.status === "delivered"
      ? "isporučena"
      : "otkazana"
    : data.status;
  const subject = sr
    ? `Porudžbina ${data.orderNumber} je ${statusText}`
    : `Order ${data.orderNumber} ${statusText}`;
  const html = wrap(subject, [subject]);
  return { subject, html };
}

/** Internal notification - founder reads it, so Serbian only. */
export function planInquiryToFounder(data: {
  companyName: string;
  contactEmail: string;
  planCode: string;
  message: string;
}) {
  const subject = `Upit za plan "${data.planCode}" - ${data.companyName}`;
  const html = wrap(subject, [
    `Kompanija: <strong>${data.companyName}</strong>`,
    `Kontakt: ${data.contactEmail}`,
    `Plan: ${data.planCode}`,
    data.message ? `Poruka: ${data.message}` : "",
    "Aktiviraj pretplatu u supplier_subscriptions tabeli.",
  ].filter(Boolean));
  return { subject, html };
}

export function recurringRunFailedToRestaurant(
  locale: Locale,
  data: { name: string }
) {
  const sr = locale !== "en";
  const subject = sr
    ? `Automatizacija "${data.name}" nije uspela`
    : `Automation "${data.name}" failed`;
  const html = wrap(
    subject,
    sr
      ? [
          `Pokušaj automatskog poručivanja za "${data.name}" nije uspeo.`,
          "Prijavite se da proverite detalje.",
        ]
      : [
          `The scheduled run for "${data.name}" did not complete.`,
          "Sign in to check the details.",
        ]
  );
  return { subject, html };
}
