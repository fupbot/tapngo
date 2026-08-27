import type { SVGProps } from "react"

/**
 * Minimal single-stroke line icons — deliberately not emoji. Color emoji
 * renders as a bright cartoon glyph regardless of which character is
 * chosen, which reads as "cute" rather than the calm, trailhead-café tone
 * this UI is going for. These inherit `currentColor` so they pick up
 * whatever ink/brand tone surrounds them.
 */
type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

export function CupIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 8h11v6.5A4.5 4.5 0 0 1 11.5 19h-2A4.5 4.5 0 0 1 5 14.5V8Z" />
      <path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 5c0-.7.5-1 .8-1.5S9 2.7 9 2" />
      <path d="M12 5c0-.7.5-1 .8-1.5S13 2.7 13 2" />
    </svg>
  )
}

export function AcornIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7.5 11a4.5 4.5 0 0 1 9 0" />
      <path d="M7.8 11h8.4c.5 0 .8.5.6 1-.9 3.6-2.6 6.5-4.5 6.5s-3.6-2.9-4.5-6.5c-.1-.5.1-1 .6-1Z" />
      <path d="M12 6.5V5" />
    </svg>
  )
}

export function FlameIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3c1 2.5-1.5 3.7-1.5 6.2 0 1 .6 1.8 1.5 1.8s1.5-.8 1.5-1.6c1.3 1 2 2.6 2 4.3a5 5 0 0 1-10 0c0-3.6 2.5-5 3.4-7.6.3-.8.4-1.9.4-2.3s.4-.5.7-.4Z" />
    </svg>
  )
}

export function CookieIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="10" cy="10" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="11" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

// --- Drinks ---

export function CanIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8" y="4.5" width="8" height="15" rx="1.3" />
      <ellipse cx="12" cy="4.5" rx="4" ry="0.9" />
      <path d="M8.3 9h7.4" />
      <path d="M8.3 15h7.4" />
    </svg>
  )
}

// Tall tapered glass — wide top narrowing to a rounded base. Iced Tea's
// silhouette is deliberately distinct from the bottle/can/tumbler below, so
// each drink still reads correctly even where a tiny internal accent (ice
// cube, bubbles, citrus wedge) doesn't resolve at card size.
export function IcedGlassIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 4H17L15.2 19A2 2 0 0 1 13.2 21H10.8A2 2 0 0 1 8.8 19L7 4Z" />
      <rect x="9.4" y="9.8" width="3.2" height="3.2" rx="0.5" transform="rotate(-12 9.4 9.8)" />
    </svg>
  )
}

export function SparklingGlassIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.5 3H13.5V5.5L14.8 7.3V18A1.7 1.7 0 0 1 13.1 19.7H10.9A1.7 1.7 0 0 1 9.2 18V7.3L10.5 5.5Z" />
      <circle cx="11.2" cy="11" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="12.8" cy="14" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CitrusGlassIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 9H16V16.5A2 2 0 0 1 14 18.5H10A2 2 0 0 1 8 16.5V9Z" />
      <path d="M8.4 9 9 6h6l.6 3" />
      <path d="M15.5 3a2.6 2.6 0 0 1 2.6 2.6h-2.6Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

// --- Snacks ---

export function ChipIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="12.5" rx="6.5" ry="4.2" transform="rotate(-10 12 12.5)" />
      <path d="M7.3 13c1.6-1.3 3.1-1.3 4.7 0s3.1 1.3 4.7 0" />
    </svg>
  )
}

export function PretzelIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 12a2.5 2.5 0 1 1 2.5 2.5A2.5 2.5 0 1 1 12 12a2.5 2.5 0 1 1 2.5 2.5A2.5 2.5 0 1 1 17 12" />
    </svg>
  )
}

export function PopcornIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 10h8l-1 8.2a1 1 0 0 1-1 .8h-4a1 1 0 0 1-1-.8L8 10Z" />
      <path d="M8 10.5q1.2-3.2 2.4 0t2.4 0t2.4 0" />
    </svg>
  )
}

export function PouchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 8c0-1.4.9-2.5 2-2.5h4c1.1 0 2 1.1 2 2.5v8a3.5 3.5 0 0 1-3.5 3.5h-1A3.5 3.5 0 0 1 8 16V8Z" />
      <path d="M10 5.5V4" />
      <path d="M14 5.5V4" />
      <circle cx="10.6" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="13.3" cy="13.4" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="15" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

// --- Hot food ---

export function HotDogIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 13c0-2.5 2-4.5 4-4.5h8c2 0 4 2 4 4.5s-2 4.5-4 4.5H8c-2 0-4-2-4-4.5Z" />
      <path d="M6 12c1-.8 2-1 3 0s2 .8 3 0 2-.8 3 0 2 .8 3 0" />
    </svg>
  )
}

export function NachoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 18 12 6l6 12H6Z" />
      <circle cx="10.3" cy="14.6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="13.7" cy="13.4" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PizzaSliceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 5 18a8 8 0 0 0 14 0L12 4Z" />
      <circle cx="10.3" cy="12.8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="13.7" cy="14.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

// --- Desserts ---

export function ChocolateBarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="7" width="14" height="10" rx="1" />
      <path d="M9.7 7v10" />
      <path d="M14.3 7v10" />
      <path d="M5 12h14" />
    </svg>
  )
}

export function IceCreamCupIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M7.6 10h8.8l-1.4 7.8a2.3 2.3 0 0 1-2.3 1.9h-1.4a2.3 2.3 0 0 1-2.3-1.9L7.6 10Z" />
    </svg>
  )
}

export function CardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10.5h17" />
      <path d="M7 14.5h4" />
    </svg>
  )
}

export function TapIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="9.5" width="8" height="11" rx="1.8" />
      <path d="M17 9.5c1.2 1.1 1.9 2.6 1.9 4.3s-.7 3.2-1.9 4.3" />
      <path d="M19.3 7.2c2 1.8 3.2 4.3 3.2 6.6s-1.2 4.8-3.2 6.6" />
    </svg>
  )
}

export function TicketIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 9a2 2 0 0 0 0 4V17a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-4a2 2 0 0 1 0-4V6a1 1 0 0 0-1-1h-15a1 1 0 0 0-1 1v3Z" />
      <path d="M14.5 6v12" strokeDasharray="1.5 2.2" />
    </svg>
  )
}

export function CheckBadgeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.3 11 14.8l4.7-5.6" />
    </svg>
  )
}

export function MountainLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 400 90" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" {...props}>
      <path d="M0 80 L60 30 L95 55 L150 15 L210 70 L250 40 L300 75 L340 25 L400 60" />
    </svg>
  )
}
