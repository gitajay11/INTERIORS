import type { RichText } from "@/lib/types";

/**
 * Tiny authoring helper for the bundled content: turns paragraphs into
 * Portable Text, the format `RichTextBody` renders.
 *
 *   "## Heading"   → h2
 *   "### Heading"  → h3
 *   "> Quote"      → blockquote
 *   "- item"       → bullet list item
 *   anything else  → paragraph
 */
export function blocks(...paragraphs: string[]): RichText {
  return paragraphs.map((text, index) => {
    let style = "normal";
    let content = text;
    let listItem: "bullet" | undefined;
    if (text.startsWith("### ")) {
      style = "h3";
      content = text.slice(4);
    } else if (text.startsWith("## ")) {
      style = "h2";
      content = text.slice(3);
    } else if (text.startsWith("> ")) {
      style = "blockquote";
      content = text.slice(2);
    } else if (text.startsWith("- ")) {
      listItem = "bullet";
      content = text.slice(2);
    }
    return {
      _type: "block",
      _key: `b${index}`,
      style,
      ...(listItem ? { listItem, level: 1 } : {}),
      markDefs: [],
      children: [{ _type: "span", _key: `s${index}`, text: content, marks: [] }],
    };
  });
}

/** Plain text of a Portable Text document (reading time, excerpts, JSON-LD). */
export function toPlainText(body: RichText): string {
  return body
    .map((block) =>
      Array.isArray(block.children)
        ? block.children.map((child) => ("text" in child ? String(child.text) : "")).join("")
        : "",
    )
    .join("\n\n");
}

export function readingTime(body: RichText): number {
  const words = toPlainText(body).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Headings for a table of contents. */
export function headings(body: RichText): { id: string; text: string; level: 2 | 3 }[] {
  return body
    .filter((block) => block.style === "h2" || block.style === "h3")
    .map((block) => {
      const text = toPlainText([block]);
      return {
        id: text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        text,
        level: block.style === "h2" ? 2 : 3,
      };
    });
}
