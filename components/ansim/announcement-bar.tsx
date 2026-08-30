import { ChevronDown, ShieldCheck } from 'lucide-react'

export function AnnouncementBar() {
  return (
    <div className="w-full border-b border-border bg-secondary/60">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="flex shrink-0 items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border transition-colors hover:text-foreground"
        >
          <span>01 오늘의 보험 이야기</span>
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </button>

        <p className="hidden truncate text-xs font-medium text-navy sm:block">
          나에게 꼭 맞는 보험, 쉽고 빠르게 찾아보세요 →
        </p>

        <ShieldCheck
          className="hidden size-4 shrink-0 text-mint sm:block"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
