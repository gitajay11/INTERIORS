/**
 * Sanity schemas for Interiors.
 *
 * Field names mirror the GROQ projections in lib/content.ts, so documents
 * created with these schemas appear on the site without any mapping code.
 * See README → "CMS setup".
 */
import { defineArrayMember, defineField, defineType } from "sanity";

const imageWithAlt = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alternative text",
        type: "string",
        description: "Describe the image for people who cannot see it.",
        validation: (rule) => rule.required(),
      }),
    ],
  });

const slug = (source: string) =>
  defineField({
    name: "slug",
    title: "Slug",
    type: "slug",
    options: { source, maxLength: 96 },
    validation: (rule) => rule.required(),
  });

const PROJECT_CATEGORIES = ["Living", "Kitchen", "Bedroom", "Office", "Retail", "Hospitality", "Villa", "Apartment"];
const FLOORS = ["oak", "walnut", "herringbone", "marble", "concrete", "tiles"];
const variantField = (name: string, title: string, options: string[]) =>
  defineField({ name, title, type: "string", options: { list: options } });

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "media", title: "Media" },
    { name: "scene", title: "3D scene" },
  ],
  fields: [
    defineField({ name: "title", title: "Title", type: "string", group: "details", validation: (rule) => rule.required() }),
    { ...slug("title"), group: "details" },
    defineField({ name: "summary", title: "Summary", type: "text", rows: 2, group: "details", validation: (rule) => rule.required().max(180) }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      group: "details",
      options: { list: ["residential", "commercial"], layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "category", title: "Category", type: "string", group: "details", options: { list: PROJECT_CATEGORIES }, validation: (rule) => rule.required() }),
    defineField({ name: "clientType", title: "Client type", type: "string", group: "details" }),
    defineField({ name: "location", title: "Location", type: "string", group: "details", validation: (rule) => rule.required() }),
    defineField({ name: "area", title: "Area (sq.ft)", type: "number", group: "details", validation: (rule) => rule.required().positive() }),
    defineField({ name: "year", title: "Year", type: "number", group: "details", validation: (rule) => rule.required().min(2000).max(2100) }),
    defineField({ name: "duration", title: "Duration", type: "string", group: "details" }),
    defineField({ name: "budgetRange", title: "Budget range", type: "string", group: "details" }),
    defineField({ name: "style", title: "Style", type: "string", group: "details" }),
    defineField({ name: "featured", title: "Featured on the home page", type: "boolean", group: "details", initialValue: false }),
    defineField({ name: "description", title: "Description", type: "array", group: "details", of: [defineArrayMember({ type: "block" })] }),
    defineField({ name: "materials", title: "Materials used", type: "array", group: "details", of: [defineArrayMember({ type: "reference", to: [{ type: "material" }] })] }),

    { ...imageWithAlt("coverImage", "Cover image"), group: "media", validation: (rule) => rule.required() },
    defineField({ name: "gallery", title: "Gallery", type: "array", group: "media", of: [defineArrayMember(imageWithAlt("image", "Image"))] }),
    { ...imageWithAlt("beforeImage", "Before image"), group: "media" },
    { ...imageWithAlt("afterImage", "After image"), group: "media" },
    defineField({
      name: "floorPlan",
      title: "Floor plan hotspots",
      type: "array",
      group: "media",
      description: "Positions are in room metres: x from -3.5 (left) to 3.5, z from -2.75 (back) to 2.75.",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string" }),
            defineField({ name: "x", title: "X", type: "number" }),
            defineField({ name: "z", title: "Z", type: "number" }),
            defineField({ name: "galleryIndex", title: "Gallery photo (0 = first)", type: "number" }),
          ],
        }),
      ],
    }),

    defineField({
      name: "model3D",
      title: "3D model (GLB)",
      type: "file",
      group: "scene",
      options: { accept: ".glb" },
      description: "Optional. Draco or Meshopt compressed, under 5 MB. Without it the procedural room below is used.",
    }),
    defineField({ name: "layout", title: "Room layout", type: "string", group: "scene", options: { list: ["living", "bedroom", "dining", "office"] }, initialValue: "living" }),
    defineField({ name: "wallColor", title: "Wall colour (hex)", type: "string", group: "scene", validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/) }),
    defineField({ name: "floor", title: "Floor", type: "string", group: "scene", options: { list: FLOORS } }),
    defineField({ name: "fabricColor", title: "Upholstery colour (hex)", type: "string", group: "scene", validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/) }),
    defineField({
      name: "variants",
      title: "Furniture variants",
      type: "object",
      group: "scene",
      fields: [
        variantField("sofa", "Sofa", ["lounge", "curve", "sectional"]),
        variantField("table", "Coffee table", ["round", "slab", "nest"]),
        variantField("chairs", "Armchairs", ["club", "frame"]),
        variantField("rug", "Rug", ["wool", "jute"]),
        variantField("lamps", "Lamps", ["arc", "tripod"]),
        variantField("shelves", "Shelving", ["open", "credenza"]),
        variantField("decor", "Art & plants", ["gallery", "minimal"]),
      ],
    }),
    defineField({ name: "initialPreset", title: "Starting camera", type: "string", group: "scene", options: { list: ["front", "top", "corner", "closeup"] }, initialValue: "corner" }),
  ],
  preview: { select: { title: "title", subtitle: "location", media: "coverImage" } },
});

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    slug("title"),
    defineField({ name: "order", title: "Order", type: "number" }),
    defineField({ name: "icon", title: "Icon", type: "string", options: { list: ["home", "building", "ruler", "sofa", "lamp", "hammer"] }, validation: (rule) => rule.required() }),
    defineField({ name: "summary", title: "Summary", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "description", title: "Description paragraphs", type: "array", of: [defineArrayMember({ type: "text" })] }),
    defineField({ name: "included", title: "What is included", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({
      name: "process",
      title: "Process",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [defineField({ name: "title", type: "string", title: "Title" }), defineField({ name: "text", type: "text", title: "Text" })],
        }),
      ],
    }),
    defineField({
      name: "faqs",
      title: "FAQs",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [defineField({ name: "question", type: "string", title: "Question" }), defineField({ name: "answer", type: "text", title: "Answer" })],
        }),
      ],
    }),
    imageWithAlt("image", "Image"),
    defineField({ name: "sampleCategories", title: "Sample project categories", type: "array", of: [defineArrayMember({ type: "string", options: { list: PROJECT_CATEGORIES } })] }),
  ],
});

export const teamMember = defineType({
  name: "teamMember",
  title: "Team member",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (rule) => rule.required() }),
    slug("name"),
    defineField({ name: "order", title: "Order", type: "number" }),
    defineField({ name: "role", title: "Role", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "bio", title: "Biography paragraphs", type: "array", of: [defineArrayMember({ type: "text" })] }),
    defineField({ name: "expertise", title: "Expertise", type: "array", of: [defineArrayMember({ type: "string" })] }),
    imageWithAlt("photo", "Portrait"),
    defineField({ name: "tint", title: "Placeholder tint (hex)", type: "string", description: "Background of the monogram shown when there is no portrait." }),
    defineField({
      name: "socials",
      title: "Social links",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [defineField({ name: "name", type: "string", title: "Network" }), defineField({ name: "href", type: "url", title: "URL" })],
        }),
      ],
    }),
  ],
  preview: { select: { title: "name", subtitle: "role", media: "photo" } },
});

export const material = defineType({
  name: "material",
  title: "Material",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (rule) => rule.required() }),
    slug("name"),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: { list: ["Wood finishes", "Marble & stone", "Paint colors", "Flooring", "Fabrics & textures"] },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "origin", title: "Origin", type: "string" }),
    defineField({ name: "finish", title: "Finish", type: "string" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({ name: "useCases", title: "Use cases", type: "array", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "maintenance", title: "Maintenance", type: "text", rows: 2 }),
    defineField({
      name: "surface",
      title: "Surface (swatch + 3D preview)",
      type: "object",
      description: "Drives the procedural texture. See lib/surfaces.ts.",
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: "pattern",
          title: "Pattern",
          type: "string",
          options: { list: ["planks", "herringbone", "marble", "concrete", "tiles", "paint", "fabric", "stone", "terrazzo"] },
          validation: (rule) => rule.required(),
        }),
        defineField({ name: "base", title: "Base colour (hex)", type: "string", validation: (rule) => rule.required().regex(/^#[0-9a-fA-F]{6}$/) }),
        defineField({ name: "accent", title: "Accent colour (hex)", type: "string", validation: (rule) => rule.required().regex(/^#[0-9a-fA-F]{6}$/) }),
        defineField({ name: "rows", title: "Boards / tiles per repeat", type: "number" }),
        defineField({ name: "roughness", title: "Roughness (0–1)", type: "number", validation: (rule) => rule.min(0).max(1) }),
      ],
    }),
  ],
});

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Client name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "projectType", title: "Project type", type: "string" }),
    defineField({ name: "location", title: "Location", type: "string" }),
    defineField({ name: "rating", title: "Rating", type: "number", validation: (rule) => rule.required().min(1).max(5).integer() }),
    defineField({ name: "quote", title: "Quote", type: "text", rows: 4, validation: (rule) => rule.required() }),
    defineField({ name: "tint", title: "Avatar tint (hex)", type: "string" }),
  ],
});

export const award = defineType({
  name: "award",
  title: "Award",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "organisation", title: "Organisation", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "year", title: "Year", type: "number", validation: (rule) => rule.required() }),
    defineField({ name: "project", title: "Project", type: "string" }),
  ],
});

export const category = defineType({
  name: "category",
  title: "Journal category",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Must match one of: Interior design trends, Design tips, Material guides, Project stories, Inspiration.",
      validation: (rule) => rule.required(),
    }),
    slug("title"),
  ],
});

export const post = defineType({
  name: "post",
  title: "Journal post",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    slug("title"),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 2, validation: (rule) => rule.required().max(200) }),
    defineField({ name: "category", title: "Category", type: "reference", to: [{ type: "category" }], validation: (rule) => rule.required() }),
    defineField({ name: "publishedAt", title: "Published", type: "date", validation: (rule) => rule.required() }),
    defineField({ name: "author", title: "Author", type: "reference", to: [{ type: "teamMember" }] }),
    { ...imageWithAlt("coverImage", "Cover image"), validation: (rule) => rule.required() },
    defineField({ name: "featured", title: "Featured", type: "boolean", initialValue: false }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [defineArrayMember({ type: "block", styles: [{ title: "Normal", value: "normal" }, { title: "Heading", value: "h2" }, { title: "Subheading", value: "h3" }, { title: "Quote", value: "blockquote" }] })],
    }),
  ],
  preview: { select: { title: "title", subtitle: "publishedAt", media: "coverImage" } },
});

export const schemaTypes = [project, service, teamMember, material, testimonial, award, post, category];
