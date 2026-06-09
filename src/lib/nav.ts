export type NavLink = {
  href: string
  label: string
}

export const EVENTS_NAV: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/past", label: "Past Events" },
  { href: "/map", label: "Map" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export const BOOKINGS_NAV: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/artists", label: "Artists" },
  { href: "/calendar", label: "Calendar" },
  { href: "/contact", label: "Book an Artist" },
]


