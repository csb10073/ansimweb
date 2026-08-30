'use client'

import * as React from 'react'
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCode2,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { InsurancePolicyDocument, UserEnrolledPolicy } from '@/types/policy'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface MyPoliciesSectionProps {
  policies: UserEnrolledPolicy[]
  selectedContractIds: string[]
  onTogglePolicy: (contractId: string) => void
  onSelectAll: () => void
  onViewJson: (policyDoc: InsurancePolicyDocument) => void
}

export function MyPoliciesSection({
  policies,
  selectedContractIds,
  onTogglePolicy,
  onSelectAll,
  onViewJson,
}: MyPoliciesSectionProps) {
  const { user } = useAuth()
  const userName = user?.name || '홍길동'
  const isAllSelected = selectedContractIds.length === policies.length

  const totalMonthlyPremium = policies
    .filter((p) => selectedContractIds.includes(p.contract_id))
    .reduce((sum, p) => sum + p.monthly_premium, 0)

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* 마이데이터 조회 상단 헤더 배너 */}
      <div className="flex flex-col gap-4 rounded-3xl bg-secondary/50 p-5 sm:p-6 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-coral/15 text-coral">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground sm:text-lg">
                  {userName} 님의 가입 보험 증권 조회
                </h3>
                <span className="inline-flex items-center rounded-full bg-mint/20 px-2.5 py-0.5 text-[11px] font-bold text-mint-foreground">
                  마이데이터 연동 완료
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                총 {policies.length}건의 유효 계약이 조회되었습니다. 시뮬레이션에 포함할 보험을 선택하세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="rounded-full text-xs h-8"
            >
              {isAllSelected ? '전체 해제' : '전체 선택'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-3 text-xs">
          <span className="text-muted-foreground">
            선택된 보험: <strong className="text-navy">{selectedContractIds.length}건</strong>
          </span>
          <span className="text-muted-foreground">
            선택 보험 총 월 보험료:{' '}
            <strong className="text-coral text-sm font-black">
              {totalMonthlyPremium.toLocaleString('ko-KR')}원
            </strong>
          </span>
        </div>
      </div>

      {/* 가입 보험 카드 그리드 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {policies.map((enrolled) => {
          const isSelected = selectedContractIds.includes(enrolled.contract_id)
          const doc = enrolled.policy_document

          return (
            <Card
              key={enrolled.contract_id}
              onClick={() => onTogglePolicy(enrolled.contract_id)}
              className={cn(
                'cursor-pointer rounded-3xl border transition-all duration-200 shadow-sm relative overflow-hidden flex flex-col justify-between',
                isSelected
                  ? 'border-coral bg-card ring-2 ring-coral/80 shadow-md -translate-y-0.5'
                  : 'border-border bg-card/60 opacity-60 hover:opacity-100 hover:border-border/80',
              )}
            >
              {/* 상단 체크 배지 */}
              <div className="p-5 pb-3 flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-coral tracking-wide">
                    {doc.insurer_name}
                  </span>
                  <CardTitle className="text-sm font-black text-foreground line-clamp-1">
                    {doc.product_name}
                  </CardTitle>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    증권번호: {enrolled.contract_number}
                  </span>
                </div>

                <div
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                    isSelected
                      ? 'bg-coral border-coral text-white'
                      : 'border-muted-foreground/40 bg-background',
                  )}
                >
                  {isSelected && <Check className="size-3.5 stroke-[3]" />}
                </div>
              </div>

              <CardContent className="p-5 pt-0 flex flex-col gap-3">
                <div className="flex flex-col gap-1 rounded-2xl bg-secondary/40 p-3 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>가입일자</span>
                    <span className="font-semibold text-foreground">{enrolled.contract_date}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>월 보험료</span>
                    <span className="font-bold text-navy">
                      {enrolled.monthly_premium.toLocaleString('ko-KR')}원
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>보장 항목 수</span>
                    <span className="font-semibold text-foreground">
                      {doc.coverages.length}개 보장 항목
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1">
                    {doc.coverages.slice(0, 2).map((c) => (
                      <Badge
                        key={c.id}
                        variant="secondary"
                        className="text-[10px] px-2 py-0.5 rounded-full"
                      >
                        {c.name}
                      </Badge>
                    ))}
                    {doc.coverages.length > 2 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0.5 rounded-full text-muted-foreground"
                      >
                        +{doc.coverages.length - 2}
                      </Badge>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewJson(doc)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-coral hover:underline"
                  >
                    <FileCode2 className="size-3.5" />
                    약관 JSON
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
