import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { ReactNode } from "react";
import type { RichText } from "@/lib/types";
import { slugify } from "@/lib/utils";

/** Text content of rendered children, used to derive stable heading ids. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}

const components: PortableTextComponents = {
  block: {
    // Heading ids match `headings()` in lib/data/rich-text.ts (table of contents).
    h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
    h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },
  marks: {
    link: ({ value, children }) => {
      const href = typeof value?.href === "string" ? value.href : "#";
      const external = /^https?:/.test(href);
      return (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {children}
        </a>
      );
    },
  },
};

/** Renders Portable Text (from Sanity or the demo content) with the site's prose styles. */
export function RichTextBody({ value, className = "" }: { value: RichText; className?: string }) {
  return (
    <div className={`prose-studio ${className}`}>
      <PortableText value={value} components={components} />
    </div>
  );
}
