"use client";

/**
 * Multi-step consultation booking form.
 *
 * One React Hook Form instance spans all six steps. "Next" validates only the
 * current step's fields against the shared Zod schema; the final submit sends
 * everything to the `submitConsultation` Server Action, which re-validates.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, Loader2, Paperclip, X } from "lucide-react";
import { submitConsultation, type BookingSuccess } from "@/app/actions";
import { Calendar } from "@/components/forms/Calendar";
import { Turnstile } from "@/components/forms/Turnstile";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, fieldProps } from "@/components/ui/form";
import {
  BUDGET_RANGES,
  COUNTRY_CODES,
  DESIGN_STYLES,
  MEETING_MODES,
  PROPERTY_TYPES,
  bookingSchema,
  bookingStepFields,
  slotsForDate,
  toISODate,
  validateReferenceImage,
  type BookingInput,
} from "@/lib/validations";
import { cn } from "@/lib/utils";

const STEPS = ["Your details", "Property", "Budget", "Style", "Appointment", "Review"];

// Three-colour palette shown on each style card.
const STYLE_PALETTES: Record<(typeof DESIGN_STYLES)[number], [string, string, string]> = {
  Modern: ["#e8e4dc", "#8c8a86", "#2b2926"],
  Minimal: ["#f4f1ea", "#ddd3c4", "#b5a696"],
  Contemporary: ["#d9c9b0", "#6f7355", "#3d4350"],
  Traditional: ["#e6d5b8", "#8a5a3c", "#5a2e23"],
  Industrial: ["#a9a59d", "#5c5852", "#a8663f"],
  Scandinavian: ["#f2efe8", "#c8a67a", "#b8c4c9"],
  Japandi: ["#e3dccf", "#a9b19a", "#2e2b28"],
  Luxury: ["#efebe4", "#b3904f", "#252422"],
};

const MODE_LABELS: Record<(typeof MEETING_MODES)[number], { title: string; text: string }> = {
  "in-studio": {
    title: "At our studio",
    text: "Nungambakkam, Chennai. See the materials library.",
  },
  virtual: { title: "Video call", text: "We will send a link with your confirmation." },
};

interface Availability {
  date: string;
  slots: { time: string; available: boolean }[];
}

/** Selectable card: a styled radio button. */
function Choice({
  selected,
  onSelect,
  children,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "border-border bg-surface relative min-h-12 rounded-sm border p-4 text-left transition-colors",
        selected ? "border-accent ring-accent ring-1" : "hover:bg-muted",
        className,
      )}
    >
      {children}
      {selected && <Check className="text-accent absolute top-3 right-3 size-4" aria-hidden />}
    </button>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-xs font-medium text-red-700 dark:text-red-400">
      {message}
    </p>
  );
}

export function BookingForm() {
  const [step, setStep] = useState(0);
  const [today, setToday] = useState<string | null>(null);
  const [reference, setReference] = useState<File | null>(null);
  const [referenceError, setReferenceError] = useState<string>();
  const [company, setCompany] = useState(""); // honeypot
  const [turnstile, setTurnstile] = useState("");
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<(BookingSuccess & { values: BookingInput }) | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setError,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      countryCode: "+91",
      phone: "",
      city: "",
      appointmentDate: "",
      mode: "in-studio",
      notes: "",
    },
  });

  // "Today" depends on the visitor's clock, so it is only known after mount.
  useEffect(() => setToday(toISODate(new Date())), []);

  const date = watch("appointmentDate");
  const availability = useQuery({
    queryKey: ["availability", date],
    enabled: Boolean(date),
    queryFn: async (): Promise<Availability> => {
      const response = await fetch(`/api/availability?date=${date}`);
      if (!response.ok) throw new Error("Could not load availability");
      return response.json();
    },
  });
  // If availability cannot be loaded, fall back to the day's standard slots;
  // the server checks for clashes again on submit.
  const slots: Availability["slots"] =
    availability.data?.slots ?? slotsForDate(date).map((time) => ({ time, available: true }));

  const goTo = useCallback((next: number) => {
    setStep(next);
    setFormError(undefined);
    // Move focus to the new step's heading so screen readers announce it.
    requestAnimationFrame(() => heading.current?.focus());
  }, []);

  const next = async () => {
    if (await trigger(bookingStepFields[step])) goTo(step + 1);
  };

  const onFile = (file: File | null) => {
    const problem = file ? validateReferenceImage(file) : null;
    setReferenceError(problem ?? undefined);
    setReference(problem ? null : file);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(undefined);
    const formData = new FormData();
    formData.set("payload", JSON.stringify(values));
    formData.set("company", company);
    formData.set("turnstile", turnstile);
    if (reference) formData.set("reference", reference);

    const result = await submitConsultation(formData);
    if (result.ok) {
      setSuccess({ ...result.data, values });
      requestAnimationFrame(() => heading.current?.focus());
      return;
    }
    setFormError(result.error);
    if (result.fieldErrors) {
      const fields = Object.keys(result.fieldErrors) as (keyof BookingInput)[];
      for (const field of fields) setError(field, { message: result.fieldErrors[field] });
      // Jump back to the first step that has a problem.
      const target = bookingStepFields.findIndex((group) =>
        group.some((field) => fields.includes(field)),
      );
      if (target >= 0) setStep(target);
    }
  });

  // ---- Success screen ---------------------------------------------------
  if (success) {
    const v = success.values;
    return (
      <div className="bg-surface border-border rounded-sm border p-8 md:p-12">
        <span className="bg-accent text-accent-fg flex size-12 items-center justify-center rounded-full">
          <Check className="size-6" aria-hidden />
        </span>
        <h2 ref={heading} tabIndex={-1} className="mt-6 text-4xl outline-none md:text-5xl">
          Thank you, {v.name.split(" ")[0]}. Your request is with us.
        </h2>
        <p className="text-fg-muted mt-4 max-w-xl leading-relaxed">
          {success.emailSent
            ? `A confirmation is on its way to ${v.email}. `
            : "Your request has been saved. "}
          We will confirm your appointment within one working day.
        </p>
        <Summary values={v} reference={reference?.name} />
        <p className="text-fg-muted mt-6 text-xs">Reference: {success.id}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/projects">Browse our projects</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const values = getValues();

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Book a consultation">
      {/* ---- Progress indicator ---- */}
      <ol className="mb-10 grid grid-cols-6 gap-2" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li key={label} aria-current={index === step ? "step" : undefined}>
            <button
              type="button"
              // Completed steps can be revisited; later ones are reached with "Next".
              disabled={index > step}
              onClick={() => goTo(index)}
              className="group block w-full text-left"
            >
              <span
                className={cn(
                  "block h-0.5 w-full transition-colors",
                  index <= step ? "bg-accent" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "mt-2 block text-xs tabular-nums",
                  index <= step ? "text-accent font-semibold" : "text-fg-muted",
                )}
              >
                0{index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm md:block",
                  index === step ? "font-medium" : "text-fg-muted",
                )}
              >
                {label}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <p className="text-fg-muted text-sm md:hidden">
        Step {step + 1} of {STEPS.length}
      </p>
      <h2 ref={heading} tabIndex={-1} className="text-4xl outline-none md:text-5xl">
        {
          [
            "Tell us about you",
            "About the property",
            "What is your budget?",
            "Which style feels like you?",
            "Choose a date and time",
            "Review your request",
          ][step]
        }
      </h2>

      <div className="mt-8 min-h-72">
        {/* ---- 1. Client information ---- */}
        {step === 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="name" label="Full name" required error={errors.name?.message}>
              <Input
                {...register("name")}
                {...fieldProps("name", errors.name?.message)}
                autoComplete="name"
              />
            </Field>
            <Field id="email" label="Email" required error={errors.email?.message}>
              <Input
                {...register("email")}
                {...fieldProps("email", errors.email?.message)}
                type="email"
                autoComplete="email"
                spellCheck={false}
              />
            </Field>
            <Field
              id="phone"
              label="Phone"
              required
              error={errors.phone?.message ?? errors.countryCode?.message}
            >
              <div className="flex gap-2">
                <Select
                  {...register("countryCode")}
                  aria-label="Country code"
                  className="w-36 shrink-0"
                  autoComplete="tel-country-code"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </Select>
                <Input
                  {...register("phone")}
                  {...fieldProps("phone", errors.phone?.message)}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                />
              </div>
            </Field>
            <Field id="city" label="City" required error={errors.city?.message}>
              <Input
                {...register("city")}
                {...fieldProps("city", errors.city?.message)}
                autoComplete="address-level2"
              />
            </Field>
          </div>
        )}

        {/* ---- 2. Property ---- */}
        {step === 1 && (
          <div className="space-y-8">
            <Controller
              control={control}
              name="propertyType"
              render={({ field }) => (
                <div>
                  <div
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                    role="radiogroup"
                    aria-label="Property type"
                    aria-describedby="propertyType-error"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <Choice
                        key={type}
                        selected={field.value === type}
                        onSelect={() => field.onChange(type)}
                      >
                        <span className="font-serif text-xl">{type}</span>
                      </Choice>
                    ))}
                  </div>
                  <ErrorText id="propertyType-error" message={errors.propertyType?.message} />
                </div>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="area"
                label="Approximate area (sq.ft)"
                required
                error={errors.area?.message}
              >
                <Input
                  {...register("area", {
                    setValueAs: (value) =>
                      value === "" || value == null ? undefined : Number(value),
                  })}
                  {...fieldProps("area", errors.area?.message)}
                  type="number"
                  inputMode="numeric"
                  min={100}
                  step={50}
                  placeholder="e.g. 1800"
                />
              </Field>
              <Controller
                control={control}
                name="projectKind"
                render={({ field }) => (
                  <div>
                    <p className="mb-1.5 text-sm font-medium" id="kind-label">
                      Type of project{" "}
                      <span className="text-accent" aria-hidden>
                        *
                      </span>
                    </p>
                    <div
                      className="grid grid-cols-2 gap-3"
                      role="radiogroup"
                      aria-labelledby="kind-label"
                      aria-describedby="projectKind-error"
                    >
                      <Choice
                        selected={field.value === "new"}
                        onSelect={() => field.onChange("new")}
                        className="py-2.5"
                      >
                        New interior
                      </Choice>
                      <Choice
                        selected={field.value === "renovation"}
                        onSelect={() => field.onChange("renovation")}
                        className="py-2.5"
                      >
                        Renovation
                      </Choice>
                    </div>
                    <ErrorText id="projectKind-error" message={errors.projectKind?.message} />
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {/* ---- 3. Budget ---- */}
        {step === 2 && (
          <Controller
            control={control}
            name="budget"
            render={({ field }) => (
              <div>
                <div
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  role="radiogroup"
                  aria-label="Project budget"
                  aria-describedby="budget-error"
                >
                  {BUDGET_RANGES.map((range) => (
                    <Choice
                      key={range}
                      selected={field.value === range}
                      onSelect={() => field.onChange(range)}
                    >
                      <span className="font-serif text-xl">{range}</span>
                    </Choice>
                  ))}
                </div>
                <ErrorText id="budget-error" message={errors.budget?.message} />
                <p className="text-fg-muted mt-4 text-sm">
                  Budgets cover design fees, furniture and execution. A range is all we need at this
                  stage.
                </p>
              </div>
            )}
          />
        )}

        {/* ---- 4. Style ---- */}
        {step === 3 && (
          <Controller
            control={control}
            name="style"
            render={({ field }) => (
              <div>
                <div
                  className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                  role="radiogroup"
                  aria-label="Preferred style"
                  aria-describedby="style-error"
                >
                  {DESIGN_STYLES.map((style) => (
                    <Choice
                      key={style}
                      selected={field.value === style}
                      onSelect={() => field.onChange(style)}
                      className="p-0"
                    >
                      <span className="flex h-20 overflow-hidden rounded-t-sm" aria-hidden>
                        {STYLE_PALETTES[style].map((color, index) => (
                          <span
                            key={color}
                            className={index === 0 ? "flex-[3]" : "flex-1"}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                      <span className="block p-3.5 font-serif text-xl">{style}</span>
                    </Choice>
                  ))}
                </div>
                <ErrorText id="style-error" message={errors.style?.message} />
              </div>
            )}
          />
        )}

        {/* ---- 5. Appointment ---- */}
        {step === 4 && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">
                Date{" "}
                <span className="text-accent" aria-hidden>
                  *
                </span>
              </p>
              {today ? (
                <Controller
                  control={control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <Calendar
                      value={field.value}
                      today={today}
                      invalid={Boolean(errors.appointmentDate)}
                      describedBy="appointmentDate-error"
                      onChange={(value) => {
                        field.onChange(value);
                        // A slot chosen for another day may not exist on this one.
                        setValue("timeSlot", undefined as unknown as BookingInput["timeSlot"]);
                      }}
                    />
                  )}
                />
              ) : (
                <div className="bg-muted aspect-square w-full max-w-sm animate-pulse rounded-sm" />
              )}
              <ErrorText id="appointmentDate-error" message={errors.appointmentDate?.message} />
              <p className="text-fg-muted mt-2 text-xs">Monday to Saturday, up to 90 days ahead.</p>
            </div>

            <div className="space-y-7">
              <Controller
                control={control}
                name="timeSlot"
                render={({ field }) => (
                  <div>
                    <p className="mb-2 text-sm font-medium" id="time-label">
                      Time (IST){" "}
                      <span className="text-accent" aria-hidden>
                        *
                      </span>
                    </p>
                    {!date ? (
                      <p className="text-fg-muted text-sm">Choose a date to see available times.</p>
                    ) : (
                      <div
                        className="flex flex-wrap gap-2"
                        role="radiogroup"
                        aria-labelledby="time-label"
                        aria-describedby="timeSlot-error"
                        aria-busy={availability.isFetching}
                      >
                        {slots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            role="radio"
                            aria-checked={field.value === slot.time}
                            disabled={!slot.available}
                            onClick={() => field.onChange(slot.time)}
                            className={cn(
                              "border-border min-h-11 rounded-sm border px-4 text-sm tabular-nums transition-colors",
                              field.value === slot.time
                                ? "border-fg bg-fg text-bg"
                                : "hover:bg-muted",
                              !slot.available && "text-fg-muted line-through opacity-50",
                            )}
                          >
                            {slot.time}
                            {!slot.available && <span className="sr-only"> (already booked)</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    <ErrorText id="timeSlot-error" message={errors.timeSlot?.message} />
                  </div>
                )}
              />

              <Controller
                control={control}
                name="mode"
                render={({ field }) => (
                  <div>
                    <p className="mb-2 text-sm font-medium" id="mode-label">
                      How would you like to meet?
                    </p>
                    <div
                      className="grid gap-3 sm:grid-cols-2"
                      role="radiogroup"
                      aria-labelledby="mode-label"
                    >
                      {MEETING_MODES.map((mode) => (
                        <Choice
                          key={mode}
                          selected={field.value === mode}
                          onSelect={() => field.onChange(mode)}
                        >
                          <span className="block pr-6 font-medium">{MODE_LABELS[mode].title}</span>
                          <span className="text-fg-muted mt-0.5 block text-xs leading-relaxed">
                            {MODE_LABELS[mode].text}
                          </span>
                        </Choice>
                      ))}
                    </div>
                  </div>
                )}
              />

              <Field
                id="notes"
                label="Anything we should know? (optional)"
                error={errors.notes?.message}
              >
                <Textarea
                  {...register("notes")}
                  {...fieldProps("notes", errors.notes?.message)}
                  rows={3}
                  className="min-h-24"
                />
              </Field>
            </div>
          </div>
        )}

        {/* ---- 6. Review ---- */}
        {step === 5 && (
          <div>
            <Summary values={values} reference={reference?.name} onEdit={goTo} />

            <div className="mt-8">
              <p className="mb-1.5 text-sm font-medium">Reference image (optional)</p>
              <p className="text-fg-muted mb-3 text-xs">
                A photo of the space or a look you like. JPG, PNG or WebP, up to 4 MB.
              </p>
              {reference ? (
                <p className="border-border bg-surface inline-flex items-center gap-3 rounded-sm border py-1.5 pr-1.5 pl-3 text-sm">
                  <Paperclip className="size-4" aria-hidden /> {reference.name}
                  <button
                    type="button"
                    onClick={() => onFile(null)}
                    className="hover:bg-muted flex size-9 items-center justify-center rounded-sm"
                    aria-label="Remove image"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </p>
              ) : (
                <label className="border-border hover:bg-muted inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-dashed px-4 text-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)]">
                  <Paperclip className="size-4" aria-hidden /> Choose an image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    aria-describedby="reference-error"
                    onChange={(event) => onFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              <ErrorText id="reference-error" message={referenceError} />
            </div>

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
            <div className="mt-6">
              <Turnstile onToken={setTurnstile} />
            </div>
          </div>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="mt-6 rounded-sm border border-red-600/40 bg-red-600/10 p-4 text-sm font-medium text-red-800 dark:text-red-300"
        >
          {formError}
        </p>
      )}

      <div className="border-border mt-10 flex items-center justify-between gap-4 border-t pt-6">
        <Button
          variant="ghost"
          onClick={() => goTo(step - 1)}
          disabled={step === 0 || isSubmitting}
        >
          <ArrowLeft aria-hidden /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="lg" onClick={next}>
            Continue <ArrowRight aria-hidden />
          </Button>
        ) : (
          <Button size="lg" variant="accent" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden /> Sending…
              </>
            ) : (
              "Submit consultation request"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Summary (review step + success screen)
// ---------------------------------------------------------------------------
function Summary({
  values,
  reference,
  onEdit,
}: {
  values: Partial<BookingInput>;
  reference?: string;
  onEdit?: (step: number) => void;
}) {
  const dateLabel = values.appointmentDate
    ? new Date(`${values.appointmentDate}T00:00:00`).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
  const rows: [string, string, number][] = [
    ["Name", values.name ?? "—", 0],
    ["Contact", `${values.email ?? "—"} · ${values.countryCode ?? ""} ${values.phone ?? ""}`, 0],
    ["City", values.city ?? "—", 0],
    [
      "Property",
      `${values.propertyType ?? "—"} · ${values.area ? `${values.area.toLocaleString("en-IN")} sq.ft` : "—"} · ${values.projectKind === "renovation" ? "Renovation" : "New interior"}`,
      1,
    ],
    ["Budget", values.budget ?? "—", 2],
    ["Style", values.style ?? "—", 3],
    [
      "Appointment",
      `${dateLabel} at ${values.timeSlot ?? "—"} · ${values.mode === "virtual" ? "Video call" : "At our studio"}`,
      4,
    ],
  ];
  if (values.notes) rows.push(["Notes", values.notes, 4]);
  if (reference && !onEdit) rows.push(["Reference image", reference, -1]);

  return (
    <dl className="border-border mt-8 divide-y divide-[var(--border)] border-y">
      {rows.map(([label, value, step]) => (
        <div key={label} className="grid grid-cols-12 gap-x-4 gap-y-1 py-4">
          <dt className="text-fg-muted col-span-12 text-xs font-semibold tracking-[0.16em] uppercase sm:col-span-3 sm:pt-1">
            {label}
          </dt>
          <dd className="col-span-10 leading-relaxed sm:col-span-8">{value}</dd>
          {onEdit && step >= 0 && (
            <dd className="col-span-2 text-right sm:col-span-1">
              <button
                type="button"
                onClick={() => onEdit(step)}
                className="text-accent min-h-9 text-sm font-medium underline underline-offset-4"
              >
                Edit<span className="sr-only"> {label}</span>
              </button>
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
