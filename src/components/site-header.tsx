import Link from "next/link"
import Image from "next/image"
import { TicketIcon } from "lucide-react"
import { getParty, getGeneral } from "@/lib/party"
import { Button } from "@/components/ui/button"
import { SiteMobileNav } from "@/components/site-mobile-nav"
import { BOOKINGS_NAV, EVENTS_NAV } from "@/lib/nav"
import type { SiteKey } from "@/lib/site"

type SiteHeaderProps = {
  site: SiteKey
}

export async function SiteHeader({ site }: SiteHeaderProps) {
  const cfg = getParty(site)
  const general = getGeneral(site)
  const nav = site === "bookings" ? BOOKINGS_NAV : EVENTS_NAV
  const homePath = site === "bookings" ? "/bookings-site" : "/events-site"
  const hasTicketUrl = typeof general.tickets?.url === "string" && general.tickets.url.length > 0
  const showTicketsSoon = general.ticketsComingSoon || !hasTicketUrl

  return (
    <header className="sticky top-0 z-50 border-b border-secondary/30 bg-card/80 backdrop-blur-sm text-foreground overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4 flex h-14 items-center gap-3 relative">
        <div className="absolute left-4 z-10 md:hidden">
          <SiteMobileNav
            name={cfg.name}
            links={nav.map((item) => ({ ...item, href: `${homePath}${item.href === "/" ? "" : item.href}` }))}
            socials={cfg.socials}
          />
        </div>
        <Link href={homePath} className="flex items-center flex-1 justify-center md:flex-none md:justify-start">
          <div className="bg-transparent">
            <Image 
              src={cfg.logo || "/events/logo.svg"} 
              alt={cfg.name}
              width={240}
              height={80}
              className="h-24 w-auto"
              style={{ 
                filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.1)) drop-shadow(0 0 1px rgba(0, 0, 0, 0.1))',
              }}
              priority
            />
          </div>
        </Link>

         <nav className="flex-1 justify-center items-center gap-6 hidden md:flex">
          {nav.map((l) => (
            <Link key={l.href} href={`${homePath}${l.href === "/" ? "" : l.href}`} className="text-base font-medium text-foreground/85 hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {showTicketsSoon ? (
            <Button size="sm" variant="secondary" disabled>
              <TicketIcon />
              {general.tickets.label}
            </Button>
          ) : (
            <a href={general.tickets.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer" data-ga-event="click_ticket_cta" data-ga-id="header_tickets" data-ga-section="header">
              <Button size="sm" variant="default">
                <TicketIcon />
                {general.tickets.label}
              </Button>
            </a>
          )}
        </div>
      </div>
    </header>
  )
}


