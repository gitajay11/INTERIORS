"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

/** Share links for an article. `url` must be absolute. */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const targets = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { name: "Email", href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const item =
    "border-border hover:bg-muted inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Share this article">
      {targets.map((target) => (
        <a
          key={target.name}
          href={target.href}
          target={target.name === "Email" ? undefined : "_blank"}
          rel="noopener noreferrer"
          className={item}
          aria-label={`Share on ${target.name}`}
        >
          {target.name}
        </a>
      ))}
      <button type="button" onClick={copy} className={item}>
        {copied ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Link2 className="size-4" aria-hidden />
        )}
        <span role="status">{copied ? "Copied" : "Copy link"}</span>
      </button>
    </div>
  );
}
