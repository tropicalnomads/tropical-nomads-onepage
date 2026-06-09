import Image from "next/image";
import Link from "next/link";

import { getEditionMeta, listEditions } from "@/lib/party";

export default function PastEventsPage() {
  const editions = listEditions("events");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Past Events</h1>
        <p className="text-muted-foreground">Photos and videos from previous editions.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {editions.map((edition) => {
          const meta = getEditionMeta("events", edition.id);
          return (
            <Link
              className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-emerald-400"
              href={`/events-site/past/${edition.slug}`}
              key={edition.id}
            >
              <div className="relative aspect-[4/3] bg-muted">
                {meta?.mainArt ? (
                  <Image alt={edition.title} className="object-cover" fill src={meta.mainArt} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Media coming soon</div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold">{edition.title}</h2>
                <p className="text-sm text-muted-foreground">{meta?.city || "Europe"}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

