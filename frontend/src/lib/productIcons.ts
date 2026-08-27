import {
  CanIcon,
  ChipIcon,
  ChocolateBarIcon,
  CitrusGlassIcon,
  CookieIcon,
  HotDogIcon,
  IceCreamCupIcon,
  IcedGlassIcon,
  NachoIcon,
  PizzaSliceIcon,
  PopcornIcon,
  PouchIcon,
  PretzelIcon,
  SparklingGlassIcon,
} from "@/components/icons"
import type { IconComponent } from "@/lib/categories"

// Keyed by exact product name, matching backend/app/seed.py. Falls back to
// the product's category icon (see MenuPage) for anything unmapped, so a
// future menu addition never renders blank.
export const PRODUCT_ICONS: Record<string, IconComponent> = {
  Cola: CanIcon,
  "Sparkling Water": SparklingGlassIcon,
  "Iced Tea": IcedGlassIcon,
  "Orange Juice": CitrusGlassIcon,
  "Potato Chips": ChipIcon,
  Pretzel: PretzelIcon,
  Popcorn: PopcornIcon,
  "Trail Mix": PouchIcon,
  "Hot Dog": HotDogIcon,
  Nachos: NachoIcon,
  "Pizza Slice": PizzaSliceIcon,
  "Chocolate Bar": ChocolateBarIcon,
  Cookie: CookieIcon,
  "Ice Cream Cup": IceCreamCupIcon,
}
