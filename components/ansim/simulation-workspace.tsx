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
  Archive,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { useUserPolicies } from '@/lib/hooks/use-user-policies'
import { PolicyChangeSyncDialog } from './policy-change-sync-dialog'
import { getDefaultPoliciesForUser } from '@/lib/data/user-policies'
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
import {
  SavedSimulationComparator,
  type SavedSimulationItem,
  getSavedSimulationsStorageKey,
  isSameSimulationCondition,
  generateSimulationTitle,
} from './saved-simulation-comparator'
import { cn } from '@/lib/utils'

interface SimulationWorkspaceProps {
  isModal?: boolean
}

export const JUDGE_VERIFICATION_PRESETS = [
  {
    id: 'judge_cancer_53m',
    badge: '검증 1 · 정액 중복 보장',
    title: '🎗️ 위암 3기 로봇수술 (5,300만원 수령 검증)',
    targetPayout: '53,000,000원',
    summary: '일반암 진단비 5,000만원 + 질병수술비 300만원 정액 중복 지급',
    ruleProof: '면책기간(90일) 및 감액기간(1년) 경과 후 100% 정상 지급 룰 증명',
    accentColor: 'coral',
    input: {
      situation_description:
        '건강검진 중 위암 3기 확진 후 상급종합병원에서 로봇수술 1회 및 4일간 입원 치료를 받음 (암 진단비 5,000만원 + 질병수술비 300만원 정액 중복 보장)',
      incident_name: '위암 (3기) 진단 및 로봇수술',
      incident_type: 'surgery' as const,
      incident_date: '2026-03-15',
      claimed_amount: 12_500_000,
      hospitalization_days: 0,
      surgery_count: 1,
      special_circumstances: [] as string[],
    },
  },
  {
    id: 'judge_therapy_30pct',
    badge: '검증 2 · 3대 비급여 30% 공제',
    title: '💆 도수치료 5회 + MRI (30% 공제 검증)',
    targetPayout: '1,090,000원',
    summary: '발생 치료비 145만원 중 3대 비급여 30% 공제 적용 -> 109만원 수령 (본인부담 36만원 증명)',
    ruleProof: '3대 비급여 특약(도수치료) 자기부담금 30% 공제 및 급여/비급여 외래 공제 룰 증명',
    accentColor: 'mint',
    input: {
      situation_description:
        '요추 추간판 탈출증으로 통원하며 비급여 MRI 검사(70만원) 및 도수치료 5회(75만원) 처방 치료 (3대 비급여 30% 공제 적용)',
      incident_name: '요추 추간판 탈출증 (MRI + 도수치료)',
      incident_type: 'outpatient' as const,
      incident_date: '2026-03-20',
      claimed_amount: 1_450_000,
      hospitalization_days: 0,
      surgery_count: 0,
      special_circumstances: ['도수치료'],
    },
  },
  {
    id: 'judge_travel_1m',
    badge: '검증 3 · 총한도/서류 요건',
    title: '✈️ 해외여행 휴대폰 도난 (100만원 한도 검증)',
    targetPayout: '1,000,000원',
    summary: '손해액 150만원 발생 시 Police Report 증빙으로 총 한도 100만원 전액 수령',
    ruleProof: '경찰 도난신고서(Police Report) 필수 조건 충족 및 최대 한도 100만원 전액 지급 증명',
    accentColor: 'navy',
    input: {
      situation_description:
        '해외여행 중 관광지에서 스마트폰 및 카메라 가방 도난 (현지 경찰서 도난신고서 Police Report 발급, 최대 한도 100만원 검증)',
      incident_name: '해외여행 중 휴대품 도난 (스마트폰)',
      incident_type: 'loss' as const,
      incident_date: '2026-07-10',
      claimed_amount: 1_500_000,
      hospitalization_days: 0,
      surgery_count: 0,
      special_circumstances: ['도난'],
    },
  },
]

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

const INCIDENT_TYPE_ITEMS: { value: UserSituationInput['incident_type']; label: string }[] = [
  { value: 'diagnosis', label: '질병 진단' },
  { value: 'hospitalization', label: '입원 치료' },
  { value: 'surgery', label: '수술 치료' },
  { value: 'outpatient', label: '통원 / 외래 (도수치료 등)' },
  { value: 'loss', label: '휴대품 손해 / 도난' },
  { value: 'other', label: '기타 사고' },
]

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  diagnosis: '질병 진단',
  hospitalization: '입원 치료',
  surgery: '수술 치료',
  outpatient: '통원 / 외래 (도수치료 등)',
  loss: '휴대품 손해 / 도난',
  other: '기타 사고',
}

export function SimulationWorkspace({ isModal = false }: SimulationWorkspaceProps) {
  // 스텝 관리: 1: 가입보험 조회, 2: 상황입력, 3: 결과리포트
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1)

  // 프리셋 카테고리 필터
  const [presetCategory, setPresetCategory] = React.useState<string>('all')

  const filteredPresets = React.useMemo(() => {
    if (presetCategory === 'all') return PRESET_SCENARIOS
    return PRESET_SCENARIOS.filter((p) => p.category === presetCategory)
  }, [presetCategory])

  // 1단계: 사용자 가입 보험 목록 (마이데이터 실시간 연동 훅)
  const {
    policies: userPolicies,
    lastSyncTime,
    isSyncing,
    updatePolicies,
    resetToDefault,
    syncWithMyData,
  } = useUserPolicies()
  const [isSyncModalOpen, setIsSyncModalOpen] = React.useState(false)

  const [selectedContractIds, setSelectedContractIds] = React.useState<string[]>([])

  React.useEffect(() => {
    if (userPolicies.length > 0) {
      setSelectedContractIds((prev) => {
        if (prev.length === 0) {
          return userPolicies.map((p) => p.contract_id)
        }
        const valid = prev.filter((id) => userPolicies.some((p) => p.contract_id === id))
        return valid.length > 0 ? valid : userPolicies.map((p) => p.contract_id)
      })
    }
  }, [userPolicies])

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

  // 저장된 시뮬레이션 다중 비교 모달 상태
  const [savedCompareOpen, setSavedCompareOpen] = React.useState(false)

  const handleOpenSavedCompare = () => {
    setSavedCompareOpen(true)
  }

  const { user } = useAuth()

  // 시뮬레이션 보관함 저장 헬퍼 (해당 로그인 사용자 계정 전용)
  const saveSimulationToStorage = React.useCallback(
    (
      rep: MultiPolicySimulationReport,
      input: UserSituationInput,
      contractIds: string[],
      showToast = false,
    ) => {
      try {
        const storageKey = getSavedSimulationsStorageKey(user?.id)
        let list: SavedSimulationItem[] = []
        const seenIds = new Set<string>()

        const stored = localStorage.getItem(storageKey)
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as SavedSimulationItem[]
            if (Array.isArray(parsed)) {
              parsed.forEach((item) => {
                if (item && item.id && !seenIds.has(item.id)) {
                  seenIds.add(item.id)
                  list.push(item)
                }
              })
            }
          } catch {}
        }

        const title = generateSimulationTitle(input, rep)
        const newItem: SavedSimulationItem = {
          id: `saved_${Date.now()}`,
          title,
          savedAt: new Date().toLocaleDateString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          input,
          report: rep,
          selectedContractIds: contractIds,
        }
        // 완전히 동일한 조건/결과인 경우에만 중복 갱신하고, 조건을 수정한 새 시뮬레이션은 이전 결과를 보존한 채 추가
        const filtered = list.filter(
          (item) => !isSameSimulationCondition(item, input, rep, contractIds),
        )
        const updated = [newItem, ...filtered].slice(0, 30)
        localStorage.setItem(storageKey, JSON.stringify(updated))
        if (showToast) {
          toast.success(`'${title}' 시뮬레이션이 보관함에 저장되었습니다!`)
        }
      } catch {
        if (showToast) {
          toast.success('시뮬레이션이 저장되었습니다.')
        }
      }
    },
    [user?.id],
  )

  // 현재 시뮬레이션 직접 저장 함수
  const handleSaveCurrentSimulation = () => {
    if (!report) {
      toast.error('먼저 시뮬레이션을 실행해 주세요.')
      return
    }

    const currentInput: UserSituationInput = {
      situation_description: situationText || incidentName,
      incident_name: incidentName,
      incident_type: incidentType,
      incident_date: incidentDate,
      claimed_amount: claimedAmount,
      hospitalization_days: hospitalizationDays > 0 ? hospitalizationDays : undefined,
      surgery_count: surgeryCount > 0 ? surgeryCount : undefined,
      special_circumstances: specialFlags,
    }

    saveSimulationToStorage(report, currentInput, selectedContractIds, true)
  }

  const handleApplyScenarioFromComparator = (input: UserSituationInput, contractIds?: string[]) => {
    setSelectedPresetId(null)
    setSituationText(input.situation_description)
    setIncidentName(input.incident_name)
    setIncidentType(input.incident_type)
    setIncidentDate(input.incident_date)
    setClaimedAmount(input.claimed_amount)
    setHospitalizationDays(input.hospitalization_days ?? 0)
    setSurgeryCount(input.surgery_count ?? 0)
    setSpecialFlags(input.special_circumstances ?? [])
    if (contractIds && contractIds.length > 0) {
      setSelectedContractIds(contractIds)
    }
    setInputMethod('manual_form')
    setCurrentStep(2)
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

  // 🎯 심사위원 원클릭 3대 대표 검증 시나리오 1초 즉시 실행
  const handleRunJudgeVerification = (preset: (typeof JUDGE_VERIFICATION_PRESETS)[number]) => {
    setSelectedPresetId(null)
    setSituationText(preset.input.situation_description)
    setIncidentName(preset.input.incident_name)
    setIncidentType(preset.input.incident_type)
    setIncidentDate(preset.input.incident_date)
    setClaimedAmount(preset.input.claimed_amount)
    setHospitalizationDays(preset.input.hospitalization_days ?? 0)
    setSurgeryCount(preset.input.surgery_count ?? 0)
    setSpecialFlags(preset.input.special_circumstances ?? [])

    const targetPolicies: UserEnrolledPolicy[] =
      userPolicies.length > 0 ? userPolicies : getDefaultPoliciesForUser(user)
    const contractIds = targetPolicies.map((p) => p.contract_id)
    setSelectedContractIds(contractIds)

    const multiReport = runMultiPolicySimulation(targetPolicies, preset.input)
    setReport(multiReport)
    setCurrentStep(3)
    saveSimulationToStorage(multiReport, preset.input, contractIds, false)

    toast.success(
      `🎯 [${preset.badge}] 1초 즉시 검증 완료! (총 ${(multiReport.total_estimated_payout / 10000).toLocaleString('ko-KR')}만원 산출)`,
      {
        description: preset.ruleProof,
      },
    )
  }

  // 🎯 심사위원 검증 시나리오 폼에 적용
  const handleApplyJudgeVerification = (preset: (typeof JUDGE_VERIFICATION_PRESETS)[number]) => {
    setSelectedPresetId(null)
    setSituationText(preset.input.situation_description)
    setIncidentName(preset.input.incident_name)
    setIncidentType(preset.input.incident_type)
    setIncidentDate(preset.input.incident_date)
    setClaimedAmount(preset.input.claimed_amount)
    setHospitalizationDays(preset.input.hospitalization_days ?? 0)
    setSurgeryCount(preset.input.surgery_count ?? 0)
    setSpecialFlags(preset.input.special_circumstances ?? [])
    setInputMethod('manual_form')
    toast.info(`'${preset.title}' 상황이 입력 폼에 주입되었습니다. 세부 사항을 확인하거나 수정할 수 있습니다.`)
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
      saveSimulationToStorage(multiReport, inputData, selectedContractIds, false)
      toast.success('가입 보험 통합 시뮬레이션이 완료되었습니다! (보관함에 저장됨)')
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
    saveSimulationToStorage(multiReport, inputData, selectedContractIds, false)
    toast.success('가입 보험 통합 시뮬레이션이 완료되었습니다! (보관함에 저장됨)')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 Stepper 단계 표시 바 */}
      <div className="rounded-3xl bg-card border border-border p-4 shadow-sm flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <span className="text-xs font-bold text-navy flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-coral" />
            금융 AI 맞춤형 보험 보장 시뮬레이션
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenSavedCompare}
            className="h-8 text-xs rounded-full border-coral/40 text-coral bg-coral/5 hover:bg-coral/15 font-bold gap-1.5 px-3.5 shadow-xs"
          >
            <Archive className="size-3.5 text-coral" />
            <span>시뮬레이션 보관함</span>
          </Button>
        </div>

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
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
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
          {/* 🎯 0. 심사위원 전용 3대 대표 검증 세트 (1초 즉시 주입) */}
          <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-coral/10 via-secondary/60 to-mint/10 p-5 sm:p-6 border-2 border-coral/30 shadow-md shadow-coral/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-coral text-white shadow-xs">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-navy">
                      🎯 심사위원 전용 3대 대표 검증 세트
                    </h3>
                    <Badge className="bg-coral text-white text-[10px] font-black border-0 px-2 py-0.5 animate-pulse">
                      1초 즉시 계산
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    심사위원 평가 신속성을 위한 3대 핵심 룰(정액 중복보장 / 30% 공제 / 한도 및 서류요건) 원클릭 검증 시나리오
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenSavedCompare}
                  className="h-8 text-xs rounded-full border-coral/40 text-coral bg-white hover:bg-coral/10 font-bold gap-1 px-3 shadow-xs"
                >
                  <Archive className="size-3.5 text-coral" />
                  <span>📁 시뮬레이션 보관함</span>
                </Button>
              </div>
            </div>

            {/* 3대 대표 검증 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {JUDGE_VERIFICATION_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="flex flex-col justify-between gap-3 p-4 rounded-2xl bg-white border border-border/80 shadow-sm hover:shadow-md hover:border-coral/60 transition-all duration-200"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold text-coral border-coral/40 bg-coral/5 px-2 py-0.5"
                      >
                        {preset.badge}
                      </Badge>
                      <span className="text-xs font-black text-coral font-mono">
                        {preset.targetPayout}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-foreground line-clamp-1">
                      {preset.title}
                    </h4>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {preset.summary}
                    </p>

                    <div className="text-[10px] font-semibold text-mint-foreground bg-mint/10 p-2 rounded-xl flex items-start gap-1 leading-tight">
                      <span className="font-bold shrink-0">✓</span>
                      <span>{preset.ruleProof}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1.5 border-t border-border/50">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleRunJudgeVerification(preset)}
                      className="flex-1 rounded-xl bg-coral hover:bg-coral/90 text-white font-bold text-xs h-9 shadow-sm shadow-coral/20 gap-1"
                    >
                      <Zap className="size-3.5 fill-white" />
                      <span>⚡ 1초 즉시 검증</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyJudgeVerification(preset)}
                      className="rounded-xl text-xs font-bold h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      title="상황 입력 폼에 파라미터 채우기"
                    >
                      폼 적용
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 1. 빠른 시나리오 프리셋 (카테고리 필터 탑재) */}
          <div className="flex flex-col gap-3 rounded-3xl bg-secondary/40 p-5 border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Zap className="size-3.5 text-coral" />
                일반 대표 상황 시뮬레이션 프리셋 (총 {PRESET_SCENARIOS.length}개)
              </span>
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
                onOpenCompare={handleOpenSavedCompare}
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
                  items={INCIDENT_TYPE_ITEMS}
                  value={incidentType}
                  onValueChange={(val) =>
                    setIncidentType(val as UserSituationInput['incident_type'])
                  }
                >
                  <SelectTrigger id="inc-type" className="rounded-2xl bg-background text-xs h-10">
                    <SelectValue>
                      {(val: UserSituationInput['incident_type'] | null) =>
                        val ? INCIDENT_TYPE_LABELS[val] || val : '치료 / 사고 유형 선택'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPE_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
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
          onOpenCompare={handleOpenSavedCompare}
          onSaveSimulation={handleSaveCurrentSimulation}
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

      {/* 저장된 시뮬레이션 다중 비교 모달 */}
      <SavedSimulationComparator
        open={savedCompareOpen}
        onOpenChange={setSavedCompareOpen}
        userPolicies={userPolicies}
        selectedContractIds={selectedContractIds}
        currentReport={report}
        currentInput={
          report
            ? {
                situation_description: situationText || incidentName,
                incident_name: incidentName,
                incident_type: incidentType,
                incident_date: incidentDate,
                claimed_amount: claimedAmount,
                hospitalization_days: hospitalizationDays > 0 ? hospitalizationDays : undefined,
                surgery_count: surgeryCount > 0 ? surgeryCount : undefined,
                special_circumstances: specialFlags,
              }
            : null
        }
        onApplyScenarioToWorkspace={handleApplyScenarioFromComparator}
      />

      {/* 마이데이터 보험 변동 동기화 및 관리 모달 */}
      <PolicyChangeSyncDialog
        open={isSyncModalOpen}
        onOpenChange={setIsSyncModalOpen}
        currentPolicies={userPolicies}
        onSavePolicies={updatePolicies}
        onResetToDefault={resetToDefault}
        onSyncMyData={syncWithMyData}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
      />
    </div>
  )
}
