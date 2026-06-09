"use client"

import { MenuIcon, Instagram } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type MobileNavProps = {
  name: string
  links: { href: string; label: string }[]
socials?: { instagram?: string; instagram2?: string; ra?: string }
}

export function SiteMobileNav({ name, links, socials }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-primary/20 backdrop-blur">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold tracking-wide">{name}</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-1.5 p-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-base hover:bg-accent hover:text-accent-foreground"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4 grid gap-2">
          {socials?.ra && (
            <a href={socials.ra} className="w-full" data-ga-event="click_ticket_cta" data-ga-id="mobile_ra_tickets" data-ga-section="mobile_nav">
              <Button className="w-full">Tickets on RA</Button>
            </a>
          )}
          {socials?.instagram && (
            <a href={socials.instagram} className="w-full">
              <Button variant="ghost" className="w-full">
                <Instagram className="mr-2" /> Forest Instagram
              </Button>
            </a>
          )}
          {socials?.instagram2 && (
            <a href={socials.instagram2} className="w-full">
              <Button variant="ghost" className="w-full">
                <Instagram className="mr-2" /> Shankara Instagram
              </Button>
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}


