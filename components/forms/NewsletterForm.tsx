"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot

  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const subscribe = async () => {
    setStatus("pending");
    try {
      const result = await subscribeNewsletter(email, company);
      if (!result.ok) throw new Error(result.error);
      setEmail("");
      setStatus("success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p className="text-olive mt-4 flex items-center gap-2 text-sm font-medium" role="status">
        <Check className="size-4" aria-hidden /> You are on the list. Thank you.
      </p>
    );
  }

  return (
    <form
      className="mt-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void subscribe();
      }}
    >
      <div className="border-border focus-within:border-accent flex max-w-sm border-b transition-colors">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={status === "error" || undefined}
          aria-describedby={status === "error" ? "newsletter-error" : undefined}
          className="placeholder:text-fg-muted/70 h-11 min-w-0 flex-1 bg-transparent text-[0.9375rem] outline-none"
        />
        {/* Honeypot: hidden from people, irresistible to bots. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className="hidden"
          aria-hidden
        />
        <button
          type="submit"
          disabled={status === "pending"}
          className="hover:text-accent flex size-11 items-center justify-center transition-colors disabled:opacity-50"
          aria-label="Subscribe"
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      {status === "error" && (
        <p
          id="newsletter-error"
          role="alert"
          className="mt-2 text-xs font-medium text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </form>
  );
}
