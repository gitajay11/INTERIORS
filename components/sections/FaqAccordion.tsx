"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/primitives";

export function FaqAccordion({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <Accordion type="single" collapsible className="border-border border-t">
      {faqs.map((faq, index) => (
        <AccordionItem key={faq.question} value={`faq-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
