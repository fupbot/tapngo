import { useNavigate } from "react-router-dom"

import { CATEGORIES } from "@/lib/categories"

export function CategoryPickerPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <h1 className="font-display text-2xl font-semibold text-ink">What are you craving?</h1>
      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        {CATEGORIES.map(({ slug, label, icon: Icon }) => (
          <button
            key={slug}
            type="button"
            onClick={() => navigate(`/menu/${slug}`)}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-surface px-6 py-10 text-brand-forest-dark shadow-sm transition active:scale-[0.97]"
          >
            <Icon className="h-10 w-10" />
            <span className="font-display text-lg font-semibold text-ink">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
