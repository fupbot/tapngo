interface IdleWarningModalProps {
  secondsLeft: number
  onStillHere: () => void
}

export function IdleWarningModal({ secondsLeft, onStillHere }: IdleWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 text-center shadow-lg">
        <p className="font-display text-3xl font-semibold text-ink">Are you there?</p>
        <p className="mt-2 text-ink-muted">
          Your order will be cleared in <span className="font-semibold text-brand-clay">{secondsLeft}</span> seconds.
        </p>
        <button
          type="button"
          onClick={onStillHere}
          className="mt-6 w-full rounded-xl bg-brand-clay px-6 py-4 text-lg font-semibold text-white active:scale-[0.98]"
        >
          I'm still here
        </button>
      </div>
    </div>
  )
}
