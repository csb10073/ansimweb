'use client'

import * as React from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, HeartHandshake, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { heroSlides, type HeroSlide } from '@/lib/data/insurance'
import { cn } from '@/lib/utils'

const AUTO_ADVANCE_MS = 6000

interface HeroCarouselProps {
  onSlideAction: (action: HeroSlide['action']) => void
}

export function HeroCarousel({ onSlideAction }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [isPaused, setIsPaused] = React.useState(false)

  React.useEffect(() => {
    if (isPaused) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroSlides.length)
    }, AUTO_ADVANCE_MS)

    return () => window.clearInterval(timer)
  }, [isPaused])

  const goTo = (index: number) => {
    setActiveIndex(((index % heroSlides.length) + heroSlides.length) % heroSlides.length)
  }

  const activeSlide = heroSlides[activeIndex]

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-secondary/40"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div
            key={activeSlide.id}
            className="flex flex-col gap-6 animate-in fade-in duration-500"
          >
            <span className="inline-flex w-fit items-center rounded-full bg-navy px-3 py-1 text-xs font-semibold tracking-wide text-navy-foreground">
              {activeSlide.eyebrow}
            </span>

            <h1 className="text-balance text-4xl font-black leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {activeSlide.titleLines[0]}
              <br />
              <span className="text-coral">{activeSlide.titleLines[1].highlight}</span>
              {activeSlide.titleLines[1].rest}
            </h1>

            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              {activeSlide.description}
            </p>

            <button
              type="button"
              onClick={() => onSlideAction(activeSlide.action)}
              className="group inline-flex w-fit items-center gap-1.5 border-b-2 border-foreground pb-1 text-base font-semibold text-foreground transition-colors hover:border-coral hover:text-coral"
            >
              {activeSlide.ctaLabel}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            className="relative order-first mx-auto aspect-square w-full max-w-md lg:order-none"
            aria-hidden="true"
          >
            {/* 큰 노란 원 배경 */}
            <div className="absolute inset-6 rounded-full bg-yellow/70" />

            {/* 민트 반원 아치 */}
            <div className="absolute left-0 top-4 h-32 w-32 rounded-full border-[14px] border-mint/60" />

            {/* 코랄 반원 아치 */}
            <div className="absolute bottom-4 right-2 h-24 w-24 rounded-full border-[12px] border-coral/50" />

            {/* 기울어진 보험 증서 카드 */}
            <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 -rotate-3 flex-col gap-3 rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border">
              <div className="flex items-center gap-2">
                <HeartHandshake className="size-6 text-coral" aria-hidden="true" />
                <span className="text-sm font-bold tracking-tight text-navy">
                  ANSIM INSURANCE
                </span>
              </div>
              <div className="h-2 w-3/4 rounded-full bg-muted" />
              <div className="h-2 w-1/2 rounded-full bg-muted" />
              <span className="mt-1 text-xs font-medium tracking-wide text-muted-foreground">
                FOR YOUR PEACE OF MIND
              </span>
            </div>

            {/* 장식용 작은 원/별 */}
            <div className="absolute -left-1 bottom-10 size-6 rounded-full bg-navy" />
            <div className="absolute right-0 top-0 size-5 rounded-full bg-mint" />
            <Star
              className="absolute right-6 bottom-0 size-6 fill-yellow text-yellow"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 lg:mt-16">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="이전 슬라이드"
          >
            <ChevronLeft />
          </Button>

          <div className="flex items-center gap-2" role="tablist" aria-label="슬라이드 선택">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`${index + 1}번째 슬라이드로 이동`}
                onClick={() => goTo(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === activeIndex ? 'w-8 bg-coral' : 'w-2 bg-border hover:bg-muted-foreground/40',
                )}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="다음 슬라이드"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </section>
  )
}
