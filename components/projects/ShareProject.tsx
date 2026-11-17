"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

// Custom minimalist SVG icons for WhatsApp & Pinterest to match Lucide stroke aesthetics
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="8" x2="12" y2="22" />
      <path d="M8 12c-1.5 2.5-1 6.5 4 6.5 4.5 0 7-3.5 7-8a6.5 6.5 0 0 0-13 0c0 3 1.5 5 3.5 5.5" />
    </svg>
  );
}

export function ShareProject({
  title,
  summary,
  slug,
  image,
  className,
}: {
  title: string;
  summary: string;
  slug: string;
  image?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const currentUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/projects/${slug}`
        : `${site.url}/projects/${slug}`;
    setUrl(currentUrl);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, [slug]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: `${title} — ${site.name}`,
        text: summary,
        url,
      });
    } catch {
      // User cancelled or share failed; graceful no-op
    }
  };

  const shareText = encodeURIComponent(`${title} — ${summary}\n${url}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;

  const imageUrl = image?.startsWith("http") ? image : `${site.url}${image ?? ""}`;
  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
    url,
  )}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(
    `${title} by ${site.name}: ${summary}`,
  )}`;

  return (
    <div
      role="region"
      aria-label="Share this project"
      className={cn("flex items-center gap-1.5 sm:gap-2", className)}
    >
      <span className="text-fg-muted mr-1 hidden text-xs font-medium tracking-wider uppercase sm:inline">
        Share
      </span>

      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          className="border-border text-fg-muted hover:text-fg hover:bg-muted focus-visible:outline-accent flex size-9 items-center justify-center rounded-sm border transition-colors sm:hidden"
          title="Share"
          aria-label="Share project"
        >
          <Share2 className="size-4" aria-hidden />
        </button>
      )}

      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border text-fg-muted hover:text-fg hover:bg-muted focus-visible:outline-accent inline-flex size-9 items-center justify-center rounded-sm border transition-colors"
        title="Share on WhatsApp"
        aria-label="Share on WhatsApp"
      >
        <WhatsAppIcon className="size-4" />
      </a>

      {/* Pinterest */}
      <a
        href={pinterestUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="border-border text-fg-muted hover:text-fg hover:bg-muted focus-visible:outline-accent inline-flex size-9 items-center justify-center rounded-sm border transition-colors"
        title="Pin on Pinterest"
        aria-label="Pin on Pinterest"
      >
        <PinterestIcon className="size-4" />
      </a>

      {/* Copy Link */}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "border-border text-fg-muted hover:text-fg hover:bg-muted focus-visible:outline-accent relative inline-flex size-9 items-center justify-center rounded-sm border transition-colors",
          copied && "border-accent text-accent",
        )}
        title={copied ? "Link copied" : "Copy link"}
        aria-label={copied ? "Link copied to clipboard" : "Copy project link"}
      >
        {copied ? (
          <Check className="text-accent size-4" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
      </button>

      {/* Screen reader announcement */}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Project link copied to clipboard" : ""}
      </span>
    </div>
  );
}
