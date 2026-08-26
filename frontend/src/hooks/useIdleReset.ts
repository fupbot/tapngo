import { useCallback, useEffect, useRef, useState } from "react"

interface UseIdleResetOptions {
  enabled: boolean
  idleMs?: number
  warnMs?: number
  onExpire: () => void
}

/**
 * 15s inactivity -> 15s "Are you there?" countdown -> onExpire if unanswered.
 * See ARCHITECTURE_DECISIONS.md section 2.1.
 *
 * Once the warning is showing, only an explicit `dismiss()` call resets the
 * clock — an ambient tap elsewhere doesn't silently clear it, so a customer
 * who's actually still there has to answer the prompt.
 */
export function useIdleReset({ enabled, idleMs = 15_000, warnMs = 15_000, onExpire }: UseIdleResetOptions) {
  const [warning, setWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(warnMs / 1000))
  const idleTimeout = useRef<number | undefined>(undefined)
  const countdownInterval = useRef<number | undefined>(undefined)

  const clearTimers = useCallback(() => {
    window.clearTimeout(idleTimeout.current)
    window.clearInterval(countdownInterval.current)
  }, [])

  const startIdleTimer = useCallback(() => {
    clearTimers()
    setWarning(false)
    if (!enabled) return

    idleTimeout.current = window.setTimeout(() => {
      setWarning(true)
      setSecondsLeft(Math.ceil(warnMs / 1000))
      countdownInterval.current = window.setInterval(() => {
        setSecondsLeft((secondsRemaining) => {
          if (secondsRemaining <= 1) {
            clearTimers()
            onExpire()
            return 0
          }
          return secondsRemaining - 1
        })
      }, 1000)
    }, idleMs)
  }, [clearTimers, enabled, idleMs, warnMs, onExpire])

  useEffect(() => {
    startIdleTimer()
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const handleActivity = () => {
      if (!warning) startIdleTimer()
    }
    window.addEventListener("pointerdown", handleActivity)
    window.addEventListener("keydown", handleActivity)
    return () => {
      window.removeEventListener("pointerdown", handleActivity)
      window.removeEventListener("keydown", handleActivity)
    }
  }, [enabled, warning, startIdleTimer])

  const dismiss = useCallback(() => startIdleTimer(), [startIdleTimer])

  return { warning, secondsLeft, dismiss }
}
