export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-brand-teal" fill="currentColor" aria-hidden="true">
        <path d="M12 2c-.3 0-.6.13-.8.36C9.5 4.9 5 10.6 5 14.5 5 18.6 8.13 22 12 22s7-3.4 7-7.5c0-3.9-4.5-9.6-6.2-12.14A1 1 0 0 0 12 2Z" />
      </svg>
      <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
        Tap<span className="text-brand-orange">N</span>Go
      </span>
    </div>
  )
}
