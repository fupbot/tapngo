import { useRef } from "react"

/**
 * Fires `onLongPress` after holding for `delayMs`. Used for the discreet
 * admin-access gesture — deliberately not a visible button, so a regular
 * customer never sees a login prompt as part of the ordering flow.
 * See ARCHITECTURE_DECISIONS.md section 4.2.
 */
export function useLongPress(onLongPress: () => void, delayMs = 600) {
  const timer = useRef<number | undefined>(undefined)

  const start = () => {
    timer.current = window.setTimeout(onLongPress, delayMs)
  }
  const clear = () => {
    window.clearTimeout(timer.current)
  }

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
  }
}
