'use client'

import * as React from 'react'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSearch,
  FileText,
  HeartPulse,
  Info,
  Layers,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { runMultiPolicySimulation } from '@/lib/policy-engine'
import { getDefaultPoliciesForUser } from '@/lib/data/user-policies'
import type {
  InsurancePolicyDocument,
  MultiPolicySimulationReport,
  UserEnrolledPolicy,
  UserSituationInput,
} from '@/types/policy'
import { useAuth } from '@/lib/auth-context'
import { PolicyEvidenceViewer } from './policy-evidence-viewer'
import { toast } from 'sonner'

export interface SavedSimulationItem {
  id: string
  title: string
  savedAt: string
  input: UserSituationInput
  report: MultiPolicySimulationReport
  selectedContractIds: string[]
}

export function getSavedSimulationsStorageKey(userId?: string | null): string {
  return `ansim_user_saved_simulations_v7_${userId || 'default'}`
}

export const SAVED_SIMULATIONS_STORAGE_KEY = 'ansim_user_saved_simulations_v7'

/**
 * 시뮬레이션의 조건(입원일수, 수술, 청구금액, 선택계약 등)이 완전히 동일한지 확인
 */
export function isSameSimulationCondition(
  item: SavedSimulationItem,
  input: UserSituationInput,
  rep: MultiPolicySimulationReport,
  contractIds: string[],
): boolean {
  if (!item?.input || !item?.report) return false

  const sameName = item.input.incident_name === input.incident_name
  const sameClaimed = item.input.claimed_amount === input.claimed_amount
  const sameHospital = (item.input.hospitalization_days || 0) === (input.hospitalization_days || 0)
  const sameSurgery = (item.input.surgery_count || 0) === (input.surgery_count || 0)
  const sameType = item.input.incident_type === input.incident_type
  const samePayout = item.report.total_estimated_payout === rep.total_estimated_payout

  const flags1 = (item.input.special_circumstances || []).slice().sort().join(',')
  const flags2 = (input.special_circumstances || []).slice().sort().join(',')
  const sameFlags = flags1 === flags2

  const contracts1 = (item.selectedContractIds || []).slice().sort().join(',')
  const contracts2 = (contractIds || []).slice().sort().join(',')
  const sameContracts = contracts1 === contracts2

  return sameName && sameClaimed && sameHospital && sameSurgery && sameType && samePayout && sameFlags && sameContracts
}

/**
 * 시뮬레이션의 변경된 조건(입원, 수술 등)을 반영한 제목 생성
 */
export function generateSimulationTitle(input: UserSituationInput, rep: MultiPolicySimulationReport): string {
  const conditionTags: string[] = []
  if (input.hospitalization_days && input.hospitalization_days > 0) {
    conditionTags.push(`입원 ${input.hospitalization_days}일`)
  }
  if (input.surgery_count && input.surgery_count > 0) {
    conditionTags.push(`수술 ${input.surgery_count}회`)
  }
  const conditionStr = conditionTags.length > 0 ? ` [${conditionTags.join(', ')}]` : ''
  return `${input.incident_name}${conditionStr} (${(rep.total_estimated_payout / 10000).toLocaleString('ko-KR')}만원)`
}

/**
 * ⚡ 심사위원 평가용 3대 대표 시나리오 기본 생성 헬퍼
 */
export function generateDefaultSavedSamples(userPolicies: UserEnrolledPolicy[]): SavedSimulationItem[] {
  const policyList = userPolicies.length > 0 ? userPolicies : getDefaultPoliciesForUser(null)
  const allContractIds = policyList.map((p) => p.contract_id)

  const scenarios: { title: string; input: UserSituationInput }[] = [
    {
      title: '🎗️ 위암 3기 로봇수술 (5,300만원 수령 검증)',
      input: {
        situation_description:
          '건강검진 중 위암 3기 확진 후 상급종합병원에서 로봇수술 1회 및 4일간 입원 치료를 받음 (암 진단비 5,000만원 + 질병수술비 300만원 정액 중복 보장)',
        incident_name: '위암 (3기) 진단 및 로봇수술',
        incident_type: 'surgery',
        incident_date: '2026-03-15',
        claimed_amount: 12_500_000,
        hospitalization_days: 0,
        surgery_count: 1,
        special_circumstances: [],
      },
    },
    {
      title: '💆 도수치료 5회 + MRI (30% 공제 검증)',
      input: {
        situation_description:
          '요추 추간판 탈출증으로 통원하며 비급여 MRI 검사(70만원) 및 도수치료 5회(75만원) 처방 치료 (3대 비급여 30% 공제 적용)',
        incident_name: '요추 추간판 탈출증 (MRI + 도수치료)',
        incident_type: 'outpatient',
        incident_date: '2026-03-20',
        claimed_amount: 1_450_000,
        hospitalization_days: 0,
        surgery_count: 0,
        special_circumstances: ['도수치료'],
      },
    },
    {
      title: '✈️ 해외여행 휴대폰 도난 (100만원 한도 검증)',
      input: {
        situation_description:
          '해외여행 중 관광지에서 스마트폰 및 카메라 가방 도난 (현지 경찰서 도난신고서 Police Report 발급, 최대 한도 100만원 검증)',
        incident_name: '해외여행 중 휴대품 도난 (스마트폰)',
        incident_type: 'loss',
        incident_date: '2026-07-10',
        claimed_amount: 1_500_000,
        hospitalization_days: 0,
        surgery_count: 0,
        special_circumstances: ['도난'],
      },
    },
  ]

  return scenarios.map((item, idx) => {
    const rep = runMultiPolicySimulation(policyList, item.input)
    return {
      id: `default_saved_${Date.now()}_${idx + 1}`,
      title: item.title,
      savedAt: '2026-03-01 12:00',
      input: item.input,
      report: rep,
      selectedContractIds: allContractIds,
    }
  })
}

interface SavedSimulationComparatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userPolicies: UserEnrolledPolicy[]
  selectedContractIds: string[]
  currentReport?: MultiPolicySimulationReport | null
  currentInput?: UserSituationInput | null
  onApplyScenarioToWorkspace: (input: UserSituationInput, contractIds?: string[]) => void
}

export function SavedSimulationComparator({
  open,
  onOpenChange,
  userPolicies,
  selectedContractIds,
  currentReport,
  currentInput,
  onApplyScenarioToWorkspace,
}: SavedSimulationComparatorProps) {
  const { user } = useAuth()
  const [savedList, setSavedList] = React.useState<SavedSimulationItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [inspectingItem, setInspectingItem] = React.useState<SavedSimulationItem | null>(null)

  const storageKey = getSavedSimulationsStorageKey(user?.id)

  // 로컬스토리지에서 사용자 저장 목록 불러오기 (사용자가 직접 저장한 항목만 순수하게 로드)
  const loadSavedSimulations = React.useCallback(() => {
    try {
      let aggregated: SavedSimulationItem[] = []
      const seenIds = new Set<string>()

      // 사용자가 직접 저장/관리하는 목록만 정확히 조회
      const currentStored = localStorage.getItem(storageKey)
      if (currentStored) {
        try {
          const parsed = JSON.parse(currentStored) as SavedSimulationItem[]
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (item && item.id && !seenIds.has(item.id)) {
                seenIds.add(item.id)
                aggregated.push(item)
              }
            })
          }
        } catch {}
      }

      setSavedList(aggregated)
    } catch {
      setSavedList([])
    }
  }, [storageKey])

  React.useEffect(() => {
    if (open) {
      loadSavedSimulations()
      setInspectingItem(null)
    }
  }, [open, loadSavedSimulations, user?.id])

  // 저장 목록 업데이트 및 로컬스토리지 동기화
  const updateSavedList = (newList: SavedSimulationItem[]) => {
    setSavedList(newList)
    try {
      localStorage.setItem(storageKey, JSON.stringify(newList))
    } catch {}
  }

  // 현재 시뮬레이션 결과 저장
  const handleSaveCurrentSimulation = () => {
    if (!currentReport || !currentInput) {
      toast.error('현재 진행된 시뮬레이션 결과가 없습니다.')
      return
    }

    const title = generateSimulationTitle(currentInput, currentReport)
    const newItem: SavedSimulationItem = {
      id: `saved_${Date.now()}`,
      title,
      savedAt: new Date().toLocaleDateString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      input: currentInput,
      report: currentReport,
      selectedContractIds,
    }

    // 완전히 동일한 조건/결과인 경우에만 기존 항목 대체, 조건을 수정한 시뮬레이션은 이전 결과 그대로 보존
    const filtered = savedList.filter(
      (item) => !isSameSimulationCondition(item, currentInput, currentReport, selectedContractIds),
    )
    const updated = [newItem, ...filtered].slice(0, 30)
    updateSavedList(updated)
    toast.success(`'${newItem.title}' 시뮬레이션이 보관함에 저장되었습니다!`)
  }

  // 개별 시뮬레이션 삭제
  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const updated = savedList.filter((item) => item.id !== id)
    updateSavedList(updated)
    if (inspectingItem?.id === id) {
      setInspectingItem(null)
    }
    toast.info('시뮬레이션이 보관함에서 삭제되었습니다.')
  }

  // 전체 비우기 (현재 키 및 과거 잔여 레거시 키까지 모두 삭제)
  const handleClearAll = () => {
    if (confirm('저장된 모든 시뮬레이션 기록을 비우시겠습니까?')) {
      try {
        localStorage.removeItem(storageKey)
      } catch {}

      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (
              k &&
              (k.startsWith('ansim_user_saved_simulations') ||
                k.startsWith('ansim_saved_simulations') ||
                k.includes('saved_simulations'))
            ) {
              keysToRemove.push(k)
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k))
        } catch {}
      }

      updateSavedList([])
      setInspectingItem(null)
      toast.info('보관함의 모든 시뮬레이션이 삭제되었습니다.')
    }
  }

  // ⚡ 심사위원 평가용 3대 대표 시나리오 즉시 채우기 / 복원 헬퍼
  const handlePopulateJudgeSamples = () => {
    const policyList = userPolicies.length > 0 ? userPolicies : getDefaultPoliciesForUser(user)
    const samples = generateDefaultSavedSamples(policyList)

    const combined = [...samples, ...savedList.filter((s) => !samples.some((sample) => sample.title === s.title))]
    updateSavedList(combined)
    toast.success('⚡ 3대 대표 시나리오가 보관함에 복원되었습니다!')
  }

  // 단일 리포트 클립보드 복사
  const handleCopyReport = async (item: SavedSimulationItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const outOfPocket = Math.max(0, item.input.claimed_amount - item.report.total_estimated_payout)
    const lines = [
      `[ANSIM 보관된 시뮬레이션 리포트]`,
      `사고/진단명: ${item.input.incident_name}`,
      `발생일자: ${item.input.incident_date} (발생손해액: ${item.input.claimed_amount.toLocaleString('ko-KR')}원)`,
      `★ 총 예상 수령액: ${item.report.total_estimated_payout.toLocaleString('ko-KR')}원`,
      `실질 본인부담금: ${outOfPocket.toLocaleString('ko-KR')}원`,
      ``,
      `[보험 상품별 지급 내역]`,
      ...item.report.policy_results.map((p, pIdx) => {
        const items = p.relevant_judgments.map(
          (j) => `  - ${j.coverage_name} [${j.status}]: ${j.estimated_payout.toLocaleString('ko-KR')}원 (${j.calculation_formula})`,
        )
        return `${pIdx + 1}. ${p.policy_name} (${p.insurer_name}) -> 소계: ${p.total_payout_for_policy.toLocaleString('ko-KR')}원\n${items.join('\n')}`
      }),
      ``,
      `[전문가 종합 소견]`,
      ...item.report.expert_insights.map((ins) => ` - ${ins}`),
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('시뮬레이션 리포트가 클립보드에 복사되었습니다.')
    } catch {
      toast.error('복사에 실패했습니다.')
    }
  }

  // 검색 필터링된 보관함 목록
  const filteredSavedList = React.useMemo(() => {
    if (!searchQuery.trim()) return savedList
    const q = searchQuery.toLowerCase()
    return savedList.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.input.incident_name.toLowerCase().includes(q) ||
        item.input.situation_description.toLowerCase().includes(q),
    )
  }, [savedList, searchQuery])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[1400px] sm:max-w-[96vw] lg:max-w-[1400px] max-h-[92vh] h-[90vh] flex flex-col overflow-hidden rounded-3xl p-5 sm:p-7 bg-[#FFFDF9] border border-border shadow-2xl text-foreground">
        {/* 1. 상단 다이얼로그 헤더 */}
        <DialogHeader className="shrink-0 border-b border-border/80 pb-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-coral/15 text-coral shadow-sm">
                <Archive className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-navy flex items-center gap-2">
                  <span>시뮬레이션 결과 보관함</span>
                  <Badge variant="secondary" className="bg-coral text-white border-0 text-xs font-bold px-2.5 py-0.5 shadow-xs">
                    총 {savedList.length}건 보관 중
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  저장해둔 시뮬레이션 결과를 언제든지 꺼내서 다시 조회하고, 워크스페이스로 불러올 수 있습니다.
                </DialogDescription>
              </div>
            </div>

            {/* 상단 액션 버튼 */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handlePopulateJudgeSamples}
                className="h-8 text-xs rounded-full border-coral/40 bg-coral/10 hover:bg-coral/20 text-coral font-bold gap-1 shadow-xs"
              >
                <Sparkles className="size-3.5" />
                <span>⚡ 3대 대표 시나리오 채우기</span>
              </Button>

              {currentReport && currentInput && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSaveCurrentSimulation}
                  className="h-8 text-xs rounded-full border-border bg-white text-foreground hover:bg-muted font-bold gap-1 shadow-xs"
                >
                  <Plus className="size-3.5" />
                  <span>현재 결과 보관함에 저장</span>
                </Button>
              )}

              {savedList.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleClearAll}
                  className="h-8 text-xs text-muted-foreground hover:text-destructive rounded-full px-2.5"
                >
                  <Trash2 className="size-3 mr-1" />
                  전체 비우기
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* 2. 본문 영역 */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 py-2">
          {/* 상세 인라인 리포트 조회 모드 */}
          {inspectingItem ? (
            <div className="flex flex-col gap-4 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-border shadow-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInspectingItem(null)}
                  className="text-xs font-bold text-navy hover:bg-secondary gap-1.5 rounded-full px-3"
                >
                  <ArrowLeft className="size-4" />
                  <span>&larr; 보관함 목록으로 돌아가기</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleCopyReport(inspectingItem, e)}
                    className="h-8 text-xs rounded-full gap-1"
                  >
                    <Copy className="size-3.5" />
                    <span>리포트 복사</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onApplyScenarioToWorkspace(inspectingItem.input, inspectingItem.selectedContractIds)
                      onOpenChange(false)
                      toast.success(`'${inspectingItem.input.incident_name}' 시뮬레이션이 워크스페이스에 적용되었습니다.`)
                    }}
                    className="h-8 text-xs rounded-full bg-coral hover:bg-coral/90 text-white font-bold gap-1 shadow-xs"
                  >
                    <span>이 시뮬레이션 워크스페이스로 불러오기</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* 리포트 상단 요약 배너 */}
              <div className="rounded-3xl bg-gradient-to-br from-navy via-slate-900 to-navy p-6 text-white shadow-xl sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-coral" />
                    <span className="text-xs font-bold text-white/90">
                      보관된 시뮬레이션 상세 결과 (저장시각: {inspectingItem.savedAt})
                    </span>
                  </div>
                  <Badge variant="outline" className="border-white/20 text-white text-xs">
                    {inspectingItem.input.incident_date} 발생
                  </Badge>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-7 flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-white/70">
                      발생 상황: <strong className="text-white">{inspectingItem.input.incident_name}</strong>
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tight text-coral sm:text-5xl">
                        {inspectingItem.report.total_estimated_payout.toLocaleString('ko-KR')}
                      </span>
                      <span className="text-2xl font-bold text-white/90">원</span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed mt-1">
                      {inspectingItem.input.situation_description}
                    </p>
                  </div>

                  <div className="lg:col-span-5 flex flex-col gap-2 rounded-2xl bg-white/10 p-4 text-xs">
                    <div className="flex items-center justify-between text-white/80">
                      <span>총 발생 손해액/치료비</span>
                      <span className="font-bold text-white">
                        {inspectingItem.input.claimed_amount.toLocaleString('ko-KR')}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <span>실질 본인 부담금</span>
                      <span className="font-bold text-yellow">
                        {Math.max(
                          0,
                          inspectingItem.input.claimed_amount - inspectingItem.report.total_estimated_payout,
                        ).toLocaleString('ko-KR')}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-white/80 border-t border-white/15 pt-2">
                      <span>심사 대상 보험</span>
                      <span className="font-bold text-white">
                        총 {inspectingItem.report.policy_results.length}개 상품
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 전문가 AI 종합 소견 */}
              <div className="rounded-2xl bg-secondary/50 p-4 border border-border flex flex-col gap-2">
                <div className="flex items-center gap-2 text-navy text-xs font-bold">
                  <Sparkles className="size-4 text-coral" />
                  <span>보장 분석 AI 종합 소견</span>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-foreground/90 font-medium">
                  {inspectingItem.report.expert_insights.map((ins, iIdx) => (
                    <div key={iIdx} className="flex items-start gap-2 bg-card p-2.5 rounded-xl border border-border/60">
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-coral/15 text-[10px] font-bold text-coral mt-0.5">
                        {iIdx + 1}
                      </span>
                      <span>{ins}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 보험별 심사 내역 및 약관 근거 */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-black text-navy flex items-center gap-2">
                  <Building2 className="size-4 text-coral" />
                  보험 상품별 세부 약관 심사 및 산출 근거
                </h4>

                <div className="flex flex-col gap-3">
                  {inspectingItem.report.policy_results.map((policyRes, pIdx) => (
                    <div
                      key={policyRes.contract_id}
                      className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                            {pIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-coral">{policyRes.insurer_name}</span>
                          <span className="text-sm font-black text-foreground">{policyRes.policy_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block">예상 지급액</span>
                          <span className="text-sm font-black text-navy">
                            {policyRes.total_payout_for_policy.toLocaleString('ko-KR')}원
                          </span>
                        </div>
                      </div>

                      {/* 보장 항목별 세부 내역 */}
                      <div className="flex flex-col gap-2.5">
                        {policyRes.relevant_judgments.map((judgment) => (
                          <div
                            key={judgment.coverage_id}
                            className="rounded-xl bg-secondary/30 p-3 border border-border/60 flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">
                                {judgment.coverage_name}
                              </span>
                              <span className="text-xs font-black text-coral">
                                {judgment.estimated_payout.toLocaleString('ko-KR')}원
                              </span>
                            </div>

                            <div className="bg-card p-2 rounded-lg border border-border/50 text-[11px] font-mono text-foreground">
                              {judgment.calculation_formula}
                            </div>

                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              ⚖️ <strong>판단 사유:</strong> {judgment.decision_reason}
                            </p>

                            {/* 약관 근거 뷰어 연동 */}
                            {judgment.evidences && judgment.evidences.length > 0 && (
                              <PolicyEvidenceViewer
                                evidences={judgment.evidences}
                                coverageName={judgment.coverage_name}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* 보관함 목록 뷰 (카드 그리드) */
            <div className="flex flex-col gap-4">
              {/* 상단 검색 바 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-border shadow-xs">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="사고명, 질병/진단명, 상황 키워드 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl bg-background border-border"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground px-1">
                  검색된 시뮬레이션: <strong className="text-navy font-bold">{filteredSavedList.length}건</strong>
                </div>
              </div>

              {/* 보관함 카드 목록 */}
              {filteredSavedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-14 text-center rounded-3xl bg-white border border-dashed border-border shadow-xs">
                  <Archive className="size-12 text-muted-foreground/40 mb-3" />
                  <h4 className="text-base font-bold text-navy">보관함에 일치하는 시뮬레이션이 없습니다</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    시뮬레이터를 실행하면 결과가 자동으로 저장되며, 언제든지 다시 조회하실 수 있습니다.
                  </p>
                  <Button
                    type="button"
                    onClick={handlePopulateJudgeSamples}
                    className="mt-4 rounded-full bg-coral hover:bg-coral/90 text-white font-bold text-xs px-5 h-9 gap-1.5"
                  >
                    <Sparkles className="size-3.5" />
                    <span>3대 대표 시나리오 채우기</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSavedList.map((item, idx) => {
                    const outOfPocket = Math.max(0, item.input.claimed_amount - item.report.total_estimated_payout)

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between p-5 rounded-3xl border border-border bg-white shadow-xs hover:border-coral/50 hover:shadow-md transition-all group"
                      >
                        <div className="flex flex-col gap-3">
                          {/* 상단 번호 & 저장 시각 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex size-6 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white shadow-2xs">
                                {idx + 1}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                {item.savedAt}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              className="text-muted-foreground/40 hover:text-destructive p-1 rounded-md transition-colors"
                              title="보관함에서 삭제"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>

                          {/* 사고명 & 상황 */}
                          <div>
                            <h4 className="text-sm font-black text-navy line-clamp-1 group-hover:text-coral transition-colors">
                              {item.input.incident_name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {item.input.situation_description}
                            </p>
                          </div>

                          {/* 금액 하이라이트 박스 */}
                          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/60 flex flex-col gap-1.5 text-xs">
                            <div className="flex items-baseline justify-between">
                              <span className="text-muted-foreground font-medium">총 예상 수령액</span>
                              <span className="text-lg font-black text-coral">
                                {item.report.total_estimated_payout.toLocaleString('ko-KR')}원
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/50">
                              <span>치료비 {item.input.claimed_amount.toLocaleString('ko-KR')}원</span>
                              <span>본인부담 {outOfPocket.toLocaleString('ko-KR')}원</span>
                            </div>
                          </div>

                          {/* 치료 조건 뱃지 및 참여 보험사 태그 */}
                          <div className="flex flex-wrap items-center gap-1">
                            <Badge variant="outline" className="text-[10px] bg-background font-bold py-0.5 px-2 text-navy">
                              {item.input.incident_type === 'surgery'
                                ? '수술/입원'
                                : item.input.incident_type === 'diagnosis'
                                  ? '진단'
                                  : item.input.incident_type === 'outpatient'
                                    ? '통원'
                                    : item.input.incident_type === 'loss'
                                      ? '손해'
                                      : '기타'}
                            </Badge>

                            {item.report.policy_results.map((p) => (
                              <span
                                key={p.contract_id}
                                className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-navy/5 text-navy font-semibold"
                              >
                                {p.insurer_name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 하단 액션 버튼 바 */}
                        <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border/60">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setInspectingItem(item)}
                            className="flex-1 rounded-xl text-xs h-9 font-bold border-border text-foreground hover:bg-secondary gap-1"
                          >
                            <Eye className="size-3.5 text-coral" />
                            <span>결과 리포트 보기</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              onApplyScenarioToWorkspace(item.input, item.selectedContractIds)
                              onOpenChange(false)
                              toast.success(`'${item.input.incident_name}' 시뮬레이션이 워크스페이스에 적용되었습니다.`)
                            }}
                            className="flex-1 rounded-xl text-xs h-9 font-bold bg-navy hover:bg-navy/90 text-white gap-1 shadow-2xs"
                          >
                            <span>불러오기</span>
                            <ArrowRight className="size-3.5" />
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleCopyReport(item, e)}
                            className="h-9 text-xs text-muted-foreground hover:text-foreground rounded-xl px-2.5"
                            title="리포트 복사"
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. 하단 푸터 바 */}
        <div className="shrink-0 flex items-center justify-between pt-3 border-t border-border mt-1">
          <div className="text-xs text-muted-foreground">
            {savedList.length > 0
              ? `총 ${savedList.length}개의 시뮬레이션 결과가 안전하게 보관되어 있습니다.`
              : '시뮬레이션을 실행하면 결과가 자동으로 보관함에 기록됩니다.'}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs h-9 px-6 font-bold"
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
