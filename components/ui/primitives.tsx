"use client";

/**
 * shadcn-style wrappers around Radix primitives: Tabs, Accordion, Dialog and
 * Sheet (a Dialog that slides in from an edge).
 */
import {
  Accordion as AccordionPrimitive,
  Dialog as DialogPrimitive,
  Tabs as TabsPrimitive,
} from "radix-ui";
import { ChevronDown, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ---- Tabs -------------------------------------------------------------------
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List className={cn("border-border flex gap-1 border-b", className)} {...props} />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "text-fg-muted data-[state=active]:border-accent data-[state=active]:text-fg hover:text-fg -mb-px min-h-11 border-b-2 border-transparent px-4 text-sm font-medium transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;

// ---- Accordion --------------------------------------------------------------
export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn("border-border border-b", className)} {...props} />;
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex w-full items-center justify-between gap-6 py-5 text-left font-serif text-xl",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className="text-accent size-5 shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content className="overflow-hidden" {...props}>
      <div className={cn("text-fg-muted max-w-2xl pb-6 leading-relaxed", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

// ---- Dialog / Sheet ---------------------------------------------------------
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  /** "center" = modal card, "right"/"bottom" = sheet, "full" = full-screen (lightbox). */
  side?: "center" | "right" | "bottom" | "full";
  /** Accessible title when no visible <DialogTitle> is rendered. */
  label?: string;
  children: ReactNode;
}

const sideClass = {
  center:
    "top-1/2 left-1/2 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-sm",
  right: "inset-y-0 right-0 w-full max-w-md",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-lg",
  full: "inset-0",
};

export function DialogContent({
  side = "center",
  label,
  className,
  children,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="animate-fade-in fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        // Let the dialog scroll on its own instead of the page behind it.
        data-lenis-prevent
        className={cn(
          "bg-surface text-fg shadow-soft animate-fade-in fixed z-50 overflow-y-auto",
          sideClass[side],
          className,
        )}
        {...(label ? { "aria-label": label } : {})}
        {...props}
      >
        {label && <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>}
        {children}
        <DialogPrimitive.Close
          className={cn(
            "absolute top-3 right-3 flex size-11 items-center justify-center rounded-sm transition-colors",
            side === "full" ? "bg-black/40 text-white hover:bg-black/60" : "hover:bg-muted",
          )}
          aria-label="Close"
        >
          <X className="size-5" aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
