import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default Open Graph card; pages with their own imagery override it in metadata. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#f7f3ec",
        color: "#2b2926",
        fontFamily: "serif",
      }}
    >
      <div style={{ fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "#86642a" }}>
        Interior design studio
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 120, lineHeight: 1 }}>{site.name}</div>
        <div style={{ fontSize: 46, marginTop: 24, color: "#6a6258" }}>{site.tagline}</div>
      </div>
      <div style={{ display: "flex", height: 6, width: 160, background: "#86642a" }} />
    </div>,
    size,
  );
}
