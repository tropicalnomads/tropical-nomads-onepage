import { getParty } from "@/lib/party"
import { ContactPageClient } from "./contact-client"  

export default function ContactPage() {
  const cfg = getParty()
  
  return <ContactPageClient config={cfg} />
}
