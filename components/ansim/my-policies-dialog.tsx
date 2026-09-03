'use client'

import * as React from 'react'
import {
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileCode2,
  FileSearch,
  FileText,
  Layers,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUserPolicies } from '@/lib/hooks/use-user-policies'
import type { InsurancePolicyDocument, UserEnrolledPolicy } from '@/types/policy'
import { PolicyJsonModal } from './policy-json-modal'
import { PolicyChangeSyncDialog } from './policy-change-sync-dialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface MyPoliciesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartSimulation?: () => void
}

export function MyPoliciesDialog({
  open,
  onOpenChange,
  onStartSimulation,
}: MyPoliciesDialogProps) {
  const { user } = useAuth()
  const userName = user?.name || '홍길동'
  const {
    policies,
    lastSyncTime,
    isSyncing,
    updatePolicies,
    resetToDefault,
    syncWithMyData,
  } = useUserPolicies()

  const [selectedJsonDoc, setSelectedJsonDoc] =
    React.useState<InsurancePolicyDocument | null>(null)
  const [isJsonModalOpen, setIsJsonModalOpen] = React.useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = React.useState(false)
  const [expandedContractIds, setExpandedContractIds] = React.useState<string[]>([])

  const initializedRef = React.useRef(false)

  // 모달이 열릴 때 최초 1회 첫 번째 보험 기본 펼치기
  React.useEffect(() => {
    if (open && !initializedRef.current && policies.length > 0) {
      setExpandedContractIds([policies[0].contract_id])
      initializedRef.current = true
    }
    if (!open) {
      initializedRef.current = false
    }
  }, [open, policies])

  // 통계 계산
  const totalMonthlyPremium = React.useMemo(() => {
    return policies.reduce((sum, p) => sum + p.monthly_premium, 0)
  }, [policies])

  const totalCoveragesCount = React.useMemo(() => {
    return policies.reduce((sum, p) => sum + p.policy_document.coverages.length, 0)
  }, [policies])

  const toggleExpand = (contractId: string) => {
    setExpandedContractIds((prev) =>
      prev.includes(contractId)
        ? prev.filter((id) => id !== contractId)
        : [...prev, contractId],
    )
  }

  const handleOpenJson = (doc: InsurancePolicyDocument) => {
    setSelectedJsonDoc(doc)
    setIsJsonModalOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[96vw] sm:max-w-[94vw] lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border shadow-2xl">
          {/* 모달 상단 헤더 */}
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-coral/15 text-coral">
                <FileSearch className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-black text-foreground">
                    {userName} 님의 가입 보험 증권 조회
                  </DialogTitle>
                  <Badge variant="secondary" className="bg-mint/20 text-mint-foreground text-[11px] font-bold border-0">
                    마이데이터 실시간 연동
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  현재 유지 중인 모든 가입 보험과 보장 담보 항목을 약관 원본 데이터와 함께 확인합니다.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* 본문 스크롤 영역 */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* 요약 통계 배너 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-muted-foreground">유효 계약 건수</span>
                  <span className="text-xl font-black text-foreground">{policies.length}건</span>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-coral/10 text-coral">
                  <ShieldCheck className="size-5" />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-muted-foreground">총 월 납입 보험료</span>
                  <span className="text-xl font-black text-coral">
                    {totalMonthlyPremium.toLocaleString('ko-KR')}원
                  </span>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-navy/10 text-navy">
                  <CreditCard className="size-5" />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-muted-foreground">총 보장 담보 수</span>
                  <span className="text-xl font-black text-foreground">{totalCoveragesCount}개 항목</span>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue/10 text-blue-600">
                  <Layers className="size-5" />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-4 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-muted-foreground">마이데이터 상태</span>
                  <span className="text-xs font-bold text-mint-foreground flex items-center gap-1">
                    <span className="size-2 rounded-full bg-mint animate-pulse" />
                    정상 동기화됨
                  </span>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-mint/10 text-mint-foreground">
                  <CheckCircle2 className="size-5" />
                </div>
              </div>
            </div>

            {/* 개별 가입 보험 증권 목록 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Shield className="size-4 text-navy" />
                  가입 보험 상세 증권 리스트 ({policies.length})
                </h3>
                <span className="text-xs text-muted-foreground">
                  카드를 클릭하면 세부 보장 항목을 펼쳐볼 수 있습니다
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {policies.map((enrolled) => {
                  const doc = enrolled.policy_document
                  const isExpanded = expandedContractIds.includes(enrolled.contract_id)

                  return (
                    <Card
                      key={enrolled.contract_id}
                      className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden transition-all duration-200"
                    >
                      {/* 카드 상단 요약 바 */}
                      <div
                        onClick={() => toggleExpand(enrolled.contract_id)}
                        className="p-5 sm:p-6 cursor-pointer hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-coral shrink-0 mt-0.5">
                            <ShieldCheck className="size-6" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-coral">
                                {doc.insurer_name}
                              </span>
                              <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0.5">
                                증권번호: {enrolled.contract_number}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] bg-mint/15 text-mint-foreground font-bold border-0">
                                {enrolled.status === 'ACTIVE' ? '정상 유지' : enrolled.status}
                              </Badge>
                            </div>
                            <h4 className="text-base font-black text-foreground">
                              {doc.product_name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              계약자: {enrolled.insured_name} · 가입일자: {enrolled.contract_date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                          <div className="flex flex-col items-start md:items-end">
                            <span className="text-[11px] text-muted-foreground">월 납입 보험료</span>
                            <span className="text-base font-black text-navy">
                              {enrolled.monthly_premium.toLocaleString('ko-KR')}원
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenJson(doc)
                              }}
                              className="rounded-full text-xs font-bold h-8 px-3 text-coral border-coral/30 hover:bg-coral/10 hover:text-coral"
                            >
                              <FileText className="mr-1 size-3.5" />
                              약관 근거
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-xs font-semibold text-muted-foreground h-8 px-2.5 flex items-center gap-1 hover:bg-secondary"
                              aria-label={isExpanded ? '세부내용 닫기' : '세부내용 보기'}
                            >
                              <span className="text-xs">{isExpanded ? '세부내용 닫기' : '세부내용 보기'}</span>
                              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 펼쳐지는 상세 보장 내역 */}
                      {isExpanded && (
                        <div className="border-t border-border bg-secondary/20 p-5 sm:p-6 space-y-4 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              <Layers className="size-3.5 text-coral" />
                              포함된 세부 보장 담보 ({doc.coverages.length}개)
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              약관 기준 정액 보장액 및 보장 한도
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {doc.coverages.map((cov) => (
                              <div
                                key={cov.id}
                                className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between gap-2.5 shadow-2xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex flex-col gap-0.5">
                                    <Badge variant="outline" className="w-fit text-[10px] px-2 py-0 text-muted-foreground">
                                      {cov.category}
                                    </Badge>
                                    <span className="text-xs font-bold text-foreground mt-1">
                                      {cov.name}
                                    </span>
                                  </div>
                                  <span className="text-xs font-black text-coral whitespace-nowrap">
                                    {cov.insured_amount > 0
                                      ? `최대 ${cov.insured_amount.toLocaleString('ko-KR')}원`
                                      : '실손 비례 보상'}
                                  </span>
                                </div>

                                <p className="text-[11px] text-muted-foreground leading-relaxed bg-secondary/40 p-2.5 rounded-xl">
                                  {cov.conditions[0]?.summary || cov.payment?.formula_description || '보장 요건 충족 시 지급'}
                                </p>

                                {cov.exclusions && cov.exclusions.length > 0 && cov.exclusions[0]?.summary && (
                                  <div className="flex items-start gap-1 text-[10px] text-muted-foreground/80">
                                    <ShieldAlert className="size-3 text-coral/80 shrink-0 mt-0.5" />
                                    <span>면책 요건: {cov.exclusions[0].summary}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 모달 하단 푸터 액션 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-card px-6 py-4">
            <span className="text-xs text-muted-foreground text-center sm:text-left">
              💡 질환이나 사고 발생 시 얼마를 받을 수 있는지 계산해보시겠어요?
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs font-bold h-10 px-4 flex-1 sm:flex-none"
              >
                닫기
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSyncModalOpen(true)}
                className="rounded-xl text-xs font-bold h-10 px-4 border-coral/50 text-coral bg-coral/5 hover:bg-coral/15 hover:border-coral flex-1 sm:flex-none gap-1.5 transition-all shadow-xs"
              >
                <RefreshCw className={cn('size-3.5', isSyncing && 'animate-spin')} />
                <span>보험이 변동되었나요?</span>
              </Button>
              {onStartSimulation && (
                <Button
                  type="button"
                  onClick={onStartSimulation}
                  className="rounded-xl bg-coral hover:bg-coral/90 text-white text-xs font-bold h-10 px-5 shadow-lg shadow-coral/20 flex-1 sm:flex-none"
                >
                  <Calculator className="mr-1.5 size-4" />
                  이 보험들로 보험금 시뮬레이션 하기 →
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 약관 JSON 상세 모달 */}
      {selectedJsonDoc && (
        <PolicyJsonModal
          open={isJsonModalOpen}
          onOpenChange={setIsJsonModalOpen}
          policy={selectedJsonDoc}
        />
      )}

      {/* 마이데이터 보험 변동 동기화 및 관리 모달 */}
      <PolicyChangeSyncDialog
        open={isSyncModalOpen}
        onOpenChange={setIsSyncModalOpen}
        currentPolicies={policies}
        onSavePolicies={updatePolicies}
        onResetToDefault={resetToDefault}
        onSyncMyData={syncWithMyData}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
      />
    </>
  )
}
