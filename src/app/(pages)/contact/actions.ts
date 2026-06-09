"use server"

import { z } from "zod"

const ContactSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  message: z.string().min(10, "Mensagem muito curta"),
})

type ContactInput = z.infer<typeof ContactSchema>

export async function sendContactEmail(input: ContactInput) {
  const parsed = ContactSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const { name, email, message } = parsed.data

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "juliolpiva@hotmail.com"
  const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "Forest Shankara <no-reply@forestshankara.app>"

  const subject = `[Contato] Mensagem — ${name}`
  const html = `
    <div style="font-family:Inter,ui-sans-serif,sans-serif;line-height:1.6;color:#eaeaea;background:#0b0a10;padding:24px">
      <h2 style="margin:0 0 12px 0;color:#e8d28b">Novo contato — Forest Shankara</h2>
      <p><strong>Nome:</strong> ${name}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <hr style="border-color:#3a3350;border-width:1px 0 0;margin:16px 0"/>
      <p style="white-space:pre-wrap">${message}</p>
    </div>
  `

  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set; skipping real email send. Logging payload.")
    console.info({ to: TO_EMAIL, from: FROM_EMAIL, subject, html })
    return { ok: true as const }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: TO_EMAIL, from: FROM_EMAIL, subject, html }),
    // Force server-side
    cache: "no-store",
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const err = await res.text().catch(() => "Failed to parse error")
    return { ok: false as const, error: { _root: [`Falha ao enviar: ${res.status} ${err}`] } }
  }

  return { ok: true as const }
}


