import { ArrowUpRight } from 'lucide-react'

import type { ServiceItem } from '@/lib/data/insurance'
import { cn } from '@/lib/utils'

const ACCENT_STYLES: Record<ServiceItem['accent'], { bg: string; icon: string }> = {
  coral: { bg: 'bg-coral/15', icon: 'text-coral' },
  blue: { bg: 'bg-navy/10', icon: 'text-navy' },
  mint: { bg: 'bg-mint/20', icon: 'text-mint-foreground' },
  lavender: { bg: 'bg-lavender/20', icon: 'text-lavender-foreground' },
}

interface ServiceCardProps {
  service: ServiceItem
  disabled?: boolean
  onSelect: (service: ServiceItem) => void
}

export function ServiceCard({ service, disabled, onSelect }: ServiceCardProps) {
  const accent = ACCENT_STYLES[service.accent]
  const Icon = service.icon

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      aria-disabled={disabled}
      className={cn(
        'group relative flex h-full min-h-56 flex-col justify-between rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition-all duration-200',
        disabled
          ? 'cursor-not-allowed opacity-70'
          : 'hover:-translate-y-1.5 hover:shadow-lg focus-visible:-translate-y-1.5 focus-visible:shadow-lg',
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-bold tracking-wide text-muted-foreground">
          {service.number}
        </span>
      </div>

      <div className={cn('flex size-14 items-center justify-center rounded-full', accent.bg)}>
        <Icon className={cn('size-6', accent.icon)} aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold tracking-tight text-foreground">{service.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
      </div>

      <ArrowUpRight
        className={cn(
          'absolute bottom-6 right-6 size-5 text-muted-foreground transition-transform',
          !disabled && 'group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground',
        )}
        aria-hidden="true"
      />
    </button>
  )
}
