'use client'

import * as React from 'react'
import {
  AlertCircle,
  Building2,
  Car,
  Check,
  CheckCircle2,
  FileCode2,
  HeartPulse,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CANDIDATE_EXTRA_POLICIES,
  DEFAULT_USER_POLICIES,
  getDefaultPoliciesForUser,
} from '@/lib/data/user-policies'
import { SAMPLE_POLICIES } from '@/lib/data/policies/sample-policies'
import type { InsurancePolicyDocument, UserEnrolledPolicy } from '@/types/policy'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface PolicyChangeSyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPolicies: UserEnrolledPolicy[]
  onSavePolicies: (updatedPolicies: UserEnrolledPolicy[]) => void
  onResetToDefault: () => void
  onSyncMyData: () => Promise<{ success: boolean; addedCount: number; message: string }>
  isSyncing: boolean
  lastSyncTime: string
}

export function PolicyChangeSyncDialog({
  open,
  onOpenChange,
  currentPolicies,
  onSavePolicies,
  onResetToDefault,
  onSyncMyData,
  isSyncing,
  lastSyncTime,
}: PolicyChangeSyncDialogProps) {
  const { user } = useAuth()
  const userName = user?.name || '홍길동'
  const [activeTab, setActiveTab] = React.useState<'sync' | 'catalog' | 'custom' | 'manage'>('sync')
  const [editingPolicies, setEditingPolicies] = React.useState<UserEnrolledPolicy[]>(currentPolicies)

  // 커스텀 보험 등록 폼 상태
  const [customInsurer, setCustomInsurer] = React.useState('삼성화재')
  const [customProductName, setCustomProductName] = React.useState('')
  const [customPremium, setCustomPremium] = React.useState<number>(35000)
  const [customDate, setCustomDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [customCategory, setCustomCategory] = React.useState<'건강보험' | '실손의료보험' | '여행자보험' | '운전자보험' | '치아보험'>('건강보험')

  // 다이얼로그 열릴 때 현재 상태 동기화
  React.useEffect(() => {
    if (open) {
      setEditingPolicies(currentPolicies)
    }
  }, [open, currentPolicies])

  // 1. 원클릭 마이데이터 실시간 재동기화
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

  // 2. 카탈로그에서 후보 보험 추가
  const handleAddFromCandidate = (candidate: UserEnrolledPolicy) => {
    const isAlready = editingPolicies.some(
      (p) => p.policy_id === candidate.policy_id || p.contract_id === candidate.contract_id,
    )
    if (isAlready) {
      toast.info('이미 마이데이터에 등록되어 있는 보험입니다.')
      return
    }

    const newEnrolled: UserEnrolledPolicy = {
      ...candidate,
      insured_name: userName,
      contract_id: `contract_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      contract_date: new Date().toISOString().slice(0, 10),
    }

    const updated = [newEnrolled, ...editingPolicies]
    setEditingPolicies(updated)
    onSavePolicies(updated)
    toast.success(`'${candidate.policy_document.product_name}'이(가) 마이데이터에 추가되었습니다!`)
  }

  // 3. 커스텀 보험 직접 추가
  const handleAddCustomPolicy = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customProductName.trim()) {
      toast.error('보험 상품명을 입력해 주세요.')
      return
    }

    // 기본 템플릿 문서 생성
    const customDoc: InsurancePolicyDocument = {
      id: `custom_policy_${Date.now()}`,
      product_name: customProductName.trim(),
      product_code: `SFMI-CUSTOM-${Math.floor(1000 + Math.random() * 9000)}`,
      category: customCategory,
      insurer_name: customInsurer.trim() || '삼성화재',
      version: '2026 사용자 맞춤 등록',
      summary: `${customInsurer}의 ${customProductName} 가입 증권입니다.`,
      coverages: [
        {
          id: `cov_custom_${Date.now()}_1`,
          name: `${customProductName} 기본 보장 담보`,
          category: '기본보장',
          insured_amount: 30000000,
          conditions: [
            {
              summary: `${customProductName} 관련 약관 보장 사유 발생 시 지급`,
              required_keywords: [customProductName.slice(0, 4), '진단', '치료', '사고', '수술'],
              evidence: '약관 제1조(보장내용): 약관에서 정한 지급 사유에 따라 가입금액을 지급합니다.',
            },
          ],
          exclusions: [
            {
              summary: '고의 사고 및 면책 사유 제외',
              evidence: '약관 제3조: 계약자 또는 피보험자의 고의 사고는 보상하지 않습니다.',
            },
          ],
          payment: {
            type: 'fixed',
            base_amount: 30000000,
            formula_description: '정액 최대 30,000,000원 한도 내 지급',
            evidence: '약관 제4조: 심사 후 가입금액 정액 지급.',
          },
        },
      ],
    }

    const newEnrolled: UserEnrolledPolicy = {
      contract_id: `contract_custom_${Date.now()}`,
      policy_id: customDoc.id,
      policy_document: customDoc,
      contract_number: `SFMI-USR-${Math.floor(1000 + Math.random() * 9000)}`,
      insured_name: userName,
      contract_date: customDate || new Date().toISOString().slice(0, 10),
      monthly_premium: customPremium || 30000,
      status: 'ACTIVE',
      tag_color: 'coral',
    }

    const updated = [newEnrolled, ...editingPolicies]
    setEditingPolicies(updated)
    onSavePolicies(updated)
    setCustomProductName('')
    toast.success(`새로운 가입 보험 '${customProductName}'이(가) 등록되었습니다!`)
    setActiveTab('manage')
  }

  // 4. 개별 보험 삭제
  const handleRemovePolicy = (contractId: string, productName: string) => {
    if (editingPolicies.length <= 1) {
      toast.error('최소 1개 이상의 보험 계약이 마이데이터에 유지되어야 합니다.')
      return
    }

    const updated = editingPolicies.filter((p) => p.contract_id !== contractId)
    setEditingPolicies(updated)
    onSavePolicies(updated)
    toast.info(`'${productName}'이(가) 마이데이터에서 삭제되었습니다.`)
  }

  // 5. 보험료 수정
  const handleUpdatePremium = (contractId: string, newPremium: number) => {
    const updated = editingPolicies.map((p) =>
      p.contract_id === contractId ? { ...p, monthly_premium: Math.max(0, newPremium) } : p,
    )
    setEditingPolicies(updated)
    onSavePolicies(updated)
  }

  // 6. 상태 토글 (ACTIVE vs LAPSED)
  const handleToggleStatus = (contractId: string) => {
    const updated = editingPolicies.map((p) =>
      p.contract_id === contractId
        ? { ...p, status: p.status === 'ACTIVE' ? ('LAPSED' as const) : ('ACTIVE' as const) }
        : p,
    )
    setEditingPolicies(updated)
    onSavePolicies(updated)
    toast.success('계약 유지 상태가 변경되었습니다.')
  }

  // 7. 기본값 리셋
  const handleReset = () => {
    onResetToDefault()
    const defaultList = getDefaultPoliciesForUser(user)
    setEditingPolicies(defaultList)
    toast.success(
      `마이데이터 가입 보험이 ${userName} 님의 초기 기본 증권(${defaultList.length}건) 상태로 복원되었습니다.`,
    )
  }

  // 8. 완료 및 닫기
  const handleApplyAndClose = () => {
    onSavePolicies(editingPolicies)
    toast.success(`변동된 ${editingPolicies.length}건의 보험이 마이데이터에 정상 적용되었습니다!`)
    onOpenChange(false)
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
                  마이데이터 보험 변동 내역 동기화 및 관리
                </DialogTitle>
                <Badge variant="secondary" className="bg-coral/10 text-coral text-[11px] font-bold border-0">
                  실시간 갱신
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                신규 가입, 해지, 또는 계약 변경사항이 있나요? 마이데이터를 재연동하여 최신 보험 정보를 반영하세요.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex items-center gap-1 border-b border-border bg-secondary/30 px-6 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              activeTab === 'sync'
                ? 'bg-card text-coral shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <Sparkles className="size-3.5" />
            <span>실시간 마이데이터 연동 (자동)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              activeTab === 'catalog'
                ? 'bg-card text-coral shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <Plus className="size-3.5" />
            <span>신규 보험 간편 추가 ({CANDIDATE_EXTRA_POLICIES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              activeTab === 'manage'
                ? 'bg-card text-coral shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <ShieldCheck className="size-3.5" />
            <span>현재 연동 목록 관리 ({editingPolicies.length}건)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all',
              activeTab === 'custom'
                ? 'bg-card text-coral shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <FileCode2 className="size-3.5" />
            <span>직접 등록</span>
          </button>
        </div>

        {/* 본문 콘텐츠 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. 자동 동기화 탭 */}
          {activeTab === 'sync' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
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
                      <span>현재 연동 계약: <strong className="text-navy">{editingPolicies.length}건</strong></span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  size="lg"
                  disabled={isSyncing}
                  onClick={handleTriggerSync}
                  className="rounded-2xl bg-coral hover:bg-coral/90 text-white font-bold text-xs h-12 px-6 shadow-lg shadow-coral/20 shrink-0 w-full md:w-auto"
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
                    현재 연동된 가입 증권 ({editingPolicies.length}건)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manage')}
                    className="text-[11px] text-coral hover:underline font-bold"
                  >
                    수정 및 관리하기 →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editingPolicies.map((p) => (
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
          )}

          {/* 2. 카탈로그에서 신규 보험 간편 추가 */}
          {activeTab === 'catalog' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    추가 가능한 대표 보험 상품 템플릿
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    새롭게 가입하신 보험이 있다면 원클릭으로 내 마이데이터에 추가할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {CANDIDATE_EXTRA_POLICIES.map((cand) => {
                  const isEnrolled = editingPolicies.some(
                    (p) => p.policy_id === cand.policy_id || p.contract_id === cand.contract_id,
                  )

                  return (
                    <Card
                      key={cand.contract_id}
                      className={cn(
                        'rounded-2xl border transition-all p-4 flex flex-col justify-between gap-3 shadow-xs',
                        isEnrolled ? 'border-mint/50 bg-mint/5' : 'border-border bg-card hover:border-coral/40',
                      )}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-coral">
                            {cand.policy_document.insurer_name}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-2 py-0">
                            {cand.policy_document.category}
                          </Badge>
                        </div>
                        <h5 className="text-xs font-black text-foreground line-clamp-2">
                          {cand.policy_document.product_name}
                        </h5>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {cand.policy_document.summary}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-border/60 pt-2.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">예상 월 납입액</span>
                          <span className="font-black text-navy">
                            {cand.monthly_premium.toLocaleString('ko-KR')}원
                          </span>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          disabled={isEnrolled}
                          onClick={() => handleAddFromCandidate(cand)}
                          className={cn(
                            'rounded-xl text-xs font-bold h-9 w-full transition-all',
                            isEnrolled
                              ? 'bg-mint/20 text-mint-foreground hover:bg-mint/20'
                              : 'bg-navy hover:bg-navy/90 text-white shadow-xs',
                          )}
                        >
                          {isEnrolled ? (
                            <>
                              <Check className="mr-1 size-3.5 stroke-[3]" />
                              이미 연동됨
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1 size-3.5" />
                              내 마이데이터에 추가
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* 3. 현재 가입 목록 관리 & 편집 */}
          {activeTab === 'manage' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    현재 마이데이터 연동 가입 보험 편집 ({editingPolicies.length}건)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    각 계약의 월 납입 보험료를 수정하거나, 해지된 계약을 삭제/상태 변경할 수 있습니다.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="rounded-xl text-xs h-8 text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="size-3" />
                  기본 3종으로 복원
                </Button>
              </div>

              <div className="space-y-3">
                {editingPolicies.map((p) => {
                  const doc = p.policy_document

                  return (
                    <div
                      key={p.contract_id}
                      className="rounded-2xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-coral shrink-0 mt-0.5">
                          <ShieldCheck className="size-5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-coral">{doc.insurer_name}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {p.contract_number}
                            </Badge>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p.contract_id)}
                              className="cursor-pointer"
                              title="클릭하여 상태 변경"
                            >
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-[10px] font-bold border-0 transition-colors',
                                  p.status === 'ACTIVE'
                                    ? 'bg-mint/20 text-mint-foreground hover:bg-mint/30'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                                )}
                              >
                                {p.status === 'ACTIVE' ? '정상 유지' : '해지/실효'}
                              </Badge>
                            </button>
                          </div>
                          <h5 className="text-sm font-black text-foreground">{doc.product_name}</h5>
                          <span className="text-[11px] text-muted-foreground">
                            가입일: {p.contract_date} · 보장 담보 {doc.coverages.length}개
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[11px] text-muted-foreground whitespace-nowrap">
                            월 보험료:
                          </Label>
                          <Input
                            type="number"
                            value={p.monthly_premium}
                            onChange={(e) =>
                              handleUpdatePremium(p.contract_id, Number(e.target.value) || 0)
                            }
                            className="w-24 h-8 text-xs font-mono rounded-lg text-right"
                          />
                          <span className="text-xs text-muted-foreground">원</span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePolicy(p.contract_id, doc.product_name)}
                          className="h-8 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg text-xs"
                          title="마이데이터에서 삭제"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 4. 직접 등록 탭 */}
          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustomPolicy} className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  새로운 보험 계약 직접 입력 등록
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  타사에서 가입한 보험의 증권 정보를 직접 기입하여 마이데이터에 수동으로 반영합니다.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-secondary/30 p-5 rounded-2xl border border-border">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-foreground">보험사명 *</Label>
                  <Input
                    value={customInsurer}
                    onChange={(e) => setCustomInsurer(e.target.value)}
                    placeholder="예: 삼성화재, 현대해상, 메리츠화재"
                    className="rounded-xl text-xs h-9 bg-background"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-foreground">보험 상품명 *</Label>
                  <Input
                    value={customProductName}
                    onChange={(e) => setCustomProductName(e.target.value)}
                    placeholder="예: 무배당 내맘같은 종합보험"
                    className="rounded-xl text-xs h-9 bg-background"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-foreground">보험 종류 / 카테고리</Label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="rounded-xl text-xs h-9 bg-background border border-input px-3 focus:outline-none focus:ring-2 focus:ring-coral"
                  >
                    <option value="건강보험">건강보험</option>
                    <option value="실손의료보험">실손의료보험</option>
                    <option value="운전자보험">운전자보험</option>
                    <option value="치아보험">치아보험</option>
                    <option value="여행자보험">여행자보험</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-foreground">월 납입 보험료 (원)</Label>
                  <Input
                    type="number"
                    value={customPremium || ''}
                    onChange={(e) => setCustomPremium(Number(e.target.value) || 0)}
                    placeholder="35000"
                    className="rounded-xl text-xs h-9 bg-background font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-foreground">가입 일자</Label>
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="rounded-xl text-xs h-9 bg-background w-full sm:w-1/2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="submit"
                  className="rounded-xl bg-coral hover:bg-coral/90 text-white font-bold text-xs h-10 px-5 shadow-sm"
                >
                  <Plus className="mr-1 size-3.5" />
                  가입 보험 등록하기
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* 모달 하단 푸터 액션 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-card px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-mint-foreground shrink-0" />
            <span>
              현재 총 <strong className="text-foreground">{editingPolicies.length}개</strong>의 보험 계약이 마이데이터에 연동됩니다.
            </span>
          </div>

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
              onClick={handleApplyAndClose}
              className="rounded-xl bg-coral hover:bg-coral/90 text-white text-xs font-bold h-10 px-5 shadow-lg shadow-coral/20 flex-1 sm:flex-none"
            >
              <Check className="mr-1.5 size-4 stroke-[2.5]" />
              변동된 보험 마이데이터에 적용 완료
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
