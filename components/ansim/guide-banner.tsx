import { ArrowRight, BookOpenText } from 'lucide-react'

export function GuideBanner() {
  return (
    <section id="guide" className="bg-navy">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-14 lg:px-8">
        <div className="flex items-start gap-4">
          <div className="hidden size-12 shrink-0 items-center justify-center rounded-full bg-navy-foreground/10 sm:flex">
            <BookOpenText className="size-6 text-yellow" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-navy-foreground/70">
              보험이 어렵게 느껴진다면?
            </p>
            <p className="text-balance text-2xl font-black tracking-tight text-navy-foreground sm:text-3xl">
              안심보험 가이드가 함께할게요.
            </p>
          </div>
        </div>

        <a
          href="#guide"
          className="group inline-flex w-fit items-center gap-1.5 border-b-2 border-navy-foreground pb-1 text-base font-semibold text-navy-foreground transition-colors hover:border-yellow hover:text-yellow"
        >
          자세히 보기
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </a>
      </div>
    </section>
  )
}
