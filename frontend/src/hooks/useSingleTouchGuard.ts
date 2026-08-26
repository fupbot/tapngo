import { useEffect } from "react"

/**
 * Blocks multi-touch gestures (pinch, two-finger taps) at the document
 * level so the kiosk only ever registers one touch point at a time.
 * See ARCHITECTURE_DECISIONS.md section 2.2.
 */
export function useSingleTouchGuard() {
  useEffect(() => {
    const rejectMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault()
    }
    document.addEventListener("touchstart", rejectMultiTouch, { passive: false })
    document.addEventListener("touchmove", rejectMultiTouch, { passive: false })
    return () => {
      document.removeEventListener("touchstart", rejectMultiTouch)
      document.removeEventListener("touchmove", rejectMultiTouch)
    }
  }, [])
}
