'use client'

import * as React from 'react'
import {
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Activity,
  Hospital,
  Scissors,
  Check,
  Coins,
  FileText,
  Scale,
  Archive,
  ChevronRight,
  RotateCcw,
  Plus,
  Minus,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { UserSituationInput } from '@/types/policy'

export type DiagnosisStatus = 'PRE_DIAGNOSIS' | 'POST_DIAGNOSIS'

export type DiseaseCategory =
  | 'all'
  | 'cancer'
  | 'cardio_cerebro'
  | 'surgery_disease'
  | 'outpatient_special'
  | 'injury'
  | 'travel'

export interface ScenarioBuilderOutput {
  situationText: string
  incidentName: string
  incidentType: UserSituationInput['incident_type']
  claimedAmount: number
  hospitalizationDays: number
  surgeryCount: number
  specialFlags: string[]
}

interface ScenarioToggleBuilderProps {
  onApply: (output: ScenarioBuilderOutput, shouldRunImmediately?: boolean) => void
  initialStatus?: DiagnosisStatus
  onOpenCompare?: (pairId?: string) => void
}

// 1. 질환/상황 프리셋 옵션 정의
interface DiseaseOption {
  id: string
  name: string
  category: 'cancer' | 'cardio_cerebro' | 'surgery_disease' | 'outpatient_special' | 'injury' | 'travel'
  defaultIncidentType: UserSituationInput['incident_type']
  defaultDays: number
  defaultSurgery: number
  defaultAmount: number
  suggestedFlags?: string[]
  description: string
  keywords: string[]
}

const DISEASE_OPTIONS: Record<DiagnosisStatus, DiseaseOption[]> = {
  PRE_DIAGNOSIS: [
    {
      id: 'pre_cancer',
      name: '위암 / 대장암 (일반암)',
      category: 'cancer',
      defaultIncidentType: 'diagnosis',
      defaultDays: 4,
      defaultSurgery: 1,
      defaultAmount: 8_500_000,
      description: '암 진단비(5,000만), 절제 수술비, 입원일당 보장 가상 점검',
      keywords: ['위암', '악성신생물', '수술', '입원'],
    },
    {
      id: 'pre_thyroid_cancer',
      name: '갑상선암 / 제자리암 (유사암)',
      category: 'cancer',
      defaultIncidentType: 'diagnosis',
      defaultDays: 2,
      defaultSurgery: 1,
      defaultAmount: 3_200_000,
      description: '유사암/소액암 진단비(1,000만) 및 수술비 보장 점검',
      keywords: ['갑상선암', '유사암', '수술'],
    },
    {
      id: 'pre_brain',
      name: '뇌혈관질환 / 급성 뇌경색',
      category: 'cardio_cerebro',
      defaultIncidentType: 'diagnosis',
      defaultDays: 7,
      defaultSurgery: 1,
      defaultAmount: 12_000_000,
      description: '뇌경색 진단비(3,000만) 및 뇌혈관 수술비 보장 점검',
      keywords: ['뇌경색', '뇌혈관질환', '입원', '수술'],
    },
    {
      id: 'pre_heart',
      name: '급성 심근경색 / 협심증',
      category: 'cardio_cerebro',
      defaultIncidentType: 'diagnosis',
      defaultDays: 4,
      defaultSurgery: 1,
      defaultAmount: 11_000_000,
      description: '허혈성 심장질환 진단비 및 스텐트 삽입술 보장 점검',
      keywords: ['심근경색', '스텐트', '수술', '입원'],
    },
    {
      id: 'pre_spine_surgery',
      name: '디스크 / 척추 관절 수술',
      category: 'surgery_disease',
      defaultIncidentType: 'surgery',
      defaultDays: 3,
      defaultSurgery: 1,
      defaultAmount: 4_500_000,
      description: '다빈도 질병 수술비(관혈 300만) 및 단기 입원일당 점검',
      keywords: ['디스크', '척추질환', '수술', '입원'],
    },
    {
      id: 'pre_colon_polyp',
      name: '대장내시경 용종 절제술',
      category: 'surgery_disease',
      defaultIncidentType: 'surgery',
      defaultDays: 0,
      defaultSurgery: 1,
      defaultAmount: 450_000,
      description: '당일 외래 시술 시 비관혈 질병수술비(30만) 점검',
      keywords: ['용종', '대장내시경', '시술'],
    },
    {
      id: 'pre_manual',
      name: '허리·어깨 도수치료 (비급여)',
      category: 'outpatient_special',
      defaultIncidentType: 'outpatient',
      defaultDays: 0,
      defaultSurgery: 0,
      defaultAmount: 750_000,
      suggestedFlags: ['도수치료'],
      description: '실손보험 3대 비급여 특약의 자기부담금(30%) 및 한도 점검',
      keywords: ['도수치료', '체외충격파', '통원치료'],
    },
    {
      id: 'pre_mri',
      name: '비급여 MRI / CT 정밀검사',
      category: 'outpatient_special',
      defaultIncidentType: 'outpatient',
      defaultDays: 0,
      defaultSurgery: 0,
      defaultAmount: 700_000,
      description: '실손 비급여 MRI 검사비 70% 환급 여부 점검',
      keywords: ['MRI', '정밀검사', '통원'],
    },
    {
      id: 'pre_fracture',
      name: '일상 상해 / 발목 골절 사고',
      category: 'injury',
      defaultIncidentType: 'surgery',
      defaultDays: 3,
      defaultSurgery: 1,
      defaultAmount: 3_500_000,
      description: '일상생활 중 낙상 골절 시 진단비 및 핀 고정 수술 점검',
      keywords: ['골절', '상해', '수술', '입원'],
    },
    {
      id: 'pre_travel_loss',
      name: '해외여행 휴대품 도난 (소매치기)',
      category: 'travel',
      defaultIncidentType: 'loss',
      defaultDays: 0,
      defaultSurgery: 0,
      defaultAmount: 1_300_000,
      suggestedFlags: ['도난'],
      description: '해외여행 중 소매치기 도난 시 1개당 한도/자기부담금 점검',
      keywords: ['도난', '휴대품', '손해'],
    },
    {
      id: 'pre_travel_illness',
      name: '해외여행 중 급성 장염 응급실 입원',
      category: 'travel',
      defaultIncidentType: 'hospitalization',
      defaultDays: 1,
      defaultSurgery: 0,
      defaultAmount: 1_850_000,
      description: '해외 질병 의료비 실손 전액 보장 여부 점검',
      keywords: ['해외질병', '응급실', '입원'],
    },
    {
      id: 'pre_cosmetic',
      name: '피부과 미용 레이저 시술 (면책)',
      category: 'outpatient_special',
      defaultIncidentType: 'outpatient',
      defaultDays: 0,
      defaultSurgery: 0,
      defaultAmount: 600_000,
      suggestedFlags: ['미용목적'],
      description: '치료 목적 외 미용성형 면책 조항(0원) 검증',
      keywords: ['미용목적', '피부시술'],
    },
  ],
  POST_DIAGNOSIS: [
    {
      id: 'post_cancer',
      name: '위암 (조기 악성신생물 C16)',
      category: 'cancer',
      defaultIncidentType: 'diagnosis',
      defaultDays: 4,
      defaultSurgery: 1,
      defaultAmount: 8_500_000,
      description: '건강검진 후 위암 확진 및 상급종합병원 수술/입원',
      keywords: ['위암', '악성신생물', '수술', '입원'],
    },
    {
      id: 'post_thyroid_cancer',
      name: '갑상선암 (C73 유사암 진단)',
      category: 'cancer',
      defaultIncidentType: 'diagnosis',
      defaultDays: 2,
      defaultSurgery: 1,
      defaultAmount: 3_200_000,
      description: '갑상선 초음파 및 세침흡인검사 후 절제 수술',
      keywords: ['갑상선암', '유사암', '수술'],
    },
    {
      id: 'post_brain',
      name: '급성 뇌경색 (I63)',
      category: 'cardio_cerebro',
      defaultIncidentType: 'diagnosis',
      defaultDays: 5,
      defaultSurgery: 1,
      defaultAmount: 9_200_000,
      description: '뇌경색 응급실 내원 후 혈전용해술 및 입원 치료',
      keywords: ['뇌경색', '뇌혈관', '수술', '입원'],
    },
    {
      id: 'post_heart',
      name: '급성 심근경색증 (I21)',
      category: 'cardio_cerebro',
      defaultIncidentType: 'surgery',
      defaultDays: 4,
      defaultSurgery: 1,
      defaultAmount: 11_000_000,
      description: '관상동맥 중재술(스텐트 삽입 1회) 및 집중 치료',
      keywords: ['심근경색', '스텐트', '수술', '입원'],
    },
    {
      id: 'post_colon_polyp',
      name: '대장 용종 2개 내시경 절제술',
      category: 'surgery_disease',
      defaultIncidentType: 'surgery',
      defaultDays: 0,
      defaultSurgery: 1,
      defaultAmount: 450_000,
      description: '선종성 용종 2개 발견 후 당일 EMR 절제',
      keywords: ['용종', '대장내시경', '시술'],
    },
    {
      id: 'post_spine_surgery',
      name: '요추 디스크 수술 (복강경/내시경)',
      category: 'surgery_disease',
      defaultIncidentType: 'surgery',
      defaultDays: 3,
      defaultSurgery: 1,
      defaultAmount: 4_500_000,
      description: '추간판 탈출증으로 신경감압 및 디스크 절제술 시행',
      keywords: ['디스크', '척추질환', '수술'],
    },
    {
      id: 'post_manual_5times',
      name: '디스크 도수치료 (5회 처방)',
      category: 'outpatient_special',
      defaultIncidentType: 'outpatient',
      defaultDays: 0,
      defaultSurgery: 0,
      defaultAmount: 750_000,
      suggestedFlags: ['도수치료'],
      description: '정형외과 의사 처방에 따른 도수치료 및 체외충격파 5회',
      keywords: ['도수치료', '체외충격파', '통원'],
    },
    {
      id: 'post_mri_exam',
      name: '요추 MRI 정밀검사 (비급여)',
      category: 'outpatient_special',
      defaultIncidentType: 'outpatient',
      defaultDays: 0,
      defaultSurgery: 0,
      defaultAmount: 700_000,
      description: '디스크 정밀 진단을 위한 비급여 MRI 검사',
      keywords: ['MRI', '정밀검사', '통원'],
    },
    {
      id: 'post_fracture_surgery',
      name: '발목 골절 및 핀 고정 수술',
      category: 'injury',
      defaultIncidentType: 'surgery',
      defaultDays: 3,
      defaultSurgery: 1,
      defaultAmount: 3_800_000,
      description: '낙상 사고로 인한 골절 확정 및 관혈 핀 고정 수술',
      keywords: ['골절', '상해', '수술', '입원'],
    },
    {
      id: 'post_travel_stolen',
      name: '스마트폰 도난 (Police Report 구비)',
      category: 'travel',
      defaultIncidentType: 'loss',
      defaultDays: 0,
      defaultSurgery: 0,
      defaultAmount: 1_300_000,
      suggestedFlags: ['도난'],
      description: '해외 체류 중 소매치기 피해로 현지 경찰서 도난신고 완료',
      keywords: ['도난', '휴대품', '손해'],
    },
    {
      id: 'post_travel_hospital',
      name: '해외 현지 병원 응급실 입원 치료',
      category: 'travel',
      defaultIncidentType: 'hospitalization',
      defaultDays: 1,
      defaultSurgery: 0,
      defaultAmount: 1_850_000,
      description: '해외 여행 중 급성 장염으로 응급실 및 1일 입원',
      keywords: ['해외질병', '응급실', '입원'],
    },
    {
      id: 'post_cosmetic_laser',
      name: '피부 레이저 시술 (미용 목적)',
      category: 'outpatient_special',
      defaultIncidentType: 'outpatient',
      defaultDays: 0,
      defaultSurgery: 0,
      defaultAmount: 600_000,
      suggestedFlags: ['미용목적'],
      description: '단순 피부 결 개선 및 미용 목적 레이저 시술',
      keywords: ['미용목적', '피부시술', '통원'],
    },
  ],
}

const HOSPITAL_TIERS = [
  { id: 'clinic', name: '동네 의원/일반병원', desc: '1차 의원 (공제 1만원)' },
  { id: 'general', name: '2차 종합병원', desc: '2차 종합의료기관' },
  { id: 'tertiary', name: '3차 상급종합병원 (대학병원)', desc: '3차 상급병원 (공제 2만원)' },
]

const ADMISSION_OPTIONS = [
  { id: 'outpatient', name: '외래 / 통원만 (0일)', days: 0 },
  { id: 'short', name: '단기 입원 (2일)', days: 2 },
  { id: 'medium', name: '중기 입원 (4일)', days: 4 },
  { id: 'week', name: '1주일 입원 (7일)', days: 7 },
  { id: 'long', name: '장기 입원 (14일)', days: 14 },
]

const SURGERY_OPTIONS = [
  { id: 'none', name: '수술 없음 (약물/주사/물리치료)', count: 0 },
  { id: 'minor', name: '당일 시술 (내시경 용종/비관혈 1회)', count: 1, label: '비관혈 시술 1회' },
  { id: 'standard', name: '일반 관혈 수술 (복강경/절제 등 1회)', count: 1, label: '관혈 수술 1회' },
  { id: 'multiple', name: '2회 이상 반복 수술', count: 2, label: '수술 2회' },
]

const EXTRA_TREATMENTS = [
  { id: 'mri_ct', name: 'MRI / CT 정밀검사', text: 'MRI 정밀검사' },
  { id: 'manual', name: '도수치료 / 체외충격파', text: '도수치료', flag: '도수치료' },
  { id: 'chemo', name: '항암 방사선 / 약물치료', text: '항암 치료' },
  { id: 'stolen_report', name: '경찰서 도난신고서(Police Report)', text: '경찰서 도난신고서 구비', flag: '도난' },
  { id: 'lost_only', name: '단순 분실(유실)', text: '단순 분실', flag: '단순분실' },
  { id: 'cosmetic', name: '미용/성형 목적', text: '미용 목적', flag: '미용목적' },
]

const COST_PRESETS = [
  { id: 'cost_50', label: '50만원', amount: 500_000 },
  { id: 'cost_150', label: '150만원', amount: 1_500_000 },
  { id: 'cost_500', label: '500만원', amount: 5_000_000 },
  { id: 'cost_850', label: '850만원', amount: 8_500_000 },
  { id: 'cost_1500', label: '1,500만원', amount: 15_000_000 },
]

export function ScenarioToggleBuilder({
  onApply,
  initialStatus = 'PRE_DIAGNOSIS',
  onOpenCompare,
}: ScenarioToggleBuilderProps) {
  const [status, setStatus] = React.useState<DiagnosisStatus>(initialStatus)
  const [selectedCategory, setSelectedCategory] = React.useState<DiseaseCategory>('all')
  const [selectedDiseaseId, setSelectedDiseaseId] = React.useState<string>(
    DISEASE_OPTIONS[initialStatus][0].id,
  )

  // 상세 치료 계획 및 환경설정 (선택 사항: 미선택 시 null)
  const [hospitalTier, setHospitalTier] = React.useState<string | null>(null)
  const [admissionTier, setAdmissionTier] = React.useState<string | null>(null)
  const [customDays, setCustomDays] = React.useState<number | null>(null)
  const [surgeryTier, setSurgeryTier] = React.useState<string | null>(null)
  const [customSurgeryCount, setCustomSurgeryCount] = React.useState<number | null>(null)
  const [costAmount, setCostAmount] = React.useState<number | null>(null)
  const [selectedCostId, setSelectedCostId] = React.useState<string | null>(null)
  const [extraSelected, setExtraSelected] = React.useState<string[]>([])

  // 카테고리 필터링된 질환 목록
  const filteredDiseases = React.useMemo(() => {
    const list = DISEASE_OPTIONS[status]
    if (selectedCategory === 'all') return list
    return list.filter((d) => d.category === selectedCategory)
  }, [status, selectedCategory])

  // 질환 변경 시 동작
  const handleSelectDisease = (disease: DiseaseOption) => {
    setSelectedDiseaseId(disease.id)

    if (status === 'POST_DIAGNOSIS') {
      setCostAmount(disease.defaultAmount)
      const matchedPreset = COST_PRESETS.find((p) => p.amount === disease.defaultAmount)
      setSelectedCostId(matchedPreset?.id ?? null)

      setCustomDays(disease.defaultDays)
      if (disease.defaultDays === 0) setAdmissionTier('outpatient')
      else if (disease.defaultDays <= 2) setAdmissionTier('short')
      else if (disease.defaultDays <= 4) setAdmissionTier('medium')
      else if (disease.defaultDays <= 7) setAdmissionTier('week')
      else setAdmissionTier('long')

      setCustomSurgeryCount(disease.defaultSurgery)
      if (disease.defaultSurgery === 0) setSurgeryTier('none')
      else if (disease.defaultSurgery === 1) setSurgeryTier('standard')
      else setSurgeryTier('multiple')

      if (disease.suggestedFlags && disease.suggestedFlags.length > 0) {
        const matchExtras = EXTRA_TREATMENTS.filter(
          (e) => e.flag && disease.suggestedFlags?.includes(e.flag),
        ).map((e) => e.id)
        setExtraSelected(matchExtras)
      } else {
        setExtraSelected([])
      }
    }
  }

  // 상태(진단 전 vs 진단 후) 변경 시
  const handleStatusChange = (newStatus: DiagnosisStatus) => {
    setStatus(newStatus)
    const firstOption = DISEASE_OPTIONS[newStatus][0]

    if (newStatus === 'PRE_DIAGNOSIS') {
      setSelectedDiseaseId(firstOption.id)
      setHospitalTier(null)
      setAdmissionTier(null)
      setCustomDays(null)
      setSurgeryTier(null)
      setCustomSurgeryCount(null)
      setCostAmount(null)
      setSelectedCostId(null)
      setExtraSelected([])
    } else {
      handleSelectDisease(firstOption)
    }
  }

  const handleToggleHospital = (id: string) => {
    setHospitalTier((prev) => (prev === id ? null : id))
  }

  const handleToggleAdmission = (id: string, days: number) => {
    if (admissionTier === id) {
      setAdmissionTier(null)
      setCustomDays(null)
    } else {
      setAdmissionTier(id)
      setCustomDays(days)
    }
  }

  const handleToggleSurgery = (id: string, count: number) => {
    if (surgeryTier === id) {
      setSurgeryTier(null)
      setCustomSurgeryCount(null)
    } else {
      setSurgeryTier(id)
      setCustomSurgeryCount(count)
    }
  }

  const handleToggleCost = (id: string, amount: number) => {
    if (selectedCostId === id) {
      setSelectedCostId(null)
      setCostAmount(null)
    } else {
      setSelectedCostId(id)
      setCostAmount(amount)
    }
  }

  const toggleExtra = (id: string) => {
    setExtraSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleResetDetailSettings = () => {
    setHospitalTier(null)
    setAdmissionTier(null)
    setCustomDays(null)
    setSurgeryTier(null)
    setCustomSurgeryCount(null)
    setCostAmount(null)
    setSelectedCostId(null)
    setExtraSelected([])
  }

  const hasAnyDetailSelected =
    hospitalTier !== null ||
    admissionTier !== null ||
    surgeryTier !== null ||
    costAmount !== null ||
    extraSelected.length > 0

  // 현재 선택된 질환 객체
  const currentDisease = React.useMemo(() => {
    return (
      DISEASE_OPTIONS[status].find((d) => d.id === selectedDiseaseId) ||
      DISEASE_OPTIONS[status][0]
    )
  }, [status, selectedDiseaseId])

  // 플래그 목록 수집
  const activeSpecialFlags = React.useMemo(() => {
    const flags: string[] = []
    extraSelected.forEach((eId) => {
      const item = EXTRA_TREATMENTS.find((e) => e.id === eId)
      if (item?.flag) flags.push(item.flag)
    })
    return flags
  }, [extraSelected])

  // 🪄 실시간 자연어 조합 엔진
  const generatedResult = React.useMemo<ScenarioBuilderOutput>(() => {
    const extras = extraSelected
      .map((id) => EXTRA_TREATMENTS.find((e) => e.id === id)?.text)
      .filter(Boolean)
      .join(', ')

    let situation = ''
    const incidentNameStr = currentDisease.name

    if (status === 'PRE_DIAGNOSIS') {
      const clauses: string[] = []

      if (hospitalTier) {
        const hospitalName = HOSPITAL_TIERS.find((h) => h.id === hospitalTier)?.name
        clauses.push(`${hospitalName}에서`)
      }

      clauses.push(`[${currentDisease.name}] 진단을 받게 되는 상황을 가정하여,`)

      if (admissionTier !== null && customDays !== null) {
        if (customDays === 0) {
          clauses.push(`입원 없이 외래 통원 치료를 받고`)
        } else {
          clauses.push(`${customDays}일간 입원 치료를 받고`)
        }
      }

      if (surgeryTier !== null && customSurgeryCount !== null) {
        if (customSurgeryCount > 0) {
          clauses.push(`${customSurgeryCount}회의 수술/시술을 시행하며`)
        } else {
          clauses.push(`수술 없이 보존적 치료를 진행하며`)
        }
      }

      if (extras) {
        clauses.push(`추가로 [${extras}] 치료/검사를 진행하고`)
      }

      situation = `만약 제가 ${clauses.join(' ')} 현재 가입된 보험에서 진단비, 수술비, 입원일당, 실손의료비로 총 얼마를 보장받을 수 있는지 시뮬레이션해주세요.`
    } else {
      const clauses: string[] = []

      if (hospitalTier) {
        const hospitalName = HOSPITAL_TIERS.find((h) => h.id === hospitalTier)?.name
        clauses.push(`${hospitalName}에서`)
      }

      clauses.push(`[${currentDisease.name}] 관련으로 진료를 받았습니다.`)

      if (admissionTier !== null && customDays !== null) {
        if (customDays === 0) {
          clauses.push(`외래 통원 진료를 진행하였으며,`)
        } else {
          clauses.push(`${customDays}일간 병동 입원 치료를 받았으며,`)
        }
      }

      if (surgeryTier !== null && customSurgeryCount !== null) {
        if (customSurgeryCount > 0) {
          clauses.push(`${customSurgeryCount}회의 수술 치료를 받았습니다.`)
        } else {
          clauses.push(`수술은 진행하지 않았습니다.`)
        }
      }

      if (extras) {
        clauses.push(`치료 과정 중 [${extras}] 항목이 포함되었으며,`)
      }

      clauses.push(`가입된 보험을 통해 청구 가능한 예상 보험금과 필요 제출 서류를 안내해주세요.`)

      situation = `최근 ${clauses.join(' ')}`
    }

    let inferredType: UserSituationInput['incident_type'] = currentDisease.defaultIncidentType
    if (currentDisease.category === 'travel') {
      inferredType = 'loss'
    } else if (customSurgeryCount !== null && customSurgeryCount > 0) {
      inferredType = 'surgery'
    } else if (customDays !== null && customDays > 0) {
      inferredType = 'hospitalization'
    } else if (currentDisease.category === 'cancer' || currentDisease.category === 'cardio_cerebro') {
      inferredType = 'diagnosis'
    } else {
      inferredType = currentDisease.defaultIncidentType
    }

    return {
      situationText: situation,
      incidentName: incidentNameStr,
      incidentType: inferredType,
      claimedAmount: costAmount ?? currentDisease.defaultAmount,
      hospitalizationDays: customDays ?? (status === 'POST_DIAGNOSIS' ? currentDisease.defaultDays : 0),
      surgeryCount: customSurgeryCount ?? (status === 'POST_DIAGNOSIS' ? currentDisease.defaultSurgery : 0),
      specialFlags: activeSpecialFlags,
    }
  }, [
    status,
    currentDisease,
    hospitalTier,
    admissionTier,
    customDays,
    surgeryTier,
    customSurgeryCount,
    extraSelected,
    costAmount,
    activeSpecialFlags,
  ])

  const categoryTabItems: { id: DiseaseCategory; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'cancer', label: '🎗️ 3대 암' },
    { id: 'cardio_cerebro', label: '🫀 뇌·심장질환' },
    { id: 'surgery_disease', label: '🏥 수술·질병' },
    { id: 'outpatient_special', label: '💆 비급여·도수·MRI' },
    { id: 'injury', label: '🦴 상해·골절' },
    { id: 'travel', label: '✈️ 해외여행' },
  ]

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm">
      {/* 타이틀 및 안내 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-coral/15 text-coral">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              맞춤형 상황 토글 빌더 (총 {DISEASE_OPTIONS[status].length}개 질환·상황 시나리오)
              <Badge variant="secondary" className="text-[10px] bg-coral/10 text-coral border-coral/20 font-bold">
                자유 선택 모드
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              원하는 질환과 치료 조건을 클릭하면 자연어 질문과 심사 파라미터가 자동으로 조합됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 1단계: 현재 상태 토글 (진단 전 vs 진단 후) */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <span className="flex size-4 items-center justify-center rounded-full bg-coral text-[10px] font-black text-white">
            1
          </span>
          현재 시뮬레이션 목적 (현재 상태) <span className="text-coral">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleStatusChange('PRE_DIAGNOSIS')}
            className={cn(
              'flex flex-col gap-1.5 rounded-2xl p-4 text-left transition-all border-2',
              status === 'PRE_DIAGNOSIS'
                ? 'border-coral bg-coral/5 ring-1 ring-coral shadow-sm'
                : 'border-border bg-background hover:bg-muted/60 text-muted-foreground',
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-black flex items-center gap-1.5', status === 'PRE_DIAGNOSIS' ? 'text-coral' : 'text-foreground')}>
                <ShieldCheck className="size-4" />
                🛡️ 진단 전 (가상 대비 시뮬레이션)
              </span>
              {status === 'PRE_DIAGNOSIS' && <Check className="size-4 text-coral" />}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              "혹시 내가 큰 병에 걸리거나 다치면 얼마가 나올까?" 미래의 위험을 가상으로 점검합니다.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('POST_DIAGNOSIS')}
            className={cn(
              'flex flex-col gap-1.5 rounded-2xl p-4 text-left transition-all border-2',
              status === 'POST_DIAGNOSIS'
                ? 'border-navy bg-navy/5 ring-1 ring-navy shadow-sm'
                : 'border-border bg-background hover:bg-muted/60 text-muted-foreground',
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-black flex items-center gap-1.5', status === 'POST_DIAGNOSIS' ? 'text-navy' : 'text-foreground')}>
                <Stethoscope className="size-4" />
                🏥 진단 후 (청구 전 실전 시뮬레이션)
              </span>
              {status === 'POST_DIAGNOSIS' && <Check className="size-4 text-navy" />}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              "실제 진단을 받았거나 치료 중인데, 청구 시 얼마를 받을 수 있을까?" 실전 예상액을 확인합니다.
            </p>
          </button>
        </div>
      </div>

      {/* 시뮬레이션 결과 보관함 배너 */}
      {onOpenCompare && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-coral/10 via-navy/5 to-secondary border border-coral/30 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-coral text-white shrink-0 shadow-sm">
              <Archive className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-foreground">
                  📁 시뮬레이션 결과 보관함
                </span>
                <Badge variant="secondary" className="text-[10px] bg-coral/15 text-coral border-coral/30 font-bold">
                  저장 내역
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                이전에 시뮬레이션하여 저장해둔 치료·사고 결과를 언제든지 다시 확인하고 워크스페이스로 불러올 수 있습니다.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenCompare()}
            className="rounded-xl bg-coral hover:bg-coral/90 text-white font-bold text-xs shrink-0 h-9 px-4 shadow-sm"
          >
            <span>시뮬레이션 보관함 열기</span>
            <ChevronRight className="ml-1 size-3.5" />
          </Button>
        </div>
      )}

      {/* 2단계: 질환 및 사고 상황 선택 (카테고리 필터 탭 적용) */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-full bg-coral text-[10px] font-black text-white">
              2
            </span>
            {status === 'PRE_DIAGNOSIS' ? '가상으로 대비할 질환 / 상황 선택' : '실제 진단받은 질환 / 사고 상황 선택'}{' '}
            <span className="text-coral">*</span>
          </label>

          {/* 카테고리 필터 탭 바 */}
          <div className="flex flex-wrap gap-1">
            {categoryTabItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
                  selectedCategory === tab.id
                    ? 'bg-navy text-white shadow-xs'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 질환 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredDiseases.map((disease) => {
            const isSelected = selectedDiseaseId === disease.id
            return (
              <button
                key={disease.id}
                type="button"
                onClick={() => handleSelectDisease(disease)}
                className={cn(
                  'flex flex-col justify-between p-3 rounded-2xl text-left transition-all border text-xs min-h-[76px]',
                  isSelected
                    ? 'border-coral bg-coral/10 font-bold text-foreground ring-1 ring-coral shadow-xs -translate-y-0.5'
                    : 'border-border bg-background hover:bg-muted/60 text-muted-foreground hover:border-border/80',
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={cn('font-bold line-clamp-1 text-xs', isSelected ? 'text-coral' : 'text-foreground')}>
                    {disease.name}
                  </span>
                  {isSelected && <Check className="size-3.5 text-coral shrink-0" />}
                </div>
                <span className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                  {disease.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3단계: 치료 계획 및 세부 조건 설정 (자유로운 토글 및 원클릭 조정) */}
      <div className="flex flex-col gap-3.5 rounded-2xl bg-secondary/30 p-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span className="flex size-4 items-center justify-center rounded-full bg-navy text-[10px] font-black text-white">
                3
              </span>
              치료 계획 및 세부 조건 자유 설정
            </span>
            <Badge variant="outline" className="text-[10px] text-muted-foreground font-normal border-border bg-background/50">
              다시 누르면 선택 해제
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {hasAnyDetailSelected && (
              <button
                type="button"
                onClick={handleResetDetailSettings}
                className="text-[11px] text-muted-foreground hover:text-coral transition-colors flex items-center gap-1 font-bold"
              >
                <RotateCcw className="size-3" />
                선택 초기화
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 3-1. 병원 구분 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Hospital className="size-3 text-coral" /> 의료기관 구분
              </span>
              <span className="text-[10px] text-navy font-bold">
                {hospitalTier ? HOSPITAL_TIERS.find((h) => h.id === hospitalTier)?.name : '미선택'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {HOSPITAL_TIERS.map((h) => {
                const isSelected = hospitalTier === h.id
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleToggleHospital(h.id)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl text-left text-xs transition-all border flex items-center justify-between',
                      isSelected
                        ? 'border-navy bg-navy text-white font-bold shadow-xs'
                        : 'border-border bg-background hover:bg-muted text-foreground/80',
                    )}
                  >
                    <span className="block leading-tight text-xs">{h.name}</span>
                    {isSelected && <Check className="size-3 text-white shrink-0 ml-1" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3-2. 입원 일수 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Activity className="size-3 text-coral" /> 입원 / 진료 형태
              </span>
              <span className="text-[10px] text-navy font-bold">
                {customDays !== null ? (customDays === 0 ? '통원 진료' : `${customDays}일 입원`) : '미선택'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {ADMISSION_OPTIONS.map((adm) => {
                const isSelected = admissionTier === adm.id
                return (
                  <button
                    key={adm.id}
                    type="button"
                    onClick={() => handleToggleAdmission(adm.id, adm.days)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl text-left text-xs transition-all border flex items-center justify-between',
                      isSelected
                        ? 'border-navy bg-navy text-white font-bold shadow-xs'
                        : 'border-border bg-background hover:bg-muted text-foreground/80',
                    )}
                  >
                    <span className="block leading-tight text-xs">{adm.name}</span>
                    {isSelected && <Check className="size-3 text-white shrink-0 ml-1" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3-3. 수술 계획 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Scissors className="size-3 text-coral" /> 수술 / 시술 계획
              </span>
              <span className="text-[10px] text-navy font-bold">
                {surgeryTier ? SURGERY_OPTIONS.find((s) => s.id === surgeryTier)?.name : '미선택'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {SURGERY_OPTIONS.map((surg) => {
                const isSelected = surgeryTier === surg.id
                return (
                  <button
                    key={surg.id}
                    type="button"
                    onClick={() => handleToggleSurgery(surg.id, surg.count)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl text-left text-xs transition-all border flex items-center justify-between',
                      isSelected
                        ? 'border-navy bg-navy text-white font-bold shadow-xs'
                        : 'border-border bg-background hover:bg-muted text-foreground/80',
                    )}
                  >
                    <span className="block leading-tight text-xs">{surg.name}</span>
                    {isSelected && <Check className="size-3 text-white shrink-0 ml-1" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 3-4. 특수 검사 및 추가 치료 플래그 (토글 칩) */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-border/60">
          <span className="text-[11px] font-bold text-muted-foreground">
            정밀 검사 및 특수 조건 (다중 선택 가능 - 다시 누르면 해제)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EXTRA_TREATMENTS.map((extra) => {
              const active = extraSelected.includes(extra.id)
              return (
                <button
                  key={extra.id}
                  type="button"
                  onClick={() => toggleExtra(extra.id)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all border',
                    active
                      ? 'bg-coral text-white border-coral font-bold shadow-xs'
                      : 'bg-background text-foreground/80 border-border hover:bg-muted',
                  )}
                >
                  {active ? `✓ ${extra.name}` : `+ ${extra.name}`}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3-5. 예상 발생 비용 간편 선택 */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
              <Coins className="size-3 text-coral" /> 예상 본인부담 치료비 / 손해액
            </span>
            <span className={cn('text-xs font-black', costAmount !== null ? 'text-coral' : 'text-muted-foreground')}>
              {costAmount !== null ? `${costAmount.toLocaleString('ko-KR')}원` : '기본 추천값 적용'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {COST_PRESETS.map((preset) => {
              const isSelected = selectedCostId === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleToggleCost(preset.id, preset.amount)}
                  className={cn(
                    'py-1.5 px-2 rounded-xl text-center text-xs font-medium transition-all border',
                    isSelected
                      ? 'border-coral bg-coral/10 text-coral font-bold ring-1 ring-coral shadow-xs'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground',
                  )}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 🪄 4단계: 실시간 자동 완성 자연어 프리뷰 */}
      <div className="flex flex-col gap-2 rounded-2xl bg-secondary/60 p-4 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-coral flex items-center gap-1.5">
            <Sparkles className="size-3.5 animate-spin-slow text-coral" />
            실시간 자동 완성된 시뮬레이션 질문 문장
          </span>
          <span className="text-[10px] text-muted-foreground">토글 선택에 따라 즉시 갱신</span>
        </div>
        <div className="rounded-xl bg-background p-3 border border-border shadow-inner">
          <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
            "{generatedResult.situationText}"
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted-foreground pt-1">
          <span>
            진단명: <strong className="text-foreground">{generatedResult.incidentName}</strong>
          </span>
          <span>•</span>
          <span>
            병원: <strong className="text-foreground">{hospitalTier ? HOSPITAL_TIERS.find((h) => h.id === hospitalTier)?.name : '미선택'}</strong>
          </span>
          <span>•</span>
          <span>
            입원: <strong className="text-foreground">{customDays !== null ? (customDays === 0 ? '외래/통원' : `${customDays}일`) : '미선택'}</strong>
          </span>
          <span>•</span>
          <span>
            수술: <strong className="text-foreground">{customSurgeryCount !== null ? (customSurgeryCount === 0 ? '수술 없음' : `${customSurgeryCount}회`) : '미선택'}</strong>
          </span>
        </div>
      </div>

      {/* 액션 버튼 영역 */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
        <Button
          type="button"
          onClick={() => onApply(generatedResult, false)}
          variant="outline"
          className="w-full sm:w-auto flex-1 h-11 rounded-2xl text-xs font-bold"
        >
          <FileText className="mr-1.5 size-3.5" />
          상세 입력폼으로 이동하여 편집
        </Button>
        <Button
          type="button"
          onClick={() => onApply(generatedResult, true)}
          className="w-full sm:w-auto flex-1 h-11 rounded-2xl bg-coral hover:bg-coral/90 text-white text-xs font-bold shadow-lg shadow-coral/20"
        >
          <Sparkles className="mr-1.5 size-3.5" />
          이 조건으로 즉시 시뮬레이션 실행하기 →
        </Button>
      </div>
    </div>
  )
}
