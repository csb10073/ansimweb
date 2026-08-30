'use client'

import * as React from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  FileCode2,
  FileText,
  Info,
  Layers,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
  Scale,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  CoverageItemJudgment,
  InsurancePolicyDocument,
  MultiPolicySimulationReport,
  SinglePolicySimulationResult,
} from '@/types/policy'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MultiPolicyReportCardProps {
  report: MultiPolicySimulationReport
  onReset: () => void
  onViewJson: (policyDoc: InsurancePolicyDocument) => void
  allPolicyDocs: InsurancePolicyDocument[]
  onOpenCompare?: (pairId?: string) => void
}

export function MultiPolicyReportCard({
  report,
  onReset,
  onViewJson,
  allPolicyDocs,
  onOpenCompare,
}: MultiPolicyReportCardProps) {
  const [openPolicyTab, setOpenPolicyTab] = React.useState<string | null>(
    report.policy_results[0]?.contract_id ?? null,
  )
  const [expandedEvidences, setExpandedEvidences] = React.useState<Record<string, boolean>>({})

  const toggleEvidence = (id: string) => {
    setExpandedEvidences((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopyReport = async () => {
    const lines = [
      `[ANSIM 가입 보험 통합 시뮬레이션 리포트]`,
      `사고/진단명: ${report.user_input.incident_name}`,
      `발생일자: ${report.user_input.incident_date} (청구금액: ${report.user_input.claimed_amount.toLocaleString('ko-KR')}원)`,
      `심사 대상 보험: 총 ${report.evaluated_policies_count}개 상품`,
      `★ 총 예상 수령액: ${report.total_estimated_payout.toLocaleString('ko-KR')}원`,
      ``,
      `[보험 상품별 지급 내역]`,
      ...report.policy_results.map((p, pIdx) => {
        const itemLines = p.relevant_judgments.map(
          (j) => `  - ${j.coverage_name} [${j.status}]: ${j.estimated_payout.toLocaleString('ko-KR')}원 (${j.calculation_formula})`,
        )
        return `${pIdx + 1}. ${p.policy_name} (${p.insurer_name}) -> 소계: ${p.total_payout_for_policy.toLocaleString('ko-KR')}원\n${itemLines.join('\n')}`
      }),
      ``,
      `[전문가 소견]`,
      ...report.expert_insights.map((ins) => ` - ${ins}`),
      ``,
      `* 유의사항: ${report.disclaimer}`,
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('통합 시뮬레이션 리포트가 클립보드에 복사되었습니다.')
    } catch {
      toast.error('복사에 실패했습니다.')
    }
  }

  const getStatusBadge = (status: CoverageItemJudgment['status']) => {
    switch (status) {
      case 'ELIGIBLE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-mint/20 px-2.5 py-0.5 text-xs font-bold text-mint-foreground">
            <CheckCircle2 className="size-3.5 text-mint" />
            지급 가능
          </span>
        )
      case 'REDUCED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow/25 px-2.5 py-0.5 text-xs font-bold text-yellow-foreground">
            <Clock className="size-3.5 text-yellow-foreground" />
            감액 지급 적용
          </span>
        )
      case 'EXCLUDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-bold text-destructive">
            <XCircle className="size-3.5 text-destructive" />
            면책 (0원)
          </span>
        )
      case 'INSUFFICIENT_DATA':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
            <AlertCircle className="size-3.5" />
            정보 부족
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. 최상단 대형 총합산 요약 배너 */}
      <div className="rounded-3xl bg-gradient-to-br from-navy via-slate-900 to-navy p-6 text-white shadow-2xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-coral" />
            <span className="text-sm font-semibold tracking-wide text-white/90">
              가입 보험 ({report.evaluated_policies_count}건) 통합 보장 시뮬레이션 결과
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCompare && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenCompare('compare_manual_vs_mri')}
                className="h-8 rounded-full border-coral/40 bg-coral/20 text-xs text-white hover:bg-coral/30 hover:text-white font-bold"
              >
                <Scale className="mr-1.5 size-3.5 text-coral" />
                청구 조건 A vs B 비교
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyReport}
              className="h-8 rounded-full border-white/20 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white"
            >
              <Copy className="mr-1.5 size-3.5" />
              통합 리포트 복사
            </Button>
          </div>
        </div>

        {/* 메인 총액 & 요약 정보 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 flex flex-col gap-2">
            <span className="text-xs font-semibold text-white/70">
              발생 상황: <strong className="text-white">{report.user_input.incident_name}</strong> (
              {report.user_input.incident_date} 발생)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-coral sm:text-5xl">
                {report.total_estimated_payout.toLocaleString('ko-KR')}
              </span>
              <span className="text-2xl font-bold text-white/90">원</span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed mt-1">
              치료비 및 손해액 {report.user_input.claimed_amount.toLocaleString('ko-KR')}원 발생 시,
              보유 중인 보험에서 수령 가능한 총 예상 보험금입니다.
            </p>
          </div>

          {/* 우측 보험별 기여도 미니 카드 */}
          <div className="lg:col-span-5 flex flex-col gap-2 rounded-2xl bg-white/10 p-4">
            <span className="text-xs font-bold text-white/90 flex items-center gap-1.5">
              <Layers className="size-3.5 text-coral" />
              보험 상품별 예상 지급 기여도
            </span>
            <div className="flex flex-col gap-2 pt-1">
              {report.policy_results.map((p) => {
                const percentage =
                  report.total_estimated_payout > 0
                    ? Math.round((p.total_payout_for_policy / report.total_estimated_payout) * 100)
                    : 0

                return (
                  <div key={p.contract_id} className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between text-white/90">
                      <span className="font-semibold truncate max-w-[200px]">{p.policy_name}</span>
                      <span className="font-black text-coral">
                        {p.total_payout_for_policy.toLocaleString('ko-KR')}원 ({percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full bg-coral transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 전문가 / AI 통합 소견 박스 */}
      <div className="flex flex-col gap-2.5 rounded-3xl bg-secondary/50 p-5 border border-border">
        <div className="flex items-center gap-2 text-navy text-xs font-bold uppercase tracking-wider">
          <Sparkles className="size-4 text-coral" />
          <span>보장 분석 전문가 AI 종합 인사이트</span>
        </div>
        <div className="flex flex-col gap-2 text-xs leading-relaxed text-foreground/90 font-medium">
          {report.expert_insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-card p-3 rounded-2xl border border-border/70">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-coral/15 text-[10px] font-bold text-coral mt-0.5">
                {idx + 1}
              </span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 면책 고지 배너 */}
      <div className="flex items-start gap-3 rounded-2xl bg-yellow/15 p-4 ring-1 ring-yellow/30">
        <Info className="mt-0.5 size-5 shrink-0 text-yellow-foreground" />
        <div className="flex flex-col gap-1 text-xs text-yellow-foreground leading-relaxed">
          <p className="font-bold">약관 JSON 기반 모의 시뮬레이션 결과입니다</p>
          <p>{report.disclaimer}</p>
        </div>
      </div>

      {/* 4. 가입 보험별 상세 심사 내역 (탭 & 카드) */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <Building2 className="size-4 text-coral" />
            가입 보험별 세부 약관 심사 및 계산 내역
          </h3>
          <span className="text-xs text-muted-foreground">보험별 약관 원문 Evidence 검증</span>
        </div>

        {/* 보험별 카드 목록 */}
        {report.policy_results.map((policyRes, pIndex) => {
          const isSelected = openPolicyTab === policyRes.contract_id
          const doc = allPolicyDocs.find((d) => d.id === policyRes.policy_id)

          return (
            <Card
              key={policyRes.contract_id}
              className={cn(
                'rounded-3xl border transition-all shadow-sm overflow-hidden',
                policyRes.total_payout_for_policy > 0 ? 'border-border bg-card' : 'border-border/60 bg-muted/20',
              )}
            >
              {/* 보험 카드 헤더 */}
              <div
                onClick={() =>
                  setOpenPolicyTab(isSelected ? null : policyRes.contract_id)
                }
                className="cursor-pointer p-5 flex flex-wrap items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                    {pIndex + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-coral">{policyRes.insurer_name}</span>
                      <h4 className="text-sm font-black text-foreground sm:text-base">
                        {policyRes.policy_name}
                      </h4>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      가입일 {policyRes.contract_date} · 사고일까지 경과일수:{' '}
                      <strong className="text-foreground font-semibold">{policyRes.elapsed_days}일</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-muted-foreground block">예상 지급액</span>
                    <span className="text-base font-black text-navy sm:text-lg">
                      {policyRes.total_payout_for_policy.toLocaleString('ko-KR')}원
                    </span>
                  </div>

                  {doc && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewJson(doc)
                      }}
                      className="h-7 text-xs rounded-full px-2.5 hidden sm:flex"
                    >
                      <FileCode2 className="mr-1 size-3.5 text-coral" />
                      약관 JSON
                    </Button>
                  )}

                  {isSelected ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
                </div>
              </div>

              {/* 펼쳐진 상세 심사 내역 */}
              {isSelected && (
                <CardContent className="p-5 pt-0 border-t border-border/60 flex flex-col gap-4 mt-3">
                  {policyRes.relevant_judgments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      현재 발생 상황과 관련된 보장 항목이 이 보험에 없습니다.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-bold text-navy">
                        식별된 보장 항목 ({policyRes.relevant_judgments.length}건)
                      </span>

                      {policyRes.relevant_judgments.map((item, jIdx) => {
                        const isEvidenceOpen = Boolean(expandedEvidences[item.coverage_id])

                        return (
                          <div
                            key={item.coverage_id}
                            className="rounded-2xl border border-border/80 bg-secondary/30 p-4 flex flex-col gap-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  {jIdx + 1}. {item.coverage_name}
                                </span>
                              </div>
                              {getStatusBadge(item.status)}
                            </div>

                            {/* 계산식 블록 */}
                            <div className="rounded-xl bg-card p-3 border border-border text-xs flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground font-semibold">산출 수식:</span>
                                <span className="font-black text-coral text-sm">
                                  {item.estimated_payout.toLocaleString('ko-KR')}원
                                </span>
                              </div>
                              <div className="font-mono text-[11px] bg-secondary/40 p-2 rounded-lg text-foreground">
                                {item.calculation_formula}
                              </div>
                            </div>

                            {/* 판단 사유 */}
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              ⚖️ <strong>판단 사유:</strong> {item.decision_reason}
                            </p>

                            {/* Evidence 확인 토글 */}
                            {item.evidences.length > 0 && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => toggleEvidence(item.coverage_id)}
                                  className="flex items-center gap-1 text-[11px] font-bold text-coral hover:underline"
                                >
                                  <FileText className="size-3.5" />
                                  약관 근거 조항 {item.evidences.length}건 {isEvidenceOpen ? '접기' : '보기'}
                                </button>

                                {isEvidenceOpen && (
                                  <div className="mt-2 flex flex-col gap-2">
                                    {item.evidences.map((ev, evIdx) => (
                                      <div
                                        key={evIdx}
                                        className="rounded-xl border border-border/60 bg-background p-2.5 text-[11px]"
                                      >
                                        <div className="font-bold text-navy mb-0.5">{ev.title}</div>
                                        <div className="font-mono text-muted-foreground leading-relaxed">
                                          {ev.content}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 관련 없어 제외된 항목 목록 */}
                  {policyRes.unrelated_coverages.length > 0 && (
                    <div className="text-xs text-muted-foreground border-t border-border/60 pt-2">
                      <span>
                        🚫 상황 무관 제외 항목: {policyRes.unrelated_coverages.map((u) => u.coverage_name).join(', ')}
                      </span>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* 하단 다시 시뮬레이션 및 비교 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {onOpenCompare ? (
          <Button
            variant="outline"
            onClick={() => onOpenCompare('compare_manual_vs_mri')}
            className="rounded-full text-xs border-coral/40 text-coral hover:bg-coral/10 font-bold"
          >
            <Scale className="mr-1.5 size-3.5" />
            청구 조건별 A vs B 비교 모달 열기
          </Button>
        ) : (
          <div />
        )}
        <Button variant="outline" onClick={onReset} className="rounded-full">
          조건 수정하여 다시 시뮬레이션하기
        </Button>
      </div>
    </div>
  )
}
