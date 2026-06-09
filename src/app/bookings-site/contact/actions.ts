"use server";

import { z } from "zod";

const BookingSchema = z.object({
  artist: z.string().min(2),
  date: z.string().min(2),
  location: z.string().min(2),
  budget: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10),
});

type BookingInput = z.infer<typeof BookingSchema>;

export async function sendBookingInquiryEmail(input: BookingInput) {
  const parsed = BookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "bookings@tropical-nomads.com";
  const FROM_EMAIL =
    process.env.CONTACT_FROM_EMAIL || "Tropical Nomads Bookings <no-reply@tropical-nomads.com>";

  const { artist, date, location, budget, email, message } = parsed.data;
  const subject = `[Booking Inquiry] ${artist} - ${location}`;
  const html = `
    <div style="font-family:Inter,ui-sans-serif,sans-serif;line-height:1.6;color:#e5e7eb;background:#0f172a;padding:24px">
      <h2 style="margin:0 0 12px 0;color:#34d399">New Booking Inquiry</h2>
      <p><strong>Artist:</strong> ${artist}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Budget:</strong> ${budget}</p>
      <p><strong>Email:</strong> ${email}</p>
      <hr style="border-color:#334155;border-width:1px 0 0;margin:16px 0"/>
      <p style="white-space:pre-wrap">${message}</p>
    </div>
  `;

  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set; skipping send and logging payload.");
    console.info({ to: TO_EMAIL, from: FROM_EMAIL, subject, html });
    return { ok: true as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: TO_EMAIL, from: FROM_EMAIL, subject, html }),
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Failed to parse error");
    return { ok: false as const, error: { _root: [`Send failed: ${res.status} ${err}`] } };
  }

  return { ok: true as const };
}

