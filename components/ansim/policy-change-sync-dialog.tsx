'use client'

import * as React from 'react'
import {
  Building2,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UserEnrolledPolicy } from '@/types/policy'
import { cn } from '@/lib/utils'

interface PolicyChangeSyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPolicies: UserEnrolledPolicy[]
  onSavePolicies?: (updatedPolicies: UserEnrolledPolicy[]) => void
  onResetToDefault?: () => void
  onSyncMyData: () => Promise<{ success: boolean; addedCount: number; message: string }>
  isSyncing: boolean
  lastSyncTime: string
}

export function PolicyChangeSyncDialog({
  open,
  onOpenChange,
  currentPolicies,
  onSyncMyData,
  isSyncing,
  lastSyncTime,
}: PolicyChangeSyncDialogProps) {
  // 원클릭 마이데이터 실시간 재동기화
  const handleTriggerSync = async () => {
    try {
      const result = await onSyncMyData()
      if (result.success) {
        toast.success(result.message)
      }
    } catch {
      toast.error('마이데이터 연동 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-[90vw] lg:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border shadow-2xl bg-card">
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-coral/15 text-coral">
              <RefreshCw className={cn('size-5', isSyncing && 'animate-spin')} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-black text-foreground">
                  마이데이터 보험 연동 내역 동기화 및 관리
                </DialogTitle>
                <Badge variant="secondary" className="bg-coral/10 text-coral text-[11px] font-bold border-0">
                  실시간 마이데이터 연동 (자동)
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                금융결제원 및 주요 보험사 마이데이터 API를 통해 가입된 보험 계약 내역을 실시간으로 자동 동기화합니다.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* 본문 콘텐츠 스크롤 영역: 실시간 마이데이터 연동 (자동) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* 상단 실시간 연동 배너 카드 */}
            <div className="rounded-3xl border border-coral/30 bg-coral/5 p-6 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-coral/20 text-coral shrink-0">
                  <RefreshCw className={cn('size-7', isSyncing && 'animate-spin')} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-foreground">
                      금융결제원 & 주요 보험사 마이데이터 실시간 재연동
                    </h4>
                    <Badge className="bg-mint/20 text-mint-foreground font-bold border-0 text-[10px]">
                      API 실시간 연동
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    모든 손해보험/생명보험사의 신규 가입 증권 및 계약 상태 변동을 한 번의 클릭으로 스캔하여
                    내 마이데이터에 자동으로 동기화합니다.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                    <span>최근 동기화: <strong>{lastSyncTime}</strong></span>
                    <span>·</span>
                    <span>현재 연동 계약: <strong className="text-navy">{currentPolicies.length}건</strong></span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                disabled={isSyncing}
                onClick={handleTriggerSync}
                className="rounded-2xl bg-coral hover:bg-coral/90 text-white font-bold text-xs h-12 px-6 shadow-lg shadow-coral/20 shrink-0 w-full md:w-auto cursor-pointer"
              >
                <RefreshCw className={cn('mr-2 size-4', isSyncing && 'animate-spin')} />
                {isSyncing ? '마이데이터 동기화 중...' : '실시간 마이데이터 다시 불러오기'}
              </Button>
            </div>

            {/* 연동된 주요 금융사 배지 */}
            <div className="flex flex-col gap-2 rounded-2xl bg-secondary/30 p-4 border border-border">
              <span className="text-[11px] font-bold text-muted-foreground">
                연동 지원 보험사 및 기관 (API 연계 완료):
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {['삼성화재', '현대해상', 'DB손해보험', 'KB손해보험', '메리츠화재', '라이나생명', '신한라이프', '교보생명', '한화손해보험', '흥국화재'].map((name) => (
                  <Badge key={name} variant="outline" className="bg-card text-xs py-1 px-2.5 rounded-lg border-border/80">
                    <Building2 className="mr-1 size-3 text-muted-foreground" />
                    {name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 현재 연동 현황 프리뷰 */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-navy" />
                  현재 연동된 가입 증권 ({currentPolicies.length}건)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPolicies.map((p) => (
                  <div
                    key={p.contract_id}
                    className="rounded-2xl border border-border bg-card p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="text-[10px] font-bold text-coral truncate">
                        {p.policy_document.insurer_name}
                      </span>
                      <span className="text-xs font-bold text-foreground truncate">
                        {p.policy_document.product_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        월 {p.monthly_premium.toLocaleString('ko-KR')}원 · {p.contract_date}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-mint/15 text-mint-foreground text-[10px] shrink-0 font-bold">
                      {p.status === 'ACTIVE' ? '정상 유지' : p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 모달 하단 푸터 액션 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-card px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-mint-foreground shrink-0" />
            <span>
              현재 총 <strong className="text-foreground">{currentPolicies.length}개</strong>의 보험 계약이 마이데이터에 연동되어 있습니다.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl bg-navy hover:bg-navy/90 text-white text-xs font-bold h-10 px-5 shadow-xs flex-1 sm:flex-none cursor-pointer"
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
