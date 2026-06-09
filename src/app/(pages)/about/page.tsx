import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { H1, H2, H3, P } from "@/components/ui/typography";
import { ArrowLeft, Heart, Music, Users, Sparkles, Mail } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <H1 className="text-4xl md:text-5xl font-bold">
          Sobre Nós
        </H1>
        <P className="text-lg text-muted-foreground">
          A história por trás da Forest Shankara
        </P>
      </div>

      {/* Main Story */}
      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border border-secondary/20">
        <CardContent className="p-8 md:p-12">
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <H2 className="text-2xl md:text-3xl font-bold">
                Nossa História
              </H2>
              <P className="text-lg md:text-xl text-foreground leading-relaxed max-w-3xl mx-auto">
              A Forest Shankara nasceu na Ilha da Magia através da união de duas crews que buscam celebrar o Psytrance na sua melhor versão, oferecendo uma estrutura de extrema qualidade pensada nos mínimos detalhes para que todos sintam-se confortáveis desfrutando de toda a energia psicodélica proposta em cada edição.
              </P>
              <P className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Se você já viveu, sabe. Se não, vem com o coração aberto.
              </P>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center border border-secondary/30">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center border border-secondary/30">
              <Music className="w-6 h-6 text-secondary/70" />
            </div>
            <h3 className="font-semibold text-lg">Música</h3>
            <p className="text-sm text-muted-foreground">
              Do diurno ao noturno, sem barreiras de vertentes.
              </p>
          </CardContent>
        </Card>

        <Card className="text-center border border-secondary/30">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center border border-secondary/30">
              <Sparkles className="w-6 h-6 text-secondary/70" />
            </div>
            <h3 className="font-semibold text-lg">Arte</h3>
            <p className="text-sm text-muted-foreground">
              Feira mix, espaço de arte, pinturas ao vivo, intervenções artísticas e muito mais.
            </p>
          </CardContent>
        </Card>

        <Card className="text-center border border-secondary/30">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center border border-secondary/30">
              <Heart className="w-6 h-6 text-secondary/70" />
            </div>
            <h3 className="font-semibold text-lg">Conexão</h3>
            <p className="text-sm text-muted-foreground">
              Criando laços autênticos através de experiências compartilhadas
            </p>
          </CardContent>
        </Card>

        <Card className="text-center border border-secondary/30">
          <CardContent className="p-6 space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center border border-secondary/30">
              <Users className="w-6 h-6 text-secondary/70" />
            </div>
            <h3 className="font-semibold text-lg">Comunidade</h3>
            <p className="text-sm text-muted-foreground">
              Espaço kids e ambiente familiar, onde você traz a família e juntos fortalecemos a comunidade local.
            </p>
          </CardContent>
        </Card>


      </div>

      {/* Call to Action */}
      <div className="text-center space-y-6">
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border border-secondary/20">
          <CardContent className="p-8">
            <H3 className="text-2xl font-bold mb-4">
              Faça Parte da Nossa Jornada
            </H3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Junte-se a nós nesta experiência única de música, arte e conexão. 
              Cada evento é uma nova oportunidade de transformação e descoberta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* <Button asChild size="lg">
                <Link href="/events">
                  <Calendar />
                  Próximos Eventos
                </Link>
              </Button> */}
              <Button asChild variant="secondary" size="lg">
                <Link href="/contact">
                  <Mail />
                  Entre em Contato
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft />
            Voltar ao Início
          </Link>
        </Button>
      </div>
    </div>
  );
}
