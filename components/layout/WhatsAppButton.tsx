"use client";

import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/site";

/** Pages that are a form: a floating button there only covers the fields. */
const FORM_PAGES = ["/book", "/contact"];

/** Floating WhatsApp shortcut, bottom-right on marketing pages. */
export function WhatsAppButton() {
  const pathname = usePathname();
  if (FORM_PAGES.includes(pathname)) return null;
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="shadow-soft fixed right-4 bottom-4 z-30 flex size-12 items-center justify-center rounded-full bg-[#128c4a] text-white transition-transform hover:scale-105 active:scale-95 md:right-6 md:bottom-6 md:size-14"
    >
      <svg viewBox="0 0 24 24" className="size-6 md:size-7" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.300-2.900c-.2-.4.2-.4.6-1.200.1-.2 0-.3 0-.5l-.8-1.900c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.300-.9.900-.9 2.200s.9 2.500 1.100 2.700c.1.200 1.800 2.800 4.400 3.900 1.600.7 2.200.7 3 .6.500-.1 1.500-.6 1.700-1.200.2-.600.2-1.100.1-1.200 0-.1-.2-.2-.5-.300Z" />
      </svg>
    </a>
  );
}
