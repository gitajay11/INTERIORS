"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isBookableDate, toISODate } from "@/lib/validations";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Month-grid date picker. Past dates, Sundays and dates more than 90 days out
 * are disabled. Every day is a real button, so it is fully keyboard operable.
 */
export function Calendar({
  value,
  onChange,
  today,
  invalid,
  describedBy,
}: {
  /** Selected date as "YYYY-MM-DD", or "". */
  value: string;
  onChange: (value: string) => void;
  /** The visitor's current date as "YYYY-MM-DD". */
  today: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [ty, tm] = today.split("-").map(Number);
  const [month, setMonth] = useState(() => {
    const base = value || today;
    const [y, m] = base.split("-").map(Number);
    return { year: y, month: m - 1 };
  });

  const first = new Date(month.year, month.month, 1);
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const title = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const atStart = month.year === ty && month.month === tm - 1;
  const monthsAhead = (month.year - ty) * 12 + (month.month - (tm - 1));
  const shift = (delta: number) =>
    setMonth((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  const nav =
    "hover:bg-muted flex size-10 items-center justify-center rounded-sm disabled:opacity-30";

  return (
    <div
      className={cn(
        "border-border bg-surface w-full max-w-sm rounded-sm border p-4",
        invalid && "border-red-600",
      )}
      role="group"
      aria-label="Choose an appointment date"
      aria-describedby={describedBy}
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          className={nav}
          onClick={() => shift(-1)}
          disabled={atStart}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p className="font-serif text-xl" aria-live="polite">
          {title}
        </p>
        <button
          type="button"
          className={nav}
          onClick={() => shift(1)}
          disabled={monthsAhead >= 3}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="text-fg-muted py-1 text-xs font-medium" aria-hidden>
            {day}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(month.year, month.month, i + 1);
          const iso = toISODate(date);
          const enabled = isBookableDate(iso, today);
          const selected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              onClick={() => onChange(iso)}
              aria-pressed={selected}
              aria-label={date.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              className={cn(
                "flex aspect-square items-center justify-center rounded-sm text-sm tabular-nums transition-colors",
                selected
                  ? "bg-accent text-accent-fg font-semibold"
                  : enabled
                    ? "hover:bg-muted"
                    : "text-fg-muted/40 line-through",
                iso === today && !selected && "ring-border ring-1",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
