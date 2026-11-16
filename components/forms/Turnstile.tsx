"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      theme: string;
    },
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Cloudflare Turnstile widget. Renders nothing when no site key is configured,
 * in which case the server-side check is skipped as well.
 */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !container.current) return;
    let widgetId: string | undefined;
    let cancelled = false;

    const render = () => {
      if (cancelled || !window.turnstile || !container.current) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: SITE_KEY,
        callback: onToken,
        "expired-callback": () => onToken(""),
        theme: "auto",
      });
    };

    if (window.turnstile) {
      render();
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={container} className="min-h-[65px]" />;
}
