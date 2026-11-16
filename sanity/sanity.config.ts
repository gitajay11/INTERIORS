import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemas";

// Run the studio from this folder: see README → "CMS setup".
export default defineConfig({
  name: "interiors",
  title: "Interiors",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
