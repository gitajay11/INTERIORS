import { createClient, type SanityClient } from "@sanity/client";

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? "production";
const apiVersion = process.env.SANITY_API_VERSION ?? "2025-01-01";

/** True when a Sanity project is configured; otherwise the site serves lib/data. */
export const sanityEnabled = Boolean(projectId);

let client: SanityClient | null = null;

export function getSanityClient(): SanityClient | null {
  if (!projectId) return null;
  client ??= createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
    perspective: "published",
  });
  return client;
}

/**
 * Run a GROQ query. Returns `null` when Sanity is not configured, the query
 * fails, or the dataset has no matching documents, so callers can fall back to
 * the bundled demo content instead of rendering an empty site.
 */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T | null> {
  const sanity = getSanityClient();
  if (!sanity) return null;
  try {
    const result = await sanity.fetch<T>(query, params);
    if (result == null || (Array.isArray(result) && result.length === 0)) return null;
    return result;
  } catch (error) {
    console.error("[sanity] query failed, using demo content instead:", error);
    return null;
  }
}

/** GROQ projection that maps a Sanity image field onto our ImageAsset shape. */
export const imageProjection = `{
  "src": asset->url,
  "alt": coalesce(alt, ""),
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height
}`;
