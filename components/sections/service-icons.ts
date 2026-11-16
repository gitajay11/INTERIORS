import { Building2, Hammer, Home, Lamp, Ruler, Sofa, type LucideIcon } from "lucide-react";
import type { Service } from "@/lib/types";

export const serviceIcons: Record<Service["icon"], LucideIcon> = {
  home: Home,
  building: Building2,
  ruler: Ruler,
  sofa: Sofa,
  lamp: Lamp,
  hammer: Hammer,
};
