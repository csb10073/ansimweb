'use client'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ServiceCard } from '@/components/ansim/service-card'
import { serviceItems, type ServiceItem } from '@/lib/data/insurance'

interface ServiceGridProps {
  onServiceAction: (action: ServiceItem['action']) => void
}

export function ServiceGrid({ onServiceAction }: ServiceGridProps) {
  const handleSelect = (service: ServiceItem) => {
    if (service.action === 'coming-soon') {
      toast('준비 중인 서비스입니다.')
      return
    }

    onServiceAction(service.action)
  }

  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-bold tracking-wide text-coral">INSURANCE SERVICES</span>
          <h2 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            <span aria-hidden="true">✦ </span>필요한 보험 서비스를 한곳에서 만나보세요
          </h2>
        </div>

        <Button variant="outline" className="w-fit rounded-full">
          서비스 안내 →
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {serviceItems.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            disabled={service.action === 'coming-soon'}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </section>
  )
}
