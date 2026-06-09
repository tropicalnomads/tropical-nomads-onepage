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
              Sobre Nós
            </H2>
            <P className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A Forest Shankara nasceu na Ilha da Magia através da união de duas crews que buscam celebrar o Psytrance na sua melhor versão, oferecendo uma estrutura de extrema qualidade pensada nos mínimos detalhes para que todos sintam-se confortáveis desfrutando de toda a energia psicodélica proposta em cada edição.
            </P>
            <P className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto">
              Se você já viveu, sabe. Se não, vem com o coração aberto.
            </P>
          </div>
          <Button asChild size="lg" className="mt-6">
            <a href="/about">
              Conheça Nossa História
              <ArrowRight />
            </a>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
