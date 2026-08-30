'use client'

import * as React from 'react'
import { Calculator } from 'lucide-react'
import { SiteHeader } from '@/components/ansim/site-header'
import { SiteFooter } from '@/components/ansim/site-footer'
import { SimulationWorkspace } from '@/components/ansim/simulation-workspace'
import { MyPoliciesDialog } from '@/components/ansim/my-policies-dialog'
import { AuthGuard } from '@/components/auth/auth-guard'

export default function SimulationPage() {
  const [isLookupOpen, setIsLookupOpen] = React.useState(false)

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader onOpenLookup={() => setIsLookupOpen(true)} />

        <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          {/* 상단 타이틀 */}
          <div className="mb-8 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-coral text-xs font-bold uppercase tracking-wider">
              <Calculator className="size-4" />
              <span>ANSIM Intelligence Multi-Policy Simulation</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-navy sm:text-4xl">
              가입 보험 조회 기반 통합 보장 시뮬레이터
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              고객님이 가입하신 보험을 먼저 조회하고, 치료비나 사고가 발생했을 때 보유한 각 보험에서
              얼마의 보험금을 받을 수 있는지 약관 JSON(보장조건, 면책/감액, 한도)을 근거로 정밀하게
              시뮬레이션합니다.
            </p>
          </div>

          {/* 3단계 통합 시뮬레이션 워크스페이스 */}
          <SimulationWorkspace />
        </main>

        <SiteFooter />

        {/* 시뮬레이터 페이지 내 보험 조회 모달 */}
        <MyPoliciesDialog
          open={isLookupOpen}
          onOpenChange={setIsLookupOpen}
        />
      </div>
    </AuthGuard>
  )
}
