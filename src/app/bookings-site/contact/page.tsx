import { BookingContactClient } from "./contact-client";

export default function BookingsContactPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Book an Artist</h1>
      <p className="text-muted-foreground">
        Tell us your venue, date, and budget, and we will get back with the best artist match.
      </p>
      <BookingContactClient />
    </div>
  );
}

