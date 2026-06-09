import Image from "next/image";
import { MapPin, TicketIcon } from "lucide-react";
import { getParty } from "@/lib/party";
import { TextButton } from "@/components/ui/text-button";
import { NAV_LINKS } from "@/lib/nav";

const MONTHS_PT_BR = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

type DateParts = { day: number; month: number; year: number };

function parseDateParts(dateString?: string): DateParts | null {
  if (!dateString) return null;

  // Keep the day stable across environments by reading YYYY-MM-DD directly.
  const isoMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
    };
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
  };
}

function formatSingleDate(parts: DateParts): string {
  const monthName = MONTHS_PT_BR[parts.month - 1];
  return `${parts.day} de ${monthName} de ${parts.year}`;
}

function formatDateRange(date?: string, endDate?: string): string {
  const start = parseDateParts(date);
  if (!start) return "Data a confirmar";

  if (!endDate) return formatSingleDate(start);

  const end = parseDateParts(endDate);
  if (!end) return formatSingleDate(start);

  const sameMonthAndYear = start.month === end.month && start.year === end.year;
  if (sameMonthAndYear) {
    const monthName = MONTHS_PT_BR[start.month - 1];
    return `${start.day} e ${end.day} de ${monthName} de ${start.year}`;
  }

  return `${formatSingleDate(start)} até ${formatSingleDate(end)}`;
}

export async function SiteFooter() {
  const cfg = getParty();
  const nextEventDate = formatDateRange(cfg.date, cfg.endDate);

  return (
    <footer className="border-t border-secondary/30 bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Image 
                src={cfg.logo || "/forest-shankara/logo.png"} 
                alt={cfg.name}
                width={120}
                height={40}
                className="h-40 md:h-12 w-auto"
                style={{ 
                  filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.1))',
                }}
              />
            </div>
            <p className="text-muted-foreground max-w-md mx-auto md:mx-0">
              Uma experiência única de música eletrônica em meio à natureza, 
              onde as raízes cósmicas se encontram com a energia da floresta.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              {cfg.socials?.instagram && (
                <a href={cfg.socials.instagram} target="_blank" rel="noopener noreferrer">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors cursor-pointer">Forest Instagram</span>
                </a>
              )}
              {cfg.socials?.instagram2 && (
                <a href={cfg.socials.instagram2} target="_blank" rel="noopener noreferrer">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors cursor-pointer">Shankara Instagram</span>
                </a>
              )}
              {cfg.socials?.ra && (
                <a href={cfg.socials.ra} target="_blank" rel="noopener noreferrer">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors cursor-pointer">RA</span>
                </a>
              )}
              {cfg.socials?.soundcloud && (
                <a href={cfg.socials.soundcloud} target="_blank" rel="noopener noreferrer">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors cursor-pointer">SoundCloud</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 text-center">
            <h3 className="font-semibold text-foreground">Links Rápidos</h3>
            <nav className="flex flex-col space-y-2 items-center">
              {NAV_LINKS.map((l) => (
                <TextButton key={l.href} href={l.href}>{l.label}</TextButton>
              ))}
            </nav>
          </div>

          {/* Event Info */}
          <div className="space-y-4 text-center">
            <h3 className="font-semibold text-foreground">Próximo Evento</h3>
            <div className="space-y-1">
              <p className="text-muted-foreground">
                <strong className="text-foreground">{nextEventDate}</strong>
              </p>
              <p className="text-muted-foreground">
                {cfg.city || "Local a confirmar"}
              </p>

            </div>
            <div className="flex justify-center flex-col items-center gap-2">
            {cfg.venue && cfg.venue_link && (
                <TextButton href={cfg.venue_link} target="_blank" rel="noopener noreferrer" data-ga-event="click_map" data-ga-id="footer_map" data-ga-section="footer">
                  <MapPin className="w-4 h-4" />
                  {cfg.venue}
                </TextButton>
              )}
              {cfg.tickets?.url && (  
              <a href={cfg.tickets?.url || '#'} target="_blank" rel="noopener noreferrer" data-ga-event="click_ticket_cta" data-ga-id="footer_tickets" data-ga-section="footer">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-secondary transition-colors cursor-pointer">
                  <TicketIcon className="w-4 h-4" />
                  {cfg.tickets?.label || "Comprar Ingressos"} 
                  </span>
                </a>  
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-secondary/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {cfg.name}. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Desenvolvido com ❤️ para a comunidade psytrance</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
