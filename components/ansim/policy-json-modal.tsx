'use client'

import * as React from 'react'
import { Check, Copy, FileCode, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { InsurancePolicyDocument } from '@/types/policy'

interface PolicyJsonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy: InsurancePolicyDocument
}

export function PolicyJsonModal({ open, onOpenChange, policy }: PolicyJsonModalProps) {
  const [copied, setCopied] = React.useState(false)

  const jsonString = React.useMemo(() => {
    return JSON.stringify(policy, null, 2)
  }, [policy])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] sm:max-w-3xl lg:max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-3xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-navy/10 flex items-center justify-center text-navy">
              <Shield className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-navy">
                {policy.product_name} — 약관 JSON 데이터
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                약관 버전: {policy.version} · 총 {policy.coverages.length}개 보장 항목
              </DialogDescription>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs rounded-full mr-6"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-mint" />
                <span>복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>JSON 복사</span>
              </>
            )}
          </Button>
        </DialogHeader>

        <div className="relative flex-1 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100 mt-4 shadow-inner">
          <pre className="whitespace-pre overflow-x-auto leading-relaxed">
            {jsonString}
          </pre>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>모든 판단과 계산식은 위 JSON의 conditions, exclusions, time_rules, limits, evidence만을 근거로 수행됩니다.</span>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)} className="rounded-full">
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
