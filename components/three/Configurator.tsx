"use client";

/**
 * 3D Design Studio: the full-viewport room configurator.
 *
 * All design state lives in the Zustand store (persisted to localStorage and
 * mirrored into the URL), so this component is only wiring: store → viewer on
 * one side, store ← panel controls on the other.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  CalendarCheck,
  Check,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Link2,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { LazyRoomViewer, type RoomViewerHandle } from "./LazyRoomViewer";
import {
  CAMERA_PRESETS,
  FABRIC_SWATCHES,
  FLOORS,
  FLOOR_IDS,
  FURNITURE,
  PRESET_IDS,
  SLOT_IDS,
  WALL_SWATCHES,
  isHexColor,
} from "./catalog";
import { Button } from "@/components/ui/button";
import { SwatchCanvas } from "@/components/ui/SwatchCanvas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { decodeConfig, encodeConfig } from "@/lib/design-config";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";
import { cn } from "@/lib/utils";

const sectionTitle = "text-fg-muted mb-3 text-xs font-semibold tracking-[0.18em] uppercase";

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-accent" : "bg-border",
      )}
    >
      <span
        className={cn(
          "bg-surface absolute top-0.5 left-0.5 size-5 rounded-full shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

function ColorSwatches({
  swatches,
  value,
  onSelect,
  label,
}: {
  swatches: { name: string; hex: string }[];
  value: string;
  onSelect: (hex: string) => void;
  label: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label={label}>
      {swatches.map((swatch) => {
        const selected = swatch.hex === value.toLowerCase();
        return (
          <button
            key={swatch.hex}
            type="button"
            onClick={() => onSelect(swatch.hex)}
            aria-pressed={selected}
            title={swatch.name}
            className="group text-left"
          >
            <span
              className={cn(
                "border-border relative block aspect-square rounded-sm border transition-shadow",
                selected && "ring-accent ring-offset-surface ring-2 ring-offset-2",
              )}
              style={{ backgroundColor: swatch.hex }}
            >
              {selected && (
                <Check
                  className="absolute inset-0 m-auto size-4 text-white mix-blend-difference"
                  aria-hidden
                />
              )}
            </span>
            <span className="text-fg-muted mt-1.5 block text-[11px] leading-tight">
              {swatch.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Configurator() {
  const viewer = useRef<RoomViewerHandle>(null);
  const { resolvedTheme } = useTheme();
  const [panelOpen, setPanelOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [customHex, setCustomHex] = useState("");

  const config = useConfiguratorStore((s) => s.config);
  const camera = useConfiguratorStore((s) => s.camera);
  const hydrated = useConfiguratorStore((s) => s.hydrated);
  const actions = useConfiguratorStore();

  // Load the design once on the client: a shared link wins over the saved design.
  useEffect(() => {
    const store = useConfiguratorStore;
    void Promise.resolve(store.persist.rehydrate()).then(() => {
      const shared = decodeConfig(new URLSearchParams(window.location.search));
      if (shared) store.getState().applyConfig(shared);
      store.getState().markHydrated();
    });
  }, []);

  // Keep the address bar shareable at all times.
  const query = encodeConfig(config);
  useEffect(() => {
    if (!hydrated) return;
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(window.history.state, "", url);
  }, [query, hydrated]);

  const download = useCallback(() => {
    const dataUrl = viewer.current?.screenshot();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "interiors-design.png";
    link.click();
  }, []);

  const share = useCallback(async () => {
    const url = `${window.location.origin}/studio${query ? `?${query}` : ""}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard can be blocked (permissions, insecure origin): show the link instead.
      window.prompt("Copy this link to share your design:", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [query]);

  const applyCustomHex = (value: string) => {
    setCustomHex(value);
    const hex = value.startsWith("#") ? value : `#${value}`;
    if (isHexColor(hex)) actions.setWallColor(hex);
  };

  const isCustomWall = !WALL_SWATCHES.some((swatch) => swatch.hex === config.wall);

  return (
    <div className="flex h-dvh flex-col pt-22 lg:flex-row">
      {/* ---- Viewer ---- */}
      <div className="relative min-h-0 flex-1">
        <LazyRoomViewer
          handleRef={viewer}
          className="size-full"
          config={config}
          cameraCommand={camera}
          furnitureVisible={!config.empty}
          onFurnitureToggle={actions.toggleEmptyRoom}
          onResetCamera={actions.resetCamera}
          shortcuts="global"
          preserveDrawingBuffer
          background={resolvedTheme === "dark" ? "#26231f" : "#e7e1d6"}
          fallbackImage="/images/hero.jpg"
          label="Interactive 3D room. Use the panel to change walls, floor and furniture."
        />

        {/* action bar */}
        <div className="absolute top-3 right-3 z-20 flex flex-wrap justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="bg-surface/90 backdrop-blur"
            onClick={download}
          >
            <Download aria-hidden /> <span className="hidden sm:inline">Download PNG</span>
            <span className="sr-only sm:hidden">Download PNG</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-surface/90 backdrop-blur"
            onClick={share}
          >
            {copied ? <Check aria-hidden /> : <Link2 aria-hidden />}
            <span className="hidden sm:inline">{copied ? "Link copied" : "Share"}</span>
            <span className="sr-only sm:hidden">Share design link</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-surface/90 hidden backdrop-blur lg:inline-flex"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-controls="studio-panel"
          >
            {panelOpen ? <PanelRightClose aria-hidden /> : <PanelRightOpen aria-hidden />}
            {panelOpen ? "Hide panel" : "Show panel"}
          </Button>
        </div>
        <p className="sr-only" role="status">
          {copied ? "Design link copied to clipboard" : ""}
        </p>
      </div>

      {/* ---- Panel: side panel on desktop, collapsible bottom sheet on mobile ---- */}
      <aside
        id="studio-panel"
        aria-label="Design options"
        data-lenis-prevent
        className={cn(
          "border-border bg-surface z-10 flex shrink-0 flex-col border-t transition-[height,width] duration-300 lg:border-t-0 lg:border-l",
          panelOpen
            ? "h-[46dvh] lg:h-auto lg:w-[24rem]"
            : "h-14 lg:h-auto lg:w-0 lg:overflow-hidden lg:border-l-0",
        )}
      >
        {/* mobile sheet handle */}
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={panelOpen}
          className="flex h-14 shrink-0 items-center justify-between px-5 lg:hidden"
        >
          <span className="font-serif text-xl">Design your room</span>
          <ChevronDown
            className={cn("size-5 transition-transform", !panelOpen && "rotate-180")}
            aria-hidden
          />
        </button>

        <div className={cn("flex min-h-0 flex-1 flex-col lg:w-[24rem]", !panelOpen && "hidden")}>
          <div className="hidden px-6 pt-6 lg:block">
            <p className="eyebrow">3D Design Studio</p>
            <h1 className="mt-2 text-3xl">Design your room</h1>
          </div>

          <Tabs defaultValue="walls" className="flex min-h-0 flex-1 flex-col lg:mt-4">
            <TabsList className="shrink-0 px-2 lg:px-4">
              <TabsTrigger value="walls">Walls</TabsTrigger>
              <TabsTrigger value="floor">Floor</TabsTrigger>
              <TabsTrigger value="furniture">Furniture</TabsTrigger>
              <TabsTrigger value="view">View</TabsTrigger>
            </TabsList>

            {/* relative: keeps visually-hidden labels inside the scroller instead of stretching the page */}
            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 lg:px-6">
              {/* ---- Walls ---- */}
              <TabsContent value="walls">
                <h2 className={sectionTitle}>Curated paints</h2>
                <ColorSwatches
                  swatches={WALL_SWATCHES}
                  value={config.wall}
                  onSelect={actions.setWallColor}
                  label="Wall paint colours"
                />
                <h2 className={cn(sectionTitle, "mt-7")}>Custom colour</h2>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    aria-label="Pick a custom wall colour"
                    value={config.wall}
                    onChange={(event) => actions.setWallColor(event.target.value)}
                    className={cn(
                      "border-border size-11 shrink-0 cursor-pointer rounded-sm border bg-transparent p-0.5",
                      isCustomWall && "ring-accent ring-offset-surface ring-2 ring-offset-2",
                    )}
                  />
                  <label className="flex-1">
                    <span className="sr-only">Hex colour code</span>
                    <input
                      type="text"
                      inputMode="text"
                      spellCheck={false}
                      maxLength={7}
                      placeholder={config.wall}
                      value={customHex}
                      onChange={(event) => applyCustomHex(event.target.value.trim())}
                      className="border-border bg-bg focus-visible:border-accent h-11 w-full rounded-sm border px-3 font-mono text-sm uppercase"
                    />
                  </label>
                </div>
                <p className="text-fg-muted mt-2 text-xs">
                  Type a hex code such as #C8B6A6, or use the picker.
                </p>
              </TabsContent>

              {/* ---- Floor ---- */}
              <TabsContent value="floor">
                <h2 className={sectionTitle}>Flooring</h2>
                <div className="grid grid-cols-2 gap-3" role="group" aria-label="Flooring options">
                  {FLOOR_IDS.map((id) => {
                    const floor = FLOORS[id];
                    const selected = config.floor === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => actions.setFloor(id)}
                        aria-pressed={selected}
                        className={cn(
                          "border-border overflow-hidden rounded-sm border text-left transition-shadow",
                          selected && "ring-accent ring-offset-surface ring-2 ring-offset-2",
                        )}
                      >
                        <span className="block aspect-[3/2] overflow-hidden">
                          <SwatchCanvas surface={floor.surface} size={160} />
                        </span>
                        <span className="block p-2.5">
                          <span className="block text-sm font-medium">{floor.name}</span>
                          <span className="text-fg-muted mt-0.5 block text-[11px] leading-snug">
                            {floor.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>

              {/* ---- Furniture ---- */}
              <TabsContent value="furniture">
                <div className="bg-muted flex items-center justify-between gap-4 rounded-sm p-3.5">
                  <div>
                    <p className="text-sm font-medium">Show empty room</p>
                    <p className="text-fg-muted text-xs">Hide all furniture to see the shell</p>
                  </div>
                  <Switch
                    checked={config.empty}
                    onChange={actions.toggleEmptyRoom}
                    label="Show empty room"
                  />
                </div>

                <h2 className={cn(sectionTitle, "mt-7")}>Upholstery</h2>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Upholstery colour">
                  {FABRIC_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => actions.setFabric(swatch.hex)}
                      aria-pressed={config.fabric === swatch.hex}
                      aria-label={swatch.name}
                      title={swatch.name}
                      className={cn(
                        "border-border size-10 rounded-full border transition-shadow",
                        config.fabric === swatch.hex &&
                          "ring-accent ring-offset-surface ring-2 ring-offset-2",
                      )}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                </div>

                <div className={cn("mt-7 space-y-6", config.empty && "opacity-50")}>
                  {SLOT_IDS.map((slotId) => {
                    const slot = FURNITURE[slotId];
                    const state = config.furniture[slotId];
                    return (
                      <fieldset key={slotId}>
                        <div className="mb-2 flex items-center justify-between">
                          <legend className="float-left text-sm font-medium">{slot.label}</legend>
                          <button
                            type="button"
                            onClick={() => actions.toggleSlot(slotId)}
                            aria-pressed={!state.visible}
                            aria-label={state.visible ? `Hide ${slot.label}` : `Show ${slot.label}`}
                            className="hover:bg-muted text-fg-muted flex size-9 items-center justify-center rounded-sm"
                          >
                            {state.visible ? (
                              <Eye className="size-4" aria-hidden />
                            ) : (
                              <EyeOff className="size-4" aria-hidden />
                            )}
                          </button>
                        </div>
                        <div className="clear-both flex flex-wrap gap-2">
                          {slot.variants.map((variant) => {
                            const selected = state.variant === variant.id;
                            return (
                              <button
                                key={variant.id}
                                type="button"
                                onClick={() => actions.setVariant(slotId, variant.id)}
                                aria-pressed={selected}
                                title={variant.description}
                                className={cn(
                                  "border-border min-h-10 rounded-sm border px-3.5 text-sm transition-colors",
                                  selected ? "border-fg bg-fg text-bg" : "hover:bg-muted",
                                  !state.visible && "opacity-50",
                                )}
                              >
                                {variant.name}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    );
                  })}
                </div>
              </TabsContent>

              {/* ---- View ---- */}
              <TabsContent value="view">
                <h2 className={sectionTitle}>Viewpoints</h2>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_IDS.map((id, index) => (
                    <Button
                      key={id}
                      variant="outline"
                      onClick={() => actions.goToPreset(id)}
                      className="justify-between"
                    >
                      {CAMERA_PRESETS[id].label}
                      <kbd className="text-fg-muted font-sans text-xs">{index + 1}</kbd>
                    </Button>
                  ))}
                </div>
                <h2 className={cn(sectionTitle, "mt-7")}>Reset</h2>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={actions.resetCamera}>
                    <RotateCcw aria-hidden /> Reset camera
                  </Button>
                  <Button variant="outline" onClick={actions.resetDesign}>
                    <Undo2 aria-hidden /> Reset design
                  </Button>
                </div>
                <h2 className={cn(sectionTitle, "mt-7")}>Controls</h2>
                <dl className="text-fg-muted space-y-1.5 text-sm">
                  {[
                    ["Rotate", "Drag · arrow keys"],
                    ["Zoom", "Scroll / pinch · + and −"],
                    ["Move", "Right-drag / two fingers"],
                    ["Reset camera", "R"],
                    ["Toggle furniture", "F"],
                    ["Viewpoints", "1 – 4"],
                  ].map(([term, keys]) => (
                    <div key={term} className="flex justify-between gap-4">
                      <dt>{term}</dt>
                      <dd className="text-fg text-right">{keys}</dd>
                    </div>
                  ))}
                </dl>
              </TabsContent>
            </div>
          </Tabs>

          <div className="border-border shrink-0 border-t p-4 lg:p-5">
            <Button asChild variant="accent" size="lg" className="w-full">
              <Link href={`/book${query ? `?design=${encodeURIComponent(query)}` : ""}`}>
                <CalendarCheck aria-hidden /> Book consultation with this design
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
