'use client'

import * as React from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Calendar,
  CheckCircle2,
  FileCode2,
  FileSearch,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Zap,
  Scale,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEFAULT_USER_POLICIES } from '@/lib/data/user-policies'
import { SAMPLE_POLICIES } from '@/lib/data/policies/sample-policies'
import { PRESET_SCENARIOS, type PresetScenario } from '@/lib/data/policies/preset-scenarios'
import { runMultiPolicySimulation } from '@/lib/policy-engine'
import type {
  InsurancePolicyDocument,
  MultiPolicySimulationReport,
  UserEnrolledPolicy,
  UserSituationInput,
} from '@/types/policy'
import { MyPoliciesSection } from './my-policies-section'
import { MultiPolicyReportCard } from './multi-policy-report-card'
import { PolicyJsonModal } from './policy-json-modal'
import { ScenarioToggleBuilder, type ScenarioBuilderOutput } from './scenario-toggle-builder'
import { ClaimConditionComparator } from './claim-condition-comparator'
import { cn } from '@/lib/utils'

interface SimulationWorkspaceProps {
  isModal?: boolean
}

const PRESET_CATEGORY_TABS = [
  { id: 'all', label: '전체' },
  { id: 'cancer', label: '🎗️ 3대 암' },
  { id: 'cerebro_cardio', label: '🫀 뇌·심장' },
  { id: 'surgery', label: '🏥 질병·수술' },
  { id: 'outpatient_special', label: '💆 도수·비급여' },
  { id: 'injury', label: '🦴 상해·골절' },
  { id: 'travel', label: '✈️ 해외여행' },
  { id: 'exclusion', label: '🛡️ 면책검증' },
] as const

export function SimulationWorkspace({ isModal = false }: SimulationWorkspaceProps) {
  // 스텝 관리: 1: 가입보험 조회, 2: 상황입력, 3: 결과리포트
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1)

  // 프리셋 카테고리 필터
  const [presetCategory, setPresetCategory] = React.useState<string>('all')

  const filteredPresets = React.useMemo(() => {
    if (presetCategory === 'all') return PRESET_SCENARIOS
    return PRESET_SCENARIOS.filter((p) => p.category === presetCategory)
  }, [presetCategory])

  // 1단계: 사용자 가입 보험 목록 및 선택된 계약 IDs
  const [userPolicies, setUserPolicies] = React.useState<UserEnrolledPolicy[]>(DEFAULT_USER_POLICIES)
  const [selectedContractIds, setSelectedContractIds] = React.useState<string[]>(
    DEFAULT_USER_POLICIES.map((p) => p.contract_id),
  )

  // 2단계: 발생 상황 입력 방식 (토글 빌더 vs 직접 입력/상세 폼)
  const [inputMethod, setInputMethod] = React.useState<'toggle_builder' | 'manual_form'>('toggle_builder')
  const [selectedPresetId, setSelectedPresetId] = React.useState<string | null>(PRESET_SCENARIOS[0].id)
  const [situationText, setSituationText] = React.useState(PRESET_SCENARIOS[0].input.situation_description)
  const [incidentName, setIncidentName] = React.useState(PRESET_SCENARIOS[0].input.incident_name)
  const [incidentType, setIncidentType] = React.useState<UserSituationInput['incident_type']>(
    PRESET_SCENARIOS[0].input.incident_type,
  )
  const [incidentDate, setIncidentDate] = React.useState(PRESET_SCENARIOS[0].input.incident_date)
  const [claimedAmount, setClaimedAmount] = React.useState<number>(
    PRESET_SCENARIOS[0].input.claimed_amount,
  )
  const [hospitalizationDays, setHospitalizationDays] = React.useState<number>(
    PRESET_SCENARIOS[0].input.hospitalization_days ?? 0,
  )
  const [surgeryCount, setSurgeryCount] = React.useState<number>(
    PRESET_SCENARIOS[0].input.surgery_count ?? 0,
  )
  const [specialFlags, setSpecialFlags] = React.useState<string[]>(
    PRESET_SCENARIOS[0].input.special_circumstances ?? [],
  )

  // 3단계: 시뮬레이션 결과 리포트
  const [report, setReport] = React.useState<MultiPolicySimulationReport | null>(null)

  // 약관 JSON 모달
  const [inspectingPolicyDoc, setInspectingPolicyDoc] = React.useState<InsurancePolicyDocument | null>(
    null,
  )

  // 청구 조건 A vs B 비교 모달 상태
  const [compareModalOpen, setCompareModalOpen] = React.useState(false)
  const [comparePairId, setComparePairId] = React.useState('compare_manual_vs_mri')

  const handleOpenCompare = (pairId = 'compare_manual_vs_mri') => {
    setComparePairId(pairId)
    setCompareModalOpen(true)
  }

  const handleApplyScenarioFromComparator = (input: UserSituationInput) => {
    setSelectedPresetId(null)
    setSituationText(input.situation_description)
    setIncidentName(input.incident_name)
    setIncidentType(input.incident_type)
    setIncidentDate(input.incident_date)
    setClaimedAmount(input.claimed_amount)
    setHospitalizationDays(input.hospitalization_days ?? 0)
    setSurgeryCount(input.surgery_count ?? 0)
    setSpecialFlags(input.special_circumstances ?? [])
    setInputMethod('manual_form')
  }

  // 가입 보험 선택 토글
  const handleTogglePolicy = (contractId: string) => {
    setSelectedContractIds((prev) =>
      prev.includes(contractId) ? prev.filter((id) => id !== contractId) : [...prev, contractId],
    )
  }

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedContractIds.length === userPolicies.length) {
      setSelectedContractIds([])
    } else {
      setSelectedContractIds(userPolicies.map((p) => p.contract_id))
    }
  }

  // 프리셋 적용
  const applyPreset = (preset: PresetScenario) => {
    setSelectedPresetId(preset.id)
    setSituationText(preset.input.situation_description)
    setIncidentName(preset.input.incident_name)
    setIncidentType(preset.input.incident_type)
    setIncidentDate(preset.input.incident_date)
    setClaimedAmount(preset.input.claimed_amount)
    setHospitalizationDays(preset.input.hospitalization_days ?? 0)
    setSurgeryCount(preset.input.surgery_count ?? 0)
    setSpecialFlags(preset.input.special_circumstances ?? [])
    setInputMethod('manual_form')
    toast.success(`'${preset.title}' 대표 프리셋이 적용되었습니다.`)
  }

  // 맞춤형 토글 빌더로부터 데이터 적용 핸들러
  const handleApplyToggleScenario = (
    data: ScenarioBuilderOutput,
    shouldRunImmediately = false,
  ) => {
    setSelectedPresetId(null)
    setSituationText(data.situationText)
    setIncidentName(data.incidentName)
    setIncidentType(data.incidentType)
    setClaimedAmount(data.claimedAmount)
    setHospitalizationDays(data.hospitalizationDays)
    setSurgeryCount(data.surgeryCount)
    setSpecialFlags(data.specialFlags)

    if (shouldRunImmediately) {
      if (selectedContractIds.length === 0) {
        toast.error('시뮬레이션할 가입 보험을 최소 1개 이상 선택해 주세요.')
        setCurrentStep(1)
        return
      }

      const inputData: UserSituationInput = {
        situation_description: data.situationText || data.incidentName,
        incident_name: data.incidentName,
        incident_type: data.incidentType,
        incident_date: incidentDate,
        claimed_amount: data.claimedAmount,
        hospitalization_days: data.hospitalizationDays > 0 ? data.hospitalizationDays : undefined,
        surgery_count: data.surgeryCount > 0 ? data.surgeryCount : undefined,
        special_circumstances: data.specialFlags,
      }

      const targetPolicies = userPolicies.filter((p) => selectedContractIds.includes(p.contract_id))
      const multiReport = runMultiPolicySimulation(targetPolicies, inputData)

      setReport(multiReport)
      setCurrentStep(3)
      toast.success('가입 보험 통합 시뮬레이션이 완료되었습니다!')
    } else {
      setInputMethod('manual_form')
      toast.info('맞춤 생성된 상황이 입력폼에 반영되었습니다. 세부 사항을 확인하거나 수정할 수 있습니다.')
    }
  }

  const handleQuickAddAmount = (addAmount: number) => {
    setClaimedAmount((prev) => Math.max(0, (prev || 0) + addAmount))
  }

  const handleToggleFlag = (flag: string) => {
    setSpecialFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag],
    )
  }

  // 시뮬레이션 실행 핸들러
  const handleRunSimulation = () => {
    if (selectedContractIds.length === 0) {
      toast.error('시뮬레이션할 가입 보험을 최소 1개 이상 선택해 주세요.')
      setCurrentStep(1)
      return
    }

    if (!incidentName.trim()) {
      toast.error('사고 또는 진단명을 입력해 주세요.')
      setCurrentStep(2)
      return
    }

    const inputData: UserSituationInput = {
      situation_description: situationText || incidentName,
      incident_name: incidentName,
      incident_type: incidentType,
      incident_date: incidentDate,
      claimed_amount: claimedAmount,
      hospitalization_days: hospitalizationDays > 0 ? hospitalizationDays : undefined,
      surgery_count: surgeryCount > 0 ? surgeryCount : undefined,
      special_circumstances: specialFlags,
    }

    const targetPolicies = userPolicies.filter((p) => selectedContractIds.includes(p.contract_id))
    const multiReport = runMultiPolicySimulation(targetPolicies, inputData)

    setReport(multiReport)
    setCurrentStep(3)
    toast.success('가입 보험 통합 시뮬레이션이 완료되었습니다!')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 Stepper 단계 표시 바 */}
      <div className="rounded-3xl bg-card border border-border p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 버튼 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={cn(
              'flex items-center gap-2.5 rounded-2xl p-2.5 sm:p-3 text-left transition-all',
              currentStep === 1
                ? 'bg-coral text-white font-black shadow-md shadow-coral/20'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted font-medium',
            )}
          >
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                currentStep === 1 ? 'bg-white text-coral' : 'bg-background text-foreground',
              )}
            >
              1
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">가입 보험 조회</span>
              <span className="text-[10px] opacity-80 hidden sm:inline">
                {selectedContractIds.length}개 보험 선택됨
              </span>
            </div>
          </button>

          {/* Step 2 버튼 */}
          <button
            type="button"
            onClick={() => {
              if (selectedContractIds.length === 0) {
                toast.error('먼저 가입 보험을 선택해 주세요.')
                return
              }
              setCurrentStep(2)
            }}
            className={cn(
              'flex items-center gap-2.5 rounded-2xl p-2.5 sm:p-3 text-left transition-all',
              currentStep === 2
                ? 'bg-coral text-white font-black shadow-md shadow-coral/20'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted font-medium',
            )}
          >
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                currentStep === 2 ? 'bg-white text-coral' : 'bg-background text-foreground',
              )}
            >
              2
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">상황 발생 입력</span>
              <span className="text-[10px] opacity-80 hidden sm:inline">진단명/치료비 입력</span>
            </div>
          </button>

          {/* Step 3 버튼 */}
          <button
            type="button"
            onClick={() => {
              if (!report) {
                handleRunSimulation()
              } else {
                setCurrentStep(3)
              }
            }}
            className={cn(
              'flex items-center gap-2.5 rounded-2xl p-2.5 sm:p-3 text-left transition-all',
              currentStep === 3
                ? 'bg-coral text-white font-black shadow-md shadow-coral/20'
                : 'bg-muted/40 text-muted-foreground hover:bg-muted font-medium',
            )}
          >
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                currentStep === 3 ? 'bg-white text-coral' : 'bg-background text-foreground',
              )}
            >
              3
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">통합 보장 결과</span>
              <span className="text-[10px] opacity-80 hidden sm:inline">보험별 분리/합산</span>
            </div>
          </button>
        </div>
      </div>

      {/* 스텝별 본문 콘텐츠 */}
      {currentStep === 1 && (
        <div className="flex flex-col gap-6">
          <MyPoliciesSection
            policies={userPolicies}
            selectedContractIds={selectedContractIds}
            onTogglePolicy={handleTogglePolicy}
            onSelectAll={handleSelectAll}
            onViewJson={(doc) => setInspectingPolicyDoc(doc)}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              size="lg"
              disabled={selectedContractIds.length === 0}
              onClick={() => setCurrentStep(2)}
              className="rounded-full bg-coral hover:bg-coral/90 text-white font-bold text-sm px-6 h-12 shadow-lg shadow-coral/20"
            >
              <span>상황 입력 단계로 이동 ({selectedContractIds.length}개 보험 선택)</span>
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* 1. 빠른 시나리오 프리셋 (카테고리 필터 탑재) */}
          <div className="flex flex-col gap-3 rounded-3xl bg-secondary/40 p-5 border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Zap className="size-3.5 text-coral" />
                원클릭 대표 상황 시뮬레이션 프리셋 (총 {PRESET_SCENARIOS.length}개)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenCompare('compare_manual_vs_mri')}
                  className="h-7 text-xs rounded-full border-coral/40 text-coral bg-coral/10 hover:bg-coral/20 font-bold gap-1 px-3 shadow-xs"
                >
                  <Scale className="size-3 text-coral" />
                  <span>⚖️ 청구 조건 A vs B 비교</span>
                </Button>
              </div>
            </div>

            {/* 프리셋 카테고리 탭 */}
            <div className="flex flex-wrap gap-1 pt-1 border-t border-border/60">
              {PRESET_CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPresetCategory(tab.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all',
                    presetCategory === tab.id
                      ? 'bg-navy text-white shadow-xs'
                      : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'flex flex-col gap-1 rounded-2xl p-3 text-left transition-all border text-xs',
                    selectedPresetId === preset.id
                      ? 'border-coral bg-coral/10 ring-1 ring-coral shadow-sm'
                      : 'border-border bg-card hover:bg-muted/60',
                  )}
                >
                  <span className="font-bold text-foreground line-clamp-1">{preset.title}</span>
                  <span className="text-[11px] text-muted-foreground line-clamp-1">
                    {preset.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. 입력 방식 전환 탭 (토글 빌더 vs 직접 입력) */}
          <div className="flex items-center justify-between gap-2 p-1.5 bg-secondary/50 rounded-2xl border border-border">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setInputMethod('toggle_builder')}
                className={cn(
                  'flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all',
                  inputMethod === 'toggle_builder'
                    ? 'bg-card text-coral shadow-sm border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                <Sparkles className="size-3.5 text-coral" />
                <span>🪄 맞춤형 토글 빌더 (추천)</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMethod('manual_form')}
                className={cn(
                  'flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all',
                  inputMethod === 'manual_form'
                    ? 'bg-card text-foreground shadow-sm border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                <FileCode2 className="size-3.5 text-navy" />
                <span>✍️ 직접 입력 및 세부 조정</span>
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground hidden md:inline mr-2">
              {inputMethod === 'toggle_builder'
                ? '토글 선택 시 상황 설명과 파라미터가 자동 완성됩니다'
                : '진단명 및 치료비를 직접 수정할 수 있습니다'}
            </span>
          </div>

          {/* 3-A. 토글 기반 맞춤형 상황 생성기 */}
          {inputMethod === 'toggle_builder' && (
            <div className="flex flex-col gap-4">
              <ScenarioToggleBuilder
                onApply={handleApplyToggleScenario}
                onOpenCompare={handleOpenCompare}
              />
              <div className="flex items-center justify-start pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-full text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="mr-1.5 size-3.5" />
                  이전 (가입 보험 선택 단계로)
                </Button>
              </div>
            </div>
          )}

          {/* 3-B. 직접 입력 및 세부 조정 폼 */}
          {inputMethod === 'manual_form' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileCode2 className="size-3.5 text-navy" />
                  상황 직접 입력 및 세부 조정 폼
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputMethod('toggle_builder')}
                  className="h-7 text-xs text-coral hover:text-coral hover:bg-coral/10 rounded-lg px-2"
                >
                  <Sparkles className="mr-1 size-3" />
                  토글 빌더로 돌아가기
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="situation-desc" className="text-xs font-bold text-foreground">
                  발생 상황 상세 설명 (자연어)
                </Label>
                <textarea
                  id="situation-desc"
                  rows={2}
                  value={situationText}
                  onChange={(e) => setSituationText(e.target.value)}
                  placeholder="예: 건강검진에서 위암으로 진단받고, 상급병원에서 복강경 절제 수술 1회 및 4일간 입원했습니다."
                  className="w-full rounded-2xl border border-input bg-background p-3 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inc-name" className="text-xs font-bold text-foreground">
                  사고 / 진단명 *
                </Label>
                <Input
                  id="inc-name"
                  value={incidentName}
                  onChange={(e) => setIncidentName(e.target.value)}
                  placeholder="예: 위암, 도수치료, 휴대폰 도난"
                  className="rounded-2xl bg-background text-xs h-10"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inc-type" className="text-xs font-bold text-foreground">
                  치료 / 사고 유형
                </Label>
                <Select
                  value={incidentType}
                  onValueChange={(val) =>
                    setIncidentType(val as UserSituationInput['incident_type'])
                  }
                >
                  <SelectTrigger id="inc-type" className="rounded-2xl bg-background text-xs h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diagnosis">질병 진단</SelectItem>
                    <SelectItem value="hospitalization">입원 치료</SelectItem>
                    <SelectItem value="surgery">수술 치료</SelectItem>
                    <SelectItem value="outpatient">통원 / 외래 (도수치료 등)</SelectItem>
                    <SelectItem value="loss">휴대품 손해 / 도난</SelectItem>
                    <SelectItem value="other">기타 사고</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="inc-date" className="text-xs font-bold text-foreground">
                  사고 / 진단 발생일자
                </Label>
                <Input
                  id="inc-date"
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="rounded-2xl bg-background text-xs h-10"
                />
              </div>

              {/* 발생 비용 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="claim-amt" className="text-xs font-bold text-foreground">
                    발생 치료비/손해액 (원)
                  </Label>
                  <span className="text-xs font-black text-coral">
                    {claimedAmount ? `${claimedAmount.toLocaleString('ko-KR')}원` : '0원'}
                  </span>
                </div>
                <Input
                  id="claim-amt"
                  type="number"
                  value={claimedAmount || ''}
                  onChange={(e) => setClaimedAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="rounded-2xl bg-background font-mono text-xs h-10"
                />
              </div>
            </div>

            {/* 간편 금액 추가 버튼 */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-secondary/30 p-3">
              <span className="text-[11px] text-muted-foreground mr-1">금액 간편 조절:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAddAmount(100_000)}
                className="h-7 text-xs rounded-lg px-2"
              >
                +10만
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAddAmount(500_000)}
                className="h-7 text-xs rounded-lg px-2"
              >
                +50만
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAddAmount(1_000_000)}
                className="h-7 text-xs rounded-lg px-2"
              >
                +100만
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAddAmount(5_000_000)}
                className="h-7 text-xs rounded-lg px-2"
              >
                +500만
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setClaimedAmount(0)}
                className="h-7 text-xs rounded-lg px-2 text-muted-foreground"
              >
                초기화
              </Button>
            </div>

            {/* 입원/수술 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hosp-days" className="text-xs font-bold text-foreground">
                  입원 일수 (해당시)
                </Label>
                <Input
                  id="hosp-days"
                  type="number"
                  min={0}
                  value={hospitalizationDays}
                  onChange={(e) => setHospitalizationDays(Number(e.target.value) || 0)}
                  placeholder="0일"
                  className="rounded-2xl bg-background text-xs h-10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="surg-cnt" className="text-xs font-bold text-foreground">
                  수술 횟수 (해당시)
                </Label>
                <Input
                  id="surg-cnt"
                  type="number"
                  min={0}
                  value={surgeryCount}
                  onChange={(e) => setSurgeryCount(Number(e.target.value) || 0)}
                  placeholder="0회"
                  className="rounded-2xl bg-background text-xs h-10"
                />
              </div>
            </div>

            {/* 특수 플래그 */}
            <div className="flex flex-col gap-2 rounded-2xl bg-secondary/30 p-3">
              <span className="text-[11px] font-semibold text-muted-foreground">
                특수 상황 선택 (면책 및 특약 검증):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: '도난', label: '도난 (Police Report 있음)' },
                  { key: '단순분실', label: '단순 분실(유실)' },
                  { key: '도수치료', label: '도수치료/체외충격파' },
                  { key: '미용목적', label: '미용/성형 목적' },
                  { key: '고의', label: '고의 사고' },
                ].map((item) => {
                  const active = specialFlags.includes(item.key)
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleToggleFlag(item.key)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                        active
                          ? 'bg-navy text-white border-navy'
                          : 'bg-background text-foreground/80 border-border hover:bg-muted',
                      )}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setCurrentStep(1)}
              className="rounded-full text-sm px-6 h-12"
            >
              <ArrowLeft className="mr-2 size-4" />
              이전 (가입 보험 선택)
            </Button>

            <Button
              size="lg"
              onClick={handleRunSimulation}
              className="rounded-full bg-coral hover:bg-coral/90 text-white font-bold text-sm px-8 h-12 shadow-xl shadow-coral/25"
            >
              <Sparkles className="mr-2 size-4" />
              선택한 {selectedContractIds.length}개 보험 통합 시뮬레이션 실행
            </Button>
          </div>
        </div>
      )}
    </div>
  )}

      {currentStep === 3 && report && (
        <MultiPolicyReportCard
          report={report}
          onReset={() => setCurrentStep(2)}
          onViewJson={(doc) => setInspectingPolicyDoc(doc)}
          allPolicyDocs={SAMPLE_POLICIES}
          onOpenCompare={handleOpenCompare}
        />
      )}

      {/* 약관 JSON 모달 */}
      {inspectingPolicyDoc && (
        <PolicyJsonModal
          open={Boolean(inspectingPolicyDoc)}
          onOpenChange={(open) => {
            if (!open) setInspectingPolicyDoc(null)
          }}
          policy={inspectingPolicyDoc}
        />
      )}

      {/* 청구 조건 A vs B 비교 모달 */}
      <ClaimConditionComparator
        open={compareModalOpen}
        onOpenChange={setCompareModalOpen}
        userPolicies={userPolicies}
        selectedContractIds={selectedContractIds}
        onApplyScenarioToWorkspace={handleApplyScenarioFromComparator}
        initialPairId={comparePairId}
      />
    </div>
  )
}
