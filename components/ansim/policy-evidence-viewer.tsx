'use client'

import * as React from 'react'
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  FileCheck2,
  FileText,
  HelpCircle,
  Percent,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface EvidenceItem {
  rule_type: 'condition' | 'exclusion' | 'exception' | 'time_rule' | 'limit' | 'payment' | string
  title: string
  content: string
}

interface PolicyEvidenceViewerProps {
  evidences: EvidenceItem[]
  coverageName?: string
  className?: string
  defaultOpen?: boolean
}

/**
 * 룰 유형(rule_type)에 따른 시각적 배지 및 아이콘 정보 매핑
 */
function getRuleTypeBadge(ruleType: string) {
  switch (ruleType) {
    case 'condition':
      return {
        label: '지급 조건',
        icon: CheckCircle2,
        badgeClass: 'bg-mint/20 text-mint-foreground border-mint/30',
        cardClass: 'border-mint/30 bg-mint/[0.03]',
        accentColor: 'text-mint',
      }
    case 'exclusion':
      return {
        label: '면책 조항 (지급 제외)',
        icon: XCircle,
        badgeClass: 'bg-destructive/15 text-destructive border-destructive/30',
        cardClass: 'border-destructive/25 bg-destructive/[0.02]',
        accentColor: 'text-destructive',
      }
    case 'exception':
      return {
        label: '면책 예외 (보장 인정)',
        icon: ShieldCheck,
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
        cardClass: 'border-amber-500/30 bg-amber-500/[0.03]',
        accentColor: 'text-amber-600 dark:text-amber-400',
      }
    case 'time_rule':
      return {
        label: '시기 규칙 (면책/감액)',
        icon: Calendar,
        badgeClass: 'bg-yellow/25 text-yellow-foreground border-yellow/40',
        cardClass: 'border-yellow/30 bg-yellow/[0.03]',
        accentColor: 'text-yellow-foreground',
      }
    case 'limit':
      return {
        label: '한도 및 공제',
        icon: Scale,
        badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
        cardClass: 'border-blue-500/30 bg-blue-500/[0.03]',
        accentColor: 'text-blue-600 dark:text-blue-400',
      }
    case 'payment':
      return {
        label: '지급 산출 기준',
        icon: Coins,
        badgeClass: 'bg-coral/15 text-coral border-coral/30',
        cardClass: 'border-coral/30 bg-coral/[0.03]',
        accentColor: 'text-coral',
      }
    default:
      return {
        label: '약관 규정',
        icon: FileText,
        badgeClass: 'bg-secondary text-secondary-foreground border-border',
        cardClass: 'border-border bg-card',
        accentColor: 'text-muted-foreground',
      }
  }
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

export function PolicyEvidenceViewer({
  evidences,
  coverageName,
  className,
  defaultOpen = false,
}: PolicyEvidenceViewerProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)

  if (!evidences || evidences.length === 0) {
    return null
  }

  const handleCopyEvidence = async (content: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
      toast.success('해당 약관 조항 원문이 복사되었습니다.')
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      toast.error('복사에 실패했습니다.')
    }
  }

  return (
    <div className={cn('border-t border-border/70 pt-3', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left text-xs font-bold text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="size-3.5 text-coral transition-transform group-hover:scale-110" />
          <span>
            {coverageName ? `[${coverageName}] ` : ''}판단 근거 약관 조항 (
            <strong className="text-coral font-black">{evidences.length}건</strong>)
          </span>
          <span className="text-[10px] font-normal text-muted-foreground hidden sm:inline">
            — 핵심 Key 및 원문 증거
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-coral">
          <span>{isOpen ? '접기' : '조항 확인하기'}</span>
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-2.5 flex flex-col gap-2.5 animate-in fade-in-50 duration-200">
          {evidences.map((ev, idx) => {
            const typeInfo = getRuleTypeBadge(ev.rule_type)
            const Icon = typeInfo.icon
            const parsed = parseEvidenceContent(ev.content)

            return (
              <div
                key={idx}
                className={cn(
                  'rounded-2xl border p-3.5 text-xs shadow-2xs transition-all',
                  typeInfo.cardClass,
                )}
              >
                {/* 상단: 룰 유형 뱃지 & 조항 타이틀 & 복사 버튼 */}
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border',
                        typeInfo.badgeClass,
                      )}
                    >
                      <Icon className="size-3" />
                      {typeInfo.label}
                    </span>
                    <span className="font-bold text-foreground text-xs">{ev.title}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleCopyEvidence(ev.content, idx, e)}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-background/80 transition-colors"
                    title="조항 복사"
                  >
                    <Copy className="size-3" />
                    <span>{copiedIndex === idx ? '복사됨!' : '조항 복사'}</span>
                  </button>
                </div>

                {/* 약관 조항 원문 및 파싱 내용 */}
                <div className="rounded-xl bg-background/80 p-3 border border-border/60">
                  {parsed.clauseHeader && (
                    <div className="mb-1 text-[11px] font-bold text-navy flex items-center gap-1.5">
                      <FileCheck2 className="size-3.5 text-coral shrink-0" />
                      <span>{parsed.clauseHeader}</span>
                    </div>
                  )}
                  <p className="font-mono text-[11px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
                    {parsed.clauseBody}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
