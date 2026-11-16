import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "border-border bg-surface placeholder:text-fg-muted/70 w-full rounded-sm border px-3.5 text-[0.9375rem] transition-colors focus-visible:border-accent aria-[invalid=true]:border-red-600 disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldClass, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldClass, "min-h-32 py-3", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(fieldClass, "h-11 appearance-auto", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium", className)} {...props} />;
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + error message, wired for assistive tech. Give the control
 * `id={id}`, `aria-invalid` and `aria-describedby={`${id}-error`}`.
 */
export function Field({ id, label, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-accent" aria-hidden>
            {" "}
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && <p className="text-fg-muted mt-1.5 text-xs">{hint}</p>}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Props that connect a control to its <Field>. */
export function fieldProps(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}
