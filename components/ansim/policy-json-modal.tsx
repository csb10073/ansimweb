'use client'

import * as React from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  FileCheck2,
  FileText,
  Filter,
  Layers,
  Percent,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { InsurancePolicyDocument, PolicyCoverageItem } from '@/types/policy'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface PolicyJsonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy: InsurancePolicyDocument
}

/**
 * 약관 본문에서 '약관 제N조(...)' 등 조항 헤더와 본문을 분리하여 강조 표시
 */
function parseEvidenceContent(content: string) {
  const match = content.match(/^([^:]+:\s*)(.*)$/)
  if (match) {
    return {
      clauseHeader: match[1].trim(),
      clauseBody: match[2].trim(),
    }
  }
  return {
    clauseHeader: null,
    clauseBody: content,
  }
}

export function PolicyJsonModal({ open, onOpenChange, policy }: PolicyJsonModalProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')
  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({})
  const [copiedClause, setCopiedClause] = React.useState<string | null>(null)

  // 전체 카테고리 목록 추출
  const categories = React.useMemo(() => {
    const cats = Array.from(new Set(policy.coverages.map((c) => c.category)))
    return ['all', ...cats]
  }, [policy])

  // 검색 및 카테고리 필터링된 보장 항목
  const filteredCoverages = React.useMemo(() => {
    return policy.coverages.filter((c) => {
      const matchCat = selectedCategory === 'all' || c.category === selectedCategory
      if (!matchCat) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const inName = c.name.toLowerCase().includes(q)
      const inCategory = c.category.toLowerCase().includes(q)
      const inConditions = c.conditions.some(
        (cond) =>
          cond.summary.toLowerCase().includes(q) ||
          cond.required_keywords.some((kw) => kw.toLowerCase().includes(q)) ||
          cond.evidence.toLowerCase().includes(q),
      )
      const inExclusions = c.exclusions.some(
        (excl) => excl.summary.toLowerCase().includes(q) || excl.evidence.toLowerCase().includes(q),
      )
      return inName || inCategory || inConditions || inExclusions
    })
  }, [policy, selectedCategory, searchQuery])

  // 개별 펼치기/접기
  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // 전체 펼치기 / 전체 접기
  const handleExpandAll = () => {
    const next: Record<string, boolean> = {}
    filteredCoverages.forEach((c) => {
      next[c.id] = true
    })
    setExpandedItems(next)
  }

  const handleCollapseAll = () => {
    setExpandedItems({})
  }

  const handleCopyClause = async (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopiedClause(id)
      toast.success('약관 조항 원문이 클립보드에 복사되었습니다.')
      setTimeout(() => setCopiedClause(null), 2000)
    } catch {
      toast.error('복사에 실패했습니다.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl lg:max-w-5xl h-[90vh] max-h-[90vh] flex flex-col p-5 sm:p-7 rounded-3xl overflow-hidden bg-card">
        {/* 헤더 */}
        <DialogHeader className="flex flex-col gap-2 pb-4 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-coral/15 flex items-center justify-center text-coral shadow-xs">
                <BookOpen className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-coral px-2.5 py-0.5 rounded-full bg-coral/10">
                    {policy.insurer_name}
                  </span>
                  <Badge variant="outline" className="text-xs font-bold">
                    {policy.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">버전 {policy.version}</span>
                </div>
                <DialogTitle className="text-lg sm:text-xl font-black text-navy mt-1 flex items-center gap-2">
                  <span>{policy.product_name}</span>
                  <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
                    — 약관 근거 및 보장 규정
                  </span>
                </DialogTitle>
              </div>
            </div>

            <Badge variant="secondary" className="bg-navy/10 text-navy text-xs font-bold px-3 py-1 rounded-full">
              총 {policy.coverages.length}개 보장 조항 수록
            </Badge>
          </div>

          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
            {policy.summary} · 모든 보장 계산은 아래의 <strong>판단 근거 약관 조항(Evidence)</strong>에 명시된 규칙만을 근거로 수행됩니다.
          </DialogDescription>
        </DialogHeader>

        {/* 본문 영역 */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-4 py-2">
            {/* 상단 검색 & 필터 바 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-secondary/40 p-3 rounded-2xl border border-border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="보장명, 진단/수술 키워드(예: 암, 수술, 도수치료), 약관 조항 검색..."
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

              {/* 카테고리 필터 태그 */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all',
                      selectedCategory === cat
                        ? 'bg-navy text-white border-navy shadow-2xs'
                        : 'bg-background text-muted-foreground border-border hover:bg-muted',
                    )}
                  >
                    {cat === 'all' ? '전체 카테고리' : cat}
                  </button>
                ))}
              </div>

              {/* 전체 펼치기/접기 */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpandAll}
                  className="h-8 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  전체 펼치기
                </Button>
                <span className="text-border">|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCollapseAll}
                  className="h-8 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  전체 접기
                </Button>
              </div>
            </div>

            {/* 검색 결과 카운트 */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                조회된 보장 항목:{' '}
                <strong className="text-foreground font-bold">{filteredCoverages.length}개</strong>
                {searchQuery && ` ('${searchQuery}' 검색)`}
              </span>
              <span className="text-[11px] text-coral font-medium flex items-center gap-1">
                <Sparkles className="size-3" />
                각 항목을 클릭하면 판단 근거 조항 원문을 확인하실 수 있습니다
              </span>
            </div>

            {/* 보장 항목 리스트 */}
            {filteredCoverages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                <AlertCircle className="size-6 text-muted-foreground/60" />
                <p className="font-bold text-foreground">일치하는 약관 보장 항목이 없습니다.</p>
                <p>검색어를 변경하거나 카테고리 필터를 초기화해 보세요.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredCoverages.map((item, idx) => {
                  const isExpanded = expandedItems[item.id] !== false // 기본 펼침 상태

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-3xl border bg-card p-4 sm:p-5 transition-all shadow-xs flex flex-col gap-3.5',
                        isExpanded ? 'border-border ring-1 ring-border/50' : 'border-border/60 hover:border-border',
                      )}
                    >
                      {/* 카드 상단 바 */}
                      <div
                        onClick={() => toggleItem(item.id)}
                        className="cursor-pointer flex flex-wrap items-center justify-between gap-3 select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white shadow-2xs">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-coral px-2 py-0.5 rounded-md bg-coral/10">
                                {item.category}
                              </span>
                              <h4 className="text-sm sm:text-base font-black text-foreground">
                                {item.name}
                              </h4>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block font-medium">가입금액</span>
                            <span className="text-sm sm:text-base font-black text-navy">
                              {item.insured_amount.toLocaleString('ko-KR')}원
                            </span>
                          </div>

                          <button
                            type="button"
                            className="size-8 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </button>
                        </div>
                      </div>

                      {/* 상세 펼침 영역: 약관 판단 근거 조항들을 명시적으로 배치 */}
                      {isExpanded && (
                        <div className="flex flex-col gap-3.5 border-t border-border/70 pt-3.5 animate-in fade-in-50 duration-200">
                          {/* 1. 지급 요건 및 필수 매칭 기준 (Conditions) */}
                          <div className="rounded-2xl border border-mint/35 bg-mint/[0.04] p-4 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-bold text-mint-foreground">
                                <CheckCircle2 className="size-4 text-mint" />
                                <span>1. 지급 요건 및 판단 기준 ({item.conditions.length}건)</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                해당 조건 충족 시 보장 대상 인정
                              </span>
                            </div>

                            <div className="flex flex-col gap-2.5">
                              {item.conditions.map((cond, cIdx) => {
                                const parsed = parseEvidenceContent(cond.evidence)
                                const clauseId = `cond_${item.id}_${cIdx}`
                                return (
                                  <div key={cIdx} className="rounded-xl bg-background p-3.5 border border-border/70 text-xs shadow-2xs">
                                    {/* 조건 요약 */}
                                    <p className="font-bold text-foreground text-xs mb-2 leading-relaxed">
                                      {cond.summary}
                                    </p>

                                    {/* 필수 키워드 태그 */}
                                    {cond.required_keywords.length > 0 && (
                                      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] text-muted-foreground font-semibold">판단 매칭 키워드:</span>
                                        {cond.required_keywords.map((kw, kIdx) => (
                                          <span
                                            key={kIdx}
                                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-mint/15 text-mint-foreground border border-mint/30"
                                          >
                                            #{kw}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* 명시적인 약관 조항 인용 박스 */}
                                    <div className="rounded-xl bg-secondary/50 p-3 border border-border/60">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[11px] font-black text-navy flex items-center gap-1.5">
                                          <FileCheck2 className="size-3.5 text-coral shrink-0" />
                                          {parsed.clauseHeader || '📜 약관 판단 근거 조항'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => handleCopyClause(cond.evidence, clauseId, e)}
                                          className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border border-border/60"
                                        >
                                          <Copy className="size-2.5" />
                                          <span>{copiedClause === clauseId ? '복사됨' : '조항 복사'}</span>
                                        </button>
                                      </div>
                                      <p className="font-mono text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                        {parsed.clauseBody}
                                      </p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* 2. 면책 사항 (Exclusions) */}
                          {item.exclusions && item.exclusions.length > 0 && (
                            <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.03] p-4 flex flex-col gap-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-destructive">
                                  <XCircle className="size-4 text-destructive" />
                                  <span>2. 면책 조항 (보상하지 아니하는 손해, {item.exclusions.length}건)</span>
                                </div>
                                <span className="text-[10px] text-destructive/80 font-medium">
                                  해당 사유 발생 시 보험금 0원 처리
                                </span>
                              </div>

                              <div className="flex flex-col gap-2.5">
                                {item.exclusions.map((excl, eIdx) => {
                                  const parsed = parseEvidenceContent(excl.evidence)
                                  const clauseId = `excl_${item.id}_${eIdx}`
                                  return (
                                    <div key={eIdx} className="rounded-xl bg-background p-3.5 border border-border/70 text-xs shadow-2xs">
                                      <p className="font-bold text-foreground text-xs mb-2 leading-relaxed">
                                        🚫 {excl.summary}
                                      </p>
                                      <div className="rounded-xl bg-secondary/50 p-3 border border-border/60">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[11px] font-black text-navy flex items-center gap-1.5">
                                            <FileCheck2 className="size-3.5 text-destructive shrink-0" />
                                            {parsed.clauseHeader || '📜 면책 근거 조항'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => handleCopyClause(excl.evidence, clauseId, e)}
                                            className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border border-border/60"
                                          >
                                            <Copy className="size-2.5" />
                                            <span>{copiedClause === clauseId ? '복사됨' : '조항 복사'}</span>
                                          </button>
                                        </div>
                                        <p className="font-mono text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                          {parsed.clauseBody}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* 3. 면책 예외 규정 (Exceptions) */}
                          {item.exceptions && item.exceptions.length > 0 && (
                            <div className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.04] p-4 flex flex-col gap-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                                  <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />
                                  <span>3. 면책 예외 조항 (예외적 보장 인정 규정, {item.exceptions.length}건)</span>
                                </div>
                                <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium">
                                  면책 조건에 해당하더라도 예외적으로 보장
                                </span>
                              </div>

                              <div className="flex flex-col gap-2.5">
                                {item.exceptions.map((exc, exIdx) => {
                                  const parsed = parseEvidenceContent(exc.evidence)
                                  const clauseId = `exc_${item.id}_${exIdx}`
                                  return (
                                    <div key={exIdx} className="rounded-xl bg-background p-3.5 border border-border/70 text-xs shadow-2xs">
                                      <p className="font-bold text-foreground text-xs mb-2 leading-relaxed">
                                        ✨ {exc.summary}
                                      </p>
                                      <div className="rounded-xl bg-secondary/50 p-3 border border-border/60">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[11px] font-black text-navy flex items-center gap-1.5">
                                            <FileCheck2 className="size-3.5 text-amber-600 shrink-0" />
                                            {parsed.clauseHeader || '📜 면책 예외 근거 조항'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => handleCopyClause(exc.evidence, clauseId, e)}
                                            className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background border border-border/60"
                                          >
                                            <Copy className="size-2.5" />
                                            <span>{copiedClause === clauseId ? '복사됨' : '조항 복사'}</span>
                                          </button>
                                        </div>
                                        <p className="font-mono text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                          {parsed.clauseBody}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* 4. 시기 규칙 (면책 대기기간 / 감액 지급 기간) */}
                          {item.time_rules && item.time_rules.length > 0 && (
                            <div className="rounded-2xl border border-yellow/40 bg-yellow/[0.04] p-4 flex flex-col gap-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-yellow-foreground">
                                  <Calendar className="size-4 text-yellow-foreground" />
                                  <span>4. 시기 규칙 (면책 대기기간 및 감액 기간, {item.time_rules.length}건)</span>
                                </div>
                                <span className="text-[10px] text-yellow-foreground font-medium">
                                  가입일로부터 경과 일수에 따른 지급률 적용
                                </span>
                              </div>

                              <div className="grid gap-2.5 sm:grid-cols-2">
                                {item.time_rules.map((tr, tIdx) => {
                                  const parsed = parseEvidenceContent(tr.evidence)
                                  return (
                                    <div key={tIdx} className="rounded-xl bg-background p-3.5 border border-border/70 text-xs shadow-2xs flex flex-col justify-between gap-2">
                                      <div>
                                        <div className="flex items-center justify-between gap-1 mb-2">
                                          <span className="font-black text-navy text-xs">
                                            {tr.type === 'waiting_period' ? '⏳ 면책 기간 (보장개시 전)' : '📉 감액 지급 기간'}
                                          </span>
                                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-yellow/20 text-yellow-foreground border border-yellow/40">
                                            {tr.period_days}일 이내 (지급률 {Math.round(tr.payout_ratio * 100)}%)
                                          </span>
                                        </div>
                                        <p className="text-foreground/90 leading-relaxed text-xs mb-2">
                                          {tr.description}
                                        </p>
                                      </div>
                                      <div className="rounded-xl bg-secondary/50 p-2.5 border border-border/60 font-mono text-[10px] text-muted-foreground leading-relaxed">
                                        <div className="font-bold text-navy font-sans mb-0.5">
                                          {parsed.clauseHeader || '📜 약관 조항:'}
                                        </div>
                                        {parsed.clauseBody}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* 5. 지급 산출 공식 & 한도/자기부담금 */}
                          <div className="grid gap-3 sm:grid-cols-2">
                            {/* 지급 산출 방식 */}
                            <div className="rounded-2xl border border-coral/35 bg-coral/[0.04] p-4 flex flex-col gap-2.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-coral">
                                <Coins className="size-4 text-coral" />
                                <span>5. 지급 산출 기준 ({item.payment.type})</span>
                              </div>
                              <div className="rounded-xl bg-background p-3.5 border border-border/70 text-xs flex-1 flex flex-col justify-between gap-2 shadow-2xs">
                                <div>
                                  <span className="text-[10px] font-bold text-muted-foreground block mb-1">산출 공식:</span>
                                  <div className="font-bold text-foreground leading-relaxed font-mono bg-secondary/50 p-2 rounded-lg border border-border/60">
                                    {item.payment.formula_description}
                                  </div>
                                </div>
                                <div className="rounded-xl bg-secondary/50 p-2.5 border border-border/60 font-mono text-[10px] text-muted-foreground leading-relaxed">
                                  <span className="font-bold text-navy font-sans mr-1">📜 산출 근거:</span>
                                  {item.payment.evidence}
                                </div>
                              </div>
                            </div>

                            {/* 한도 및 공제 */}
                            {item.limits && item.limits.length > 0 && (
                              <div className="rounded-2xl border border-blue-500/35 bg-blue-500/[0.04] p-4 flex flex-col gap-2.5">
                                <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400">
                                  <Scale className="size-4 text-blue-600 dark:text-blue-400" />
                                  <span>6. 한도 및 자기부담금 규정 ({item.limits.length}건)</span>
                                </div>
                                <div className="flex flex-col gap-2 flex-1">
                                  {item.limits.map((lim, lIdx) => (
                                    <div key={lIdx} className="rounded-xl bg-background p-3.5 border border-border/70 text-xs flex-1 flex flex-col justify-between gap-2 shadow-2xs">
                                      <p className="font-bold text-foreground leading-relaxed">
                                        {lim.description}
                                      </p>
                                      <div className="rounded-xl bg-secondary/50 p-2.5 border border-border/60 font-mono text-[10px] text-muted-foreground leading-relaxed">
                                        <span className="font-bold text-navy font-sans mr-1">📜 한도 규정:</span>
                                        {lim.evidence}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 모달 하단 푸터 */}
        <div className="mt-3 pt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
          <span className="hidden sm:inline">
            모든 시뮬레이션 계산식은 위 약관의 conditions, exclusions, time_rules, limits, evidence만을 판단 근거로 수행됩니다.
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-5 ml-auto font-bold"
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
