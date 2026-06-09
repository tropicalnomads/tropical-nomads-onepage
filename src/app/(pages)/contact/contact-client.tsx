"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { H1, P } from "@/components/ui/typography"
import { Instagram, MessageCircle } from "lucide-react"
import { sendEvent } from "@/lib/gtag"
import type { PartyConfig } from "@/lib/types"

interface ContactPageClientProps {
  config: PartyConfig
}

export function ContactPageClient({ config }: ContactPageClientProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <H1 className="text-4xl md:text-5xl font-bold">Contato</H1>
        <P className="text-lg text-muted-foreground">
          Entre em contato conosco através do Instagram! 
          Envie uma mensagem direta para qualquer uma de nossas contas oficiais.
        </P>
      </div>

      <Card className="border border-secondary/30">
        <CardContent className="p-6 md:p-8 text-center space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">Escolha uma das nossas contas oficiais:</span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {config.socials?.instagram && (
                <Button 
                  size="lg" 
                  variant="default"
                  className="w-full h-16 text-base"
                  onClick={() => {
                    sendEvent("contact_click", { method: "instagram", handle: "forest", page_path: window.location.pathname })
                    window.open(config.socials?.instagram, '_blank')
                  }}
                >
                  <Instagram className="w-5 h-5 mr-2" />
                  Forest Instagram
                </Button>
              )}
              
              {config.socials?.instagram2 && (
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="w-full h-16 text-base"
                  onClick={() => {
                    sendEvent("contact_click", { method: "instagram", handle: "shankara", page_path: window.location.pathname })
                    window.open(config.socials?.instagram2, '_blank')
                  }}
                >
                  <Instagram className="w-5 h-5 mr-2" />
                  Shankara Instagram
                </Button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-secondary/20">
            <P className="text-sm text-muted-foreground">
              💬 Clique em qualquer botão acima para abrir o Instagram e enviar sua mensagem diretamente!
            </P>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
