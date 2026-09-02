'use client'

import * as React from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BadgeAlert,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Info,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CoverageItemJudgment, PolicySimulationReport } from '@/types/policy'
import { PolicyEvidenceViewer } from './policy-evidence-viewer'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SimulationReportCardProps {
  report: PolicySimulationReport
  onReset: () => void
  onViewJson: () => void
}

export function SimulationReportCard({ report, onReset, onViewJson }: SimulationReportCardProps) {
  const [showUnrelated, setShowUnrelated] = React.useState(false)

  const handleCopyReport = async () => {
    const lines = [
      `[ANSIM 보험금 시뮬레이션 결과 리포트]`,
      `상품명: ${report.policy_name} (${report.insurer_name})`,
      `사고/진단: ${report.user_input.incident_name}`,
      `경과일수: ${report.elapsed_days}일 (가입: ${report.user_input.contract_date} -> 발생: ${report.user_input.incident_date})`,
      `총 예상 시뮬레이션 금액: ${report.total_estimated_payout.toLocaleString('ko-KR')}원`,
      ``,
      `--- [심사 항목별 내역] ---`,
      ...report.relevant_judgments.map(
        (j: CoverageItemJudgment, i: number) =>
          `${i + 1}. ${j.coverage_name} [${j.status}]\n - 예상금액: ${j.estimated_payout.toLocaleString('ko-KR')}원\n - 계산식: ${j.calculation_formula}\n - 판단근거: ${j.decision_reason}`,
      ),
      ``,
      `* 주의: ${report.disclaimer}`,
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('시뮬레이션 리포트가 클립보드에 복사되었습니다.')
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
    <div className="flex flex-col gap-6 animate-in fade-in-50 duration-300">
      {/* 1. 최상단 요약 배너 */}
      <div className="rounded-3xl bg-gradient-to-br from-navy via-navy to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-coral" />
            <span className="text-sm font-semibold tracking-wide text-white/90">
              {report.policy_name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewJson}
              className="h-8 rounded-full border-white/20 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white"
            >
              <FileText className="mr-1.5 size-3.5 text-coral" />
              적용 약관 근거 확인
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyReport}
              className="h-8 rounded-full border-white/20 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white"
            >
              <Copy className="mr-1.5 size-3.5" />
              리포트 복사
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:items-end">
          <div>
            <span className="text-xs font-medium text-white/70">
              총 {report.relevant_judgments.length}개 관련 보장 항목 심사 결과
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-coral sm:text-4xl">
                {report.total_estimated_payout.toLocaleString('ko-KR')}
              </span>
              <span className="text-xl font-bold text-white/90">원</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-white/80">
              {report.summary_comment}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl bg-white/10 p-4 text-xs">
            <div className="flex items-center justify-between text-white/80">
              <span>가입일자</span>
              <span className="font-semibold text-white">{report.user_input.contract_date}</span>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span>사고/진단 발생일</span>
              <span className="font-semibold text-white">{report.user_input.incident_date}</span>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span>가입 후 경과 일수</span>
              <span className="inline-flex items-center font-bold text-yellow">
                <Calendar className="mr-1 size-3.5" />
                {report.elapsed_days}일 경과
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 중요한 안내 및 면책 고지 배너 */}
      <div className="flex items-start gap-3 rounded-2xl bg-yellow/15 p-4 ring-1 ring-yellow/30">
        <Info className="mt-0.5 size-5 shrink-0 text-yellow-foreground" />
        <div className="flex flex-col gap-1 text-xs text-yellow-foreground leading-relaxed">
          <p className="font-bold">약관 JSON 기반 모의 시뮬레이션 결과입니다</p>
          <p>{report.disclaimer}</p>
        </div>
      </div>

      {/* 3. 식별된 관련 보장 항목별 상세 심사 카드 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <Calculator className="size-4 text-coral" />
            식별된 보장 항목별 심사 및 계산 내역 ({report.relevant_judgments.length}건)
          </h3>
          <span className="text-xs text-muted-foreground">약관 규칙 전수 검증 완료</span>
        </div>

        {report.relevant_judgments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            입력된 상황과 일치하는 약관 보장 항목이 식별되지 않았습니다.
          </div>
        ) : (
          report.relevant_judgments.map((item: CoverageItemJudgment, idx: number) => {
            return (
              <Card
                key={item.coverage_id}
                className={cn(
                  'rounded-3xl border transition-all shadow-sm',
                  item.status === 'ELIGIBLE' && 'border-mint/40 bg-card',
                  item.status === 'REDUCED' && 'border-yellow/50 bg-card',
                  item.status === 'EXCLUDED' && 'border-destructive/30 bg-destructive/[0.02]',
                  item.status === 'INSUFFICIENT_DATA' && 'border-border bg-muted/30',
                )}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-navy">
                        {idx + 1}
                      </span>
                      <CardTitle className="text-base font-bold text-foreground">
                        {item.coverage_name}
                      </CardTitle>
                    </div>

                    {getStatusBadge(item.status)}
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 flex flex-col gap-4">
                  {/* 계산 결과 & 수식 */}
                  <div className="flex flex-col gap-2 rounded-2xl bg-secondary/50 p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        항목별 예상 시뮬레이션 금액
                      </span>
                      <span className="text-xl font-black text-navy">
                        {item.estimated_payout.toLocaleString('ko-KR')}원
                      </span>
                    </div>

                    <div className="mt-1 flex flex-col gap-1 border-t border-border/60 pt-2 font-mono text-xs">
                      <span className="text-muted-foreground font-sans font-semibold">
                        🧮 산출 수식:
                      </span>
                      <div className="rounded-lg bg-background p-2.5 text-foreground ring-1 ring-border/80">
                        {item.calculation_formula}
                      </div>
                    </div>
                  </div>

                  {/* 판단 사유 */}
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-semibold text-muted-foreground">⚖️ 판단 사유:</span>
                    <p className="leading-relaxed text-foreground font-medium bg-background/60 p-2.5 rounded-xl border border-border/60">
                      {item.decision_reason}
                    </p>
                  </div>

                  {/* 유의사항/메모 */}
                  {item.notes && item.notes.length > 0 && (
                    <div className="flex flex-col gap-1 rounded-xl bg-yellow/10 p-3 text-xs text-yellow-foreground">
                      {item.notes.map((note: string, nIdx: number) => (
                        <div key={nIdx} className="flex items-start gap-1.5">
                          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 약관 Evidence 원문 보기 컴포넌트 */}
                  {item.evidences.length > 0 && (
                    <PolicyEvidenceViewer
                      evidences={item.evidences}
                      coverageName={item.coverage_name}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* 4. 관련 없는 것으로 제외된 항목 목록 (원칙 3) */}
      {report.excluded_unrelated_coverages.length > 0 && (
        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <button
            type="button"
            onClick={() => setShowUnrelated(!showUnrelated)}
            className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <span>
              🚫 상황과 무관하여 최종 계산에서 제외된 약관 항목 (
              {report.excluded_unrelated_coverages.length}건)
            </span>
            {showUnrelated ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showUnrelated && (
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {report.excluded_unrelated_coverages.map((item: any) => (
                <div
                  key={item.coverage_id}
                  className="flex flex-col gap-1 rounded-xl bg-background p-3 text-xs"
                >
                  <span className="font-bold text-foreground">{item.coverage_name}</span>
                  <span className="text-muted-foreground">{item.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 하단 리셋/재시뮬레이션 버튼 */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onReset} className="rounded-full">
          조건 수정하여 다시 시뮬레이션
        </Button>
      </div>
    </div>
  )
}
