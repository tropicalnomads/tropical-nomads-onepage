import { getParty, getGeneral, getPosts } from "@/lib/party";
import { EventBanner } from "@/components/event-banner";
import { LatestPosts } from "@/components/latest-posts";
import { AboutUsSection } from "@/components/about-us-section";

export default function Home() {
  const config = getParty();
  // const events = getEvents();
  const general = getGeneral();
  const posts = getPosts();

  return (
    <div className="w-full space-y-16">
      {/* Hero Banner */}
      <EventBanner config={config} general={general} />
      
      {/* Latest Posts */}
      <LatestPosts allPosts={posts} />

      {/* About Us Section */}
      <AboutUsSection />

      {/* Past & Upcoming Events */}
      {/* <section className="w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold">Past & Upcoming Events</h2>
          <p className="text-muted-foreground">
            Explore our journey through previous editions and upcoming gatherings
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(e => (
            <a key={e.slug} href={`/events/${e.slug}`} className="block group">
              <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                <span className="text-4xl">🎪</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {e.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(e.date).toLocaleDateString('pt-BR')} — {e.city}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section> */}
    </div>
  );
}
