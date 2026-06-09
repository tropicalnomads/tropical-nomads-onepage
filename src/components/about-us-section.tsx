import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { H2, P } from "@/components/ui/typography";
import { ArrowRight } from "lucide-react";

export function AboutUsSection() {
  return (
    <section className="w-full">
      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border border-secondary/20">
        <CardContent className="p-8 md:p-12 text-center space-y-6">
          <div className="space-y-4">
            <H2 className="text-3xl md:text-4xl font-bold">
              About Us
            </H2>
            <P className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Tropical Nomads was born to connect dance floors across Europe through carefully curated artists,
              immersive production, and strong community energy.
            </P>
            <P className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto">
              If you have lived it, you know. If not, come with an open mind.
            </P>
          </div>
          <Button asChild size="lg" className="mt-6">
            <a href="/events-site/about">
              Discover our story
              <ArrowRight />
            </a>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
