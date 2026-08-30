'use client'

import * as React from 'react'
import { Calculator, ExternalLink, Maximize2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SimulationWorkspace } from './simulation-workspace'

interface SimulationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SimulationDialog({ open, onOpenChange }: SimulationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-[96vw] lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border shadow-2xl">
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-coral/15 text-coral">
              <Calculator className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                가입 보험 기반 정밀 보장 시뮬레이터
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                내 가입 보험을 조회하고, 상황 발생 시 각 보험별 예상 보장 금액을 약관 JSON 근거로 계산합니다.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-8">
            <Link
              href="/simulation"
              target="_blank"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary hover:text-coral"
            >
              <Maximize2 className="size-3.5" />
              <span>새 탭 전체 화면으로 보기</span>
            </Link>
          </div>
        </div>

        {/* 워크스페이스 본문 */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <SimulationWorkspace isModal />
        </div>
      </DialogContent>
    </Dialog>
  )
}
