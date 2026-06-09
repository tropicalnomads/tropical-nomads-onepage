import { getFAQ } from "@/lib/party";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { H1, P } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

function renderAnswerWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a 
          key={index}
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-secondary hover:text-secondary/80 underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function FAQ() {
  const items = getFAQ();
  
  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <H1 className="text-4xl md:text-5xl font-bold">Perguntas Frequentes</H1>
        <P className="text-lg text-muted-foreground">
          Encontre respostas para as dúvidas mais comuns sobre o Forest Shankara
        </P>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <Card key={category} className="border border-secondary/30">
            <CardContent className="px-4 py-3">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-base font-medium">
                    {category}
                  </Badge>
                  <span className="text-base text-muted-foreground">
                    {categoryItems.length} pergunta{categoryItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <Accordion type="multiple" className="w-full">
                  {categoryItems.map((item, index) => (
                    <AccordionItem key={index} value={`${category}-${index}`}>
                      <AccordionTrigger className="text-left hover:no-underline text-base">
                        <span className="font-medium">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                        {renderAnswerWithLinks(item.answer)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
