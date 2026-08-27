import type { ReactElement } from "react"

import { AcornIcon, CookieIcon, CupIcon, FlameIcon } from "@/components/icons"

export type IconComponent = (props: { className?: string }) => ReactElement

export interface CategoryDef {
  slug: string
  label: string
  icon: IconComponent
}

// Slugs are the URL segment under /menu/:slug; labels must match the
// `category` string the backend seeds products with.
export const CATEGORIES: CategoryDef[] = [
  { slug: "drinks", label: "Drinks", icon: CupIcon },
  { slug: "snacks", label: "Snacks", icon: AcornIcon },
  { slug: "hot-food", label: "Hot Food", icon: FlameIcon },
  { slug: "desserts", label: "Desserts", icon: CookieIcon },
]

export function categoryForSlug(slug: string | undefined): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}
