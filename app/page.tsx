'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { AnnouncementBar } from '@/components/ansim/announcement-bar'
import { GuideBanner } from '@/components/ansim/guide-banner'
import { HeroCarousel } from '@/components/ansim/hero-carousel'
import { ServiceGrid } from '@/components/ansim/service-grid'
import { SimulationDialog } from '@/components/ansim/simulation-dialog'
import { MyPoliciesDialog } from '@/components/ansim/my-policies-dialog'
import { SiteFooter } from '@/components/ansim/site-footer'
import { SiteHeader } from '@/components/ansim/site-header'
import { AuthGuard } from '@/components/auth/auth-guard'

type SectionAction = 'lookup' | 'simulation' | 'travel' | 'coming-soon'

export default function Page() {
  const [isSimulationOpen, setIsSimulationOpen] = React.useState(false)
  const [isLookupOpen, setIsLookupOpen] = React.useState(false)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const action = params.get('action')
      if (action === 'lookup') {
        setIsLookupOpen(true)
      } else if (action === 'simulation') {
        setIsSimulationOpen(true)
      }
    }
  }, [])

  const handleAction = (action: SectionAction) => {
    if (action === 'lookup') {
      setIsLookupOpen(true)
      return
    }

    if (action === 'simulation') {
      setIsSimulationOpen(true)
      return
    }

    toast('여행자 보험 추천 서비스는 곧 만나볼 수 있어요.')
  }

  const handleStartSimulationFromLookup = () => {
    setIsLookupOpen(false)
    setIsSimulationOpen(true)
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AnnouncementBar />
        <SiteHeader
          onOpenLookup={() => setIsLookupOpen(true)}
          onOpenSimulation={() => setIsSimulationOpen(true)}
        />

        <main className="flex-1">
          <HeroCarousel onSlideAction={handleAction} />
          <ServiceGrid onServiceAction={handleAction} />
          <GuideBanner />
        </main>

        <SiteFooter />

        {/* 내 보험 조회 전용 모달 (시뮬레이션 칸 없이 내 가입 보험만 깔끔하게 조회) */}
        <MyPoliciesDialog
          open={isLookupOpen}
          onOpenChange={setIsLookupOpen}
          onStartSimulation={handleStartSimulationFromLookup}
        />

        {/* 보험금 정밀 시뮬레이터 모달 */}
        <SimulationDialog open={isSimulationOpen} onOpenChange={setIsSimulationOpen} />
      </div>
    </AuthGuard>
  )
}
