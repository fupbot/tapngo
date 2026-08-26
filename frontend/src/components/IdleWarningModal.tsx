interface IdleWarningModalProps {
  secondsLeft: number
  onStillHere: () => void
}

export function IdleWarningModal({ secondsLeft, onStillHere }: IdleWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-surface p-8 text-center shadow-2xl">
        <p className="font-display text-3xl font-bold text-ink">Are you there?</p>
        <p className="mt-2 text-ink-muted">
          Your order will be cleared in <span className="font-bold text-brand-orange">{secondsLeft}</span> seconds.
        </p>
        <button
          type="button"
          onClick={onStillHere}
          className="mt-6 w-full rounded-2xl bg-brand-orange px-6 py-4 text-lg font-bold text-white shadow-lg active:scale-[0.98]"
        >
          I'm still here
        </button>
      </div>
    </div>
  )
}
