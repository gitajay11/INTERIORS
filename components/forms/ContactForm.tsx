"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, Loader2 } from "lucide-react";
import { submitContact } from "@/app/actions";
import { Turnstile } from "@/components/forms/Turnstile";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, fieldProps } from "@/components/ui/form";
import { contactSchema, type ContactInput } from "@/lib/validations";

export function ContactForm() {
  const [company, setCompany] = useState(""); // honeypot
  const [turnstile, setTurnstile] = useState("");
  const [formError, setFormError] = useState<string>();
  const [sent, setSent] = useState<{ name: string; emailSent: boolean } | null>(null);
  const confirmation = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    const result = await submitContact({ values, company, turnstile });
    if (result.ok) {
      setSent({ name: values.name.split(" ")[0], emailSent: result.data.emailSent });
      reset();
      return;
    }
    setFormError(result.error);
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof ContactInput, { message });
    }
  });

  // Move focus to the confirmation so screen readers announce it.
  useEffect(() => {
    if (sent) confirmation.current?.focus();
  }, [sent]);

  if (sent) {
    return (
      <div
        ref={confirmation}
        tabIndex={-1}
        role="status"
        className="bg-surface border-border rounded-sm border p-8 outline-none"
      >
        <span className="bg-accent text-accent-fg flex size-11 items-center justify-center rounded-full">
          <Check className="size-5" aria-hidden />
        </span>
        <h2 className="mt-5 text-3xl">Thank you, {sent.name}.</h2>
        <p className="text-fg-muted mt-3 leading-relaxed">
          Your message has reached the studio
          {sent.emailSent ? " and a copy is on its way to your inbox" : ""}. We reply within two
          working days.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(null)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label="Contact form">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="Name" required error={errors.name?.message}>
          <Input
            {...register("name")}
            {...fieldProps("contact-name", errors.name?.message)}
            autoComplete="name"
          />
        </Field>
        <Field id="contact-email" label="Email" required error={errors.email?.message}>
          <Input
            {...register("email")}
            {...fieldProps("contact-email", errors.email?.message)}
            type="email"
            autoComplete="email"
            spellCheck={false}
          />
        </Field>
        <Field id="contact-phone" label="Phone (optional)" error={errors.phone?.message}>
          <Input
            {...register("phone")}
            {...fieldProps("contact-phone", errors.phone?.message)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
        </Field>
        <Field id="contact-subject" label="Subject" required error={errors.subject?.message}>
          <Input
            {...register("subject")}
            {...fieldProps("contact-subject", errors.subject?.message)}
          />
        </Field>
      </div>
      <Field id="contact-message" label="Message" required error={errors.message?.message}>
        <Textarea
          {...register("message")}
          {...fieldProps("contact-message", errors.message?.message)}
          rows={6}
        />
      </Field>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div className="hidden" aria-hidden>
        <label>
          Company
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </label>
      </div>
      <Turnstile onToken={setTurnstile} />

      {formError && (
        <p
          role="alert"
          className="rounded-sm border border-red-600/40 bg-red-600/10 p-4 text-sm font-medium text-red-800 dark:text-red-300"
        >
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden /> Sending…
          </>
        ) : (
          "Send message"
        )}
      </Button>
    </form>
  );
}
