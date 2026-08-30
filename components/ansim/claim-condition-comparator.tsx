'use client'

import * as React from 'react'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Copy,
  Coins,
  ShieldCheck,
  Stethoscope,
  Activity,
  Layers,
  FileCheck2,
  ChevronRight,
  Maximize2,
  Scale,
  Clock,
  Building2,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { runMultiPolicySimulation } from '@/lib/policy-engine'
import type {
  MultiPolicySimulationReport,
  UserEnrolledPolicy,
  UserSituationInput,
} from '@/types/policy'
import { toast } from 'sonner'

export type ComparisonCategory =
  | 'all'
  | 'treatment_scope'
  | 'time_rule'
  | 'surgery_admission'
  | 'exclusion_check'

export interface ComparisonPair {
  id: string
  category: 'treatment_scope' | 'exclusion_check' | 'surgery_admission' | 'time_rule'
  badge: string
  tagColor: 'coral' | 'navy' | 'mint' | 'yellow'
  title: string
  description: string
  diffTag: string
  scenarioA: {
    title: string
    subtitle: string
    input: UserSituationInput
  }
  scenarioB: {
    title: string
    subtitle: string
    input: UserSituationInput
  }
  keyDifferenceSummary: string
}

// 🎯 청구 조건 비교 8대 대표 프리셋 데이터
export const CLAIM_COMPARISON_PRESETS: ComparisonPair[] = [
  {
    id: 'compare_manual_vs_mri',
    category: 'treatment_scope',
    badge: '비급여 검사·치료 범위',
    tagColor: 'coral',
    title: '비급여 도수치료만 청구 VS MRI 정밀검사 포함 청구',
    description: '허리 디스크 치료 시 도수치료 단독 청구와 비급여 MRI 정밀검사가 추가되었을 때의 본인부담금 및 실수령액 차이를 비교합니다.',
    diffTag: '+약 49만원 차이',
    scenarioA: {
      title: 'A. 비급여 도수치료만 청구',
      subtitle: '정형외과 통원 도수치료 5회 (비급여 75만원)',
      input: {
        situation_description: '허리 디스크(요추 추간판 탈출증)로 동네 정형외과에서 통원하며 의사 처방에 따라 도수치료 5회를 받고 총 750,000원의 비급여 치료비가 발생했습니다.',
        incident_name: '요추 추간판 탈출증 (도수치료 5회)',
        incident_type: 'outpatient',
        incident_date: '2026-03-15',
        claimed_amount: 750_000,
        hospitalization_days: 0,
        surgery_count: 0,
        special_circumstances: ['도수치료'],
      },
    },
    scenarioB: {
      title: 'B. MRI 정밀검사 + 도수치료 동시 청구',
      subtitle: '비급여 MRI(70만원) + 도수치료 5회(75만원) 총 145만원',
      input: {
        situation_description: '허리 디스크 정밀 진단을 위해 비급여 요추 MRI 검사(700,000원)와 의사 처방에 따른 도수치료 5회(750,000원)를 병행하여 총 1,450,000원이 발생했습니다.',
        incident_name: '요추 추간판 탈출증 (MRI 정밀검사 + 도수치료)',
        incident_type: 'outpatient',
        incident_date: '2026-03-15',
        claimed_amount: 1_450_000,
        hospitalization_days: 0,
        surgery_count: 0,
        special_circumstances: ['도수치료'],
      },
    },
    keyDifferenceSummary: 'MRI 정밀검사는 비급여 70% 실손 보장(자기부담 30% 공제)이 적용되며, 도수치료는 1회당 3만원과 30% 중 큰 금액이 공제되어 총 예상 수령액이 약 49만원 증가합니다.',
  },
  {
    id: 'compare_waiting_period_cancer',
    category: 'time_rule',
    badge: '면책기간(90일) 전후',
    tagColor: 'yellow',
    title: '가입 50일 차 폐암 진단 VS 가입 150일 차 폐암 진단',
    description: '암보장개시일(계약일로부터 90일) 이전 진단 시 0원 면책과 90일 경과 후 정상 진단비 지급 차이를 명확히 검증합니다.',
    diffTag: '0원 vs 5,000만원',
    scenarioA: {
      title: 'A. 가입 50일 차 진단 (90일 미도래)',
      subtitle: '계약일 2025.12.01 -> 진단일 2026.01.20 (경과 50일 / 면책 0원)',
      input: {
        situation_description: '보험 가입 50일 만에 기침 증상으로 흉부 CT 및 조직검사 결과 원발성 폐암으로 최종 진단되었습니다.',
        incident_name: '폐암 (C34) - 가입 50일차',
        incident_type: 'diagnosis',
        contract_date: '2025-12-01',
        incident_date: '2026-01-20',
        claimed_amount: 5_000_000,
        hospitalization_days: 2,
        surgery_count: 0,
        special_circumstances: [],
      },
    },
    scenarioB: {
      title: 'B. 가입 150일 차 진단 (90일 경과)',
      subtitle: '계약일 2025.08.01 -> 진단일 2026.01.01 (경과 153일 / 정상 지급)',
      input: {
        situation_description: '보험 가입 150일 후 흉부 CT 및 조직검사 결과 원발성 폐암으로 최종 진단되어 암진단비를 청구하였습니다.',
        incident_name: '폐암 (C34) - 가입 150일차',
        incident_type: 'diagnosis',
        contract_date: '2025-08-01',
        incident_date: '2026-01-01',
        claimed_amount: 5_000_000,
        hospitalization_days: 2,
        surgery_count: 0,
        special_circumstances: [],
      },
    },
    keyDifferenceSummary: '암 약관의 90일 면책기간(Waiting Period) 조항에 따라 시나리오 A는 0원 지급(면책) 처리되지만, 90일을 초과한 시나리오 B는 암진단비가 100% 정상 지급됩니다.',
  },
  {
    id: 'compare_reduction_period_cancer',
    category: 'time_rule',
    badge: '감액기간(1년) 전후',
    tagColor: 'coral',
    title: '가입 6개월 차 위암 진단(50% 감액) VS 가입 14개월 차 진단(100% 지급)',
    description: '계약일로부터 1년 미만 시 50% 감액 지급 조항과 1년 경과 후 100% 전액 지급의 실수령액 차이를 확인합니다.',
    diffTag: '2,500만 vs 5,000만원',
    scenarioA: {
      title: 'A. 가입 6개월 차 진단 (50% 감액)',
      subtitle: '계약일 2025.08.01 -> 진단일 2026.02.01 (1년 미만 50% 지급)',
      input: {
        situation_description: '보험 가입 6개월 후 건강검진에서 조기 위암으로 확정 진단받고 복강경 수술을 진행하였습니다.',
        incident_name: '위암 (가입 6개월차)',
        incident_type: 'diagnosis',
        contract_date: '2025-08-01',
        incident_date: '2026-02-01',
        claimed_amount: 8_500_000,
        hospitalization_days: 4,
        surgery_count: 1,
        special_circumstances: [],
      },
    },
    scenarioB: {
      title: 'B. 가입 14개월 차 진단 (100% 지급)',
      subtitle: '계약일 2024.12.01 -> 진단일 2026.02.01 (1년 경과 100% 지급)',
      input: {
        situation_description: '보험 가입 1년 2개월(14개월) 후 건강검진에서 조기 위암으로 확정 진단받고 복강경 수술을 진행하였습니다.',
        incident_name: '위암 (가입 14개월차)',
        incident_type: 'diagnosis',
        contract_date: '2024-12-01',
        incident_date: '2026-02-01',
        claimed_amount: 8_500_000,
        hospitalization_days: 4,
        surgery_count: 1,
        special_circumstances: [],
      },
    },
    keyDifferenceSummary: '가입 후 1년 미만 진단 시 암진단비가 50%(2,500만원)로 감액 지급되나, 1년 경과 후에는 감액 없이 100%(5,000만원)가 전액 지급되어 2,500만원의 차이가 발생합니다.',
  },
  {
    id: 'compare_surgery_inpatient_vs_outpatient',
    category: 'surgery_admission',
    badge: '치료 규모별 종합 보장',
    tagColor: 'navy',
    title: '상급병원 4일 입원 + 복강경 수술 VS 외래 통원 보존치료',
    description: '암 진단 후 적극적인 입원 수술 치료 시와 통원 약물 치료 시의 진단비, 수술비, 입원일당 복합 수령액 차이를 비교합니다.',
    diffTag: '+수술비·입원비 복합 수령',
    scenarioA: {
      title: 'A. 상급병원 4일 입원 + 절제 수술',
      subtitle: '암진단비 + 질병수술비(300만) + 4일 입원일당(20만) + 실손',
      input: {
        situation_description: '위암 진단 후 상급종합병원에서 4일간 입원하여 복강경 절제 수술 1회를 받고 총 8,500,000원의 치료비가 발생했습니다.',
        incident_name: '위암 (복강경 절제 수술 및 4일 입원)',
        incident_type: 'surgery',
        incident_date: '2026-02-01',
        claimed_amount: 8_500_000,
        hospitalization_days: 4,
        surgery_count: 1,
        special_circumstances: [],
      },
    },
    scenarioB: {
      title: 'B. 외래 통원 보존 치료',
      subtitle: '수술/입원 없이 통원 진료 (암진단비 + 외래실손)',
      input: {
        situation_description: '위암 진단 후 수술 없이 외래 통원으로 정밀 검사 및 항암 약물 처방을 받고 총 1,200,000원의 치료비가 발생했습니다.',
        incident_name: '위암 (외래 통원 및 약물 치료)',
        incident_type: 'diagnosis',
        incident_date: '2026-02-01',
        claimed_amount: 1_200_000,
        hospitalization_days: 0,
        surgery_count: 0,
        special_circumstances: [],
      },
    },
    keyDifferenceSummary: '암 진단비는 양쪽 모두 정상 지급되지만, 시나리오 A는 질병수술비(300만원)와 4일 입원일당(20만원) 및 입원 실손의료비가 추가 지급되어 총 수령액이 크게 증가합니다.',
  },
  {
    id: 'compare_polyp_vs_open_surgery',
    category: 'surgery_admission',
    badge: '수술 방식(비관혈 VS 관혈)',
    tagColor: 'mint',
    title: '대장내시경 용종 당일 절제 VS 대장 절제 관혈 수술(5일 입원)',
    description: '비관혈(내시경) 점막 절제술 시의 보장액과 개복/복강경 관혈 수술 시의 정액 수술비 및 입원일당 차이를 비교합니다.',
    diffTag: '30만 vs 325만원',
    scenarioA: {
      title: 'A. 대장내시경 용종 당일 절제 (비관혈)',
      subtitle: '건강검진 중 용종 2개 내시경 절제 (비관혈 수술비 30만원)',
      input: {
        situation_description: '대장내시경 중 발견된 선종성 용종 2개를 당일 내시경적 점막절제술(EMR)로 절제 치료받았습니다.',
        incident_name: '대장 용종 내시경 절제술 (비관혈)',
        incident_type: 'surgery',
        incident_date: '2026-03-01',
        claimed_amount: 450_000,
        hospitalization_days: 0,
        surgery_count: 1,
        special_circumstances: [],
      },
    },
    scenarioB: {
      title: 'B. 대장 부분 절제 관혈 수술 + 5일 입원',
      subtitle: '복강경 대장 절제 관혈 수술(300만) + 5일 입원일당(25만)',
      input: {
        situation_description: '대장 종양으로 인해 상급종합병원에서 복강경 대장 부분절제 수술 1회 및 5일간 입원 치료를 받았습니다.',
        incident_name: '대장 부분절제 수술 및 5일 입원',
        incident_type: 'surgery',
        incident_date: '2026-03-01',
        claimed_amount: 6_200_000,
        hospitalization_days: 5,
        surgery_count: 1,
        special_circumstances: [],
      },
    },
    keyDifferenceSummary: '내시경 용종 절제술은 약관상 비관혈 수술비(30만원)가 지급되나, 복강경/개복 수술은 관혈 질병수술비(300만원)와 5일 입원일당(25만원)이 지급됩니다.',
  },
  {
    id: 'compare_stolen_vs_lost',
    category: 'exclusion_check',
    badge: '면책 조항 및 증빙 서류',
    tagColor: 'navy',
    title: '경찰서 도난신고서 구비 VS 단순 분실(유실)',
    description: '해외여행 중 소지품 사고 시 경찰서 Police Report(도난신고서) 유무에 따른 면책(0원) 및 정상 지급 여부를 비교합니다.',
    diffTag: '면책(0원) vs 19만원',
    scenarioA: {
      title: 'A. Police Report 구비 (도난)',
      subtitle: '현지 경찰서 도난신고서 발급 완료 (130만원 손해)',
      input: {
        situation_description: '스페인 바르셀로나 여행 중 지하철에서 스마트폰을 소매치기당해 현지 경찰서에서 정식 Police Report(도난신고서)를 발급받았습니다.',
        incident_name: '스마트폰 소매치기 도난 (도난신고서 구비)',
        incident_type: 'loss',
        incident_date: '2026-07-05',
        claimed_amount: 1_300_000,
        special_circumstances: ['도난'],
      },
    },
    scenarioB: {
      title: 'B. 단순 분실(유실) 청구',
      subtitle: '도난 증빙 없이 잃어버린 경우 (면책 사유)',
      input: {
        situation_description: '스페인 여행 중 스마트폰을 어디에 두었는지 기억나지 않아 단순 분실(유실)하여 경찰서 신고서 없이 청구했습니다.',
        incident_name: '스마트폰 단순 분실 (유실)',
        incident_type: 'loss',
        incident_date: '2026-07-05',
        claimed_amount: 1_300_000,
        special_circumstances: ['단순분실'],
      },
    },
    keyDifferenceSummary: '해외여행자보험 약관상 단순 분실(유실)은 면책 조항에 해당하여 0원 판정되나, 정식 Police Report가 구비된 도난은 물품 1개당 20만원 한도(자기부담 1만원 공제)로 190,000원이 지급됩니다.',
  },
  {
    id: 'compare_clinic_vs_tertiary_hospital',
    category: 'treatment_scope',
    badge: '의료기관 종별 공제액',
    tagColor: 'mint',
    title: '동네 의원 통원 진료 VS 대학병원(상급종합병원) 통원 진료',
    description: '4세대 실손의료보험에서 의료기관 등급(1차 의원 1만원 공제 vs 3차 상급병원 2만원 공제)에 따른 자기부담금 차이를 비교합니다.',
    diffTag: '공제 1만원 vs 2만원',
    scenarioA: {
      title: 'A. 동네 의원 외래 통원',
      subtitle: '1차 의원 진료비 150,000원 (최소 공제 1만원 적용)',
      input: {
        situation_description: '허리 통증으로 동네 정형외과의원에서 X-ray 촬영 및 물리치료를 받고 150,000원이 발생했습니다.',
        incident_name: '허리 통증 1차 의원 통원',
        incident_type: 'outpatient',
        incident_date: '2026-03-10',
        claimed_amount: 150_000,
        hospitalization_days: 0,
        surgery_count: 0,
        special_circumstances: [],
      },
    },
    scenarioB: {
      title: 'B. 상급종합병원(대학병원) 외래 통원',
      subtitle: '3차 대학병원 진료비 150,000원 (최소 공제 2만원 적용)',
      input: {
        situation_description: '허리 통증으로 상급종합병원 척추센터 외래에서 진료 및 검사를 받고 150,000원이 발생했습니다.',
        incident_name: '허리 통증 대학병원 외래 통원',
        incident_type: 'outpatient',
        incident_date: '2026-03-10',
        claimed_amount: 150_000,
        hospitalization_days: 0,
        surgery_count: 0,
        special_circumstances: [],
      },
    },
    keyDifferenceSummary: '4세대 실손의료비는 급여 통원 시 1차 의원은 1만원(또는 20%), 3차 상급종합병원은 2만원(또는 20%)의 자기부담금이 차등 공제됩니다.',
  },
  {
    id: 'compare_medical_vs_cosmetic',
    category: 'exclusion_check',
    badge: '치료 목적 VS 미용 면책',
    tagColor: 'coral',
    title: '상해 골절 핀 고정 수술 VS 단순 피부 미용 레이저 시술',
    description: '치료 목적의 질병/상해 치료는 전액 보장되나, 단순 외모 개선 및 미용 목적 시술은 면책(0원)되는 원칙을 비교합니다.',
    diffTag: '정상 지급 vs 면책(0원)',
    scenarioA: {
      title: 'A. 족관절 골절 핀 고정 수술 (치료 목적)',
      subtitle: '골절 진단비 + 상해 수술비 + 입원실손 정상 지급',
      input: {
        situation_description: '낙상 사고로 발목 골절 진단을 받고 관혈 핀 고정 수술 및 3일간 입원 치료를 받았습니다.',
        incident_name: '족관절 골절 수술 치료',
        incident_type: 'surgery',
        incident_date: '2026-01-10',
        claimed_amount: 3_800_000,
        hospitalization_days: 3,
        surgery_count: 1,
        special_circumstances: [],
      },
    },
    scenarioB: {
      title: 'B. 피부 미용 레이저 시술 (미용 목적)',
      subtitle: '치료 목적 외 단순 피부 개선 (약관상 면책 0원)',
      input: {
        situation_description: '피부과에서 단순 피부 결 개선 및 미용 목적으로 레이저 시술을 받고 600,000원을 결제했습니다.',
        incident_name: '단순 미용 피부 레이저 시술',
        incident_type: 'outpatient',
        incident_date: '2026-02-10',
        claimed_amount: 600_000,
        special_circumstances: ['미용목적'],
      },
    },
    keyDifferenceSummary: '보험 약관은 신체의 기능 회복 및 치료를 목적으로 하는 수술/치료비는 정상 지급하지만, 미용 목적의 성형/피부 시술은 면책 조항에 따라 0원 처리됩니다.',
  },
]

interface ClaimConditionComparatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userPolicies: UserEnrolledPolicy[]
  selectedContractIds: string[]
  onApplyScenarioToWorkspace: (input: UserSituationInput) => void
  initialPairId?: string
}

export function ClaimConditionComparator({
  open,
  onOpenChange,
  userPolicies,
  selectedContractIds,
  onApplyScenarioToWorkspace,
  initialPairId = 'compare_manual_vs_mri',
}: ClaimConditionComparatorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<ComparisonCategory>('all')
  const [selectedPairId, setSelectedPairId] = React.useState<string>(initialPairId)

  // 카테고리 필터링된 프리셋 목록
  const filteredPresets = React.useMemo(() => {
    if (selectedCategory === 'all') return CLAIM_COMPARISON_PRESETS
    return CLAIM_COMPARISON_PRESETS.filter((p) => p.category === selectedCategory)
  }, [selectedCategory])

  // 현재 선택된 비교 페어
  const currentPair = React.useMemo(() => {
    return (
      CLAIM_COMPARISON_PRESETS.find((p) => p.id === selectedPairId) ||
      filteredPresets[0] ||
      CLAIM_COMPARISON_PRESETS[0]
    )
  }, [selectedPairId, filteredPresets])

  // 시뮬레이션 대상 보험 필터링
  const targetPolicies = React.useMemo(() => {
    return userPolicies.filter((p) => selectedContractIds.includes(p.contract_id))
  }, [userPolicies, selectedContractIds])

  // 시나리오 A와 B 각각 다중 보험 시뮬레이션 실행
  const reportA = React.useMemo<MultiPolicySimulationReport>(() => {
    return runMultiPolicySimulation(targetPolicies, currentPair.scenarioA.input)
  }, [targetPolicies, currentPair])

  const reportB = React.useMemo<MultiPolicySimulationReport>(() => {
    return runMultiPolicySimulation(targetPolicies, currentPair.scenarioB.input)
  }, [targetPolicies, currentPair])

  // 금액 차이 계산 (B - A)
  const diffAmount = reportB.total_estimated_payout - reportA.total_estimated_payout
  const diffPercent =
    reportA.total_estimated_payout > 0
      ? Math.round((Math.abs(diffAmount) / reportA.total_estimated_payout) * 100)
      : 0

  // 클립보드 복사
  const handleCopyComparison = async () => {
    const lines = [
      `[ANSIM 청구 조건 비교 분석 리포트]`,
      `주제: ${currentPair.title}`,
      `설명: ${currentPair.description}`,
      ``,
      `[시나리오 A: ${currentPair.scenarioA.title}]`,
      `- 발생 비용: ${currentPair.scenarioA.input.claimed_amount.toLocaleString('ko-KR')}원`,
      `- 총 예상 수령액: ${reportA.total_estimated_payout.toLocaleString('ko-KR')}원`,
      ...reportA.policy_results.map(
        (p) => `  * ${p.policy_name}: ${p.total_payout_for_policy.toLocaleString('ko-KR')}원`,
      ),
      ``,
      `[시나리오 B: ${currentPair.scenarioB.title}]`,
      `- 발생 비용: ${currentPair.scenarioB.input.claimed_amount.toLocaleString('ko-KR')}원`,
      `- 총 예상 수령액: ${reportB.total_estimated_payout.toLocaleString('ko-KR')}원`,
      ...reportB.policy_results.map(
        (p) => `  * ${p.policy_name}: ${p.total_payout_for_policy.toLocaleString('ko-KR')}원`,
      ),
      ``,
      `[핵심 차이 분석]`,
      `- 예상 차액: ${diffAmount >= 0 ? `+${diffAmount.toLocaleString('ko-KR')}원` : `-${Math.abs(diffAmount).toLocaleString('ko-KR')}원`}`,
      `- 분석 소견: ${currentPair.keyDifferenceSummary}`,
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('청구 조건 비교 리포트가 클립보드에 복사되었습니다.')
    } catch {
      toast.error('복사에 실패했습니다.')
    }
  }

  const categoryChips: { id: ComparisonCategory; label: string; count: number }[] = [
    { id: 'all', label: '전체 보기', count: CLAIM_COMPARISON_PRESETS.length },
    {
      id: 'treatment_scope',
      label: '🔍 비급여·검사 범위',
      count: CLAIM_COMPARISON_PRESETS.filter((p) => p.category === 'treatment_scope').length,
    },
    {
      id: 'time_rule',
      label: '⏱️ 면책·감액 기간',
      count: CLAIM_COMPARISON_PRESETS.filter((p) => p.category === 'time_rule').length,
    },
    {
      id: 'surgery_admission',
      label: '🏥 입원·수술 방식',
      count: CLAIM_COMPARISON_PRESETS.filter((p) => p.category === 'surgery_admission').length,
    },
    {
      id: 'exclusion_check',
      label: '🛡️ 면책·서류 검증',
      count: CLAIM_COMPARISON_PRESETS.filter((p) => p.category === 'exclusion_check').length,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-[96vw] lg:max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border shadow-2xl">
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-coral/15 text-coral">
              <Scale className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                  청구 조건별 예상 보험금 A vs B 비교
                </DialogTitle>
                <Badge variant="secondary" className="text-[10px] bg-coral/10 text-coral border-coral/20 font-bold">
                  총 {CLAIM_COMPARISON_PRESETS.length}개 대표 시나리오
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                동일한 가입 보험({targetPolicies.length}개 계약)에서 청구 조건/치료 방식에 따른 수령액 차이를 한눈에 대조합니다.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyComparison}
              className="rounded-full text-xs h-8 gap-1.5"
            >
              <Copy className="size-3.5" />
              <span>비교 리포트 복사</span>
            </Button>
          </div>
        </div>

        {/* 모달 본문 (스크롤) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. 카테고리 필터 탭 바 */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Filter className="size-3.5 text-coral" /> 비교 시나리오 주제 선택:
              </span>
              <span className="text-[11px] text-muted-foreground">
                선택된 주제 ({filteredPresets.length}개 비교 세트)
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categoryChips.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
                    selectedCategory === cat.id
                      ? 'bg-navy text-white shadow-xs'
                      : 'bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <span>{cat.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                      selectedCategory === cat.id
                        ? 'bg-white/20 text-white'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* 비교 시나리오 선택 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {filteredPresets.map((preset) => {
                const isSelected = selectedPairId === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPairId(preset.id)}
                    className={cn(
                      'flex flex-col justify-between p-3.5 rounded-2xl text-left border-2 transition-all group',
                      isSelected
                        ? 'border-coral bg-coral/5 ring-1 ring-coral shadow-sm -translate-y-0.5'
                        : 'border-border bg-card hover:bg-muted/60 text-muted-foreground hover:border-border/80',
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 rounded-md font-bold',
                            isSelected
                              ? 'bg-coral text-white border-coral'
                              : 'bg-secondary text-muted-foreground border-border',
                          )}
                        >
                          {preset.badge}
                        </Badge>
                        {isSelected && <CheckCircle2 className="size-3.5 text-coral shrink-0" />}
                      </div>

                      <span
                        className={cn(
                          'text-xs font-bold mt-1 line-clamp-2 leading-snug',
                          isSelected ? 'text-foreground font-black' : 'text-foreground/90',
                        )}
                      >
                        {preset.title}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-coral">{preset.diffTag}</span>
                      <span className="text-[10px] text-muted-foreground group-hover:text-foreground flex items-center gap-0.5">
                        상세보기 <ChevronRight className="size-3" />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. 핵심 차액 요약 카드 */}
          <div className="rounded-3xl bg-gradient-to-br from-secondary/80 via-secondary/40 to-background border border-border p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-navy flex items-center gap-1.5">
                  <Coins className="size-4 text-coral" />
                  청구 조건에 따른 예상 보장 차액
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-foreground">
                    {diffAmount > 0
                      ? `+${diffAmount.toLocaleString('ko-KR')}원`
                      : diffAmount < 0
                        ? `-${Math.abs(diffAmount).toLocaleString('ko-KR')}원`
                        : '0원 (동일)'}
                  </span>
                  <span className="text-xs font-bold text-coral">
                    {diffAmount !== 0
                      ? `(약 ${diffPercent}% ${diffAmount > 0 ? '추가 수령' : '감소'})`
                      : '보장액 동일'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                  💡 <strong>약관 분석 핵심:</strong> {currentPair.keyDifferenceSummary}
                </p>
              </div>

              {/* 미니 비교 막대 */}
              <div className="flex flex-col gap-2 min-w-[220px] p-3.5 rounded-2xl bg-card border border-border">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">시나리오 A</span>
                  <span className="text-foreground">{reportA.total_estimated_payout.toLocaleString('ko-KR')}원</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-navy h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.max(10, Math.min(100, (reportA.total_estimated_payout / Math.max(reportA.total_estimated_payout, reportB.total_estimated_payout, 1)) * 100))}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-bold mt-1">
                  <span className="text-coral">시나리오 B</span>
                  <span className="text-coral">{reportB.total_estimated_payout.toLocaleString('ko-KR')}원</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-coral h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.max(10, Math.min(100, (reportB.total_estimated_payout / Math.max(reportA.total_estimated_payout, reportB.total_estimated_payout, 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. 좌우 1:1 상세 대조 카드 (Side-by-Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 좌측: 시나리오 A */}
            <div className="flex flex-col gap-4 rounded-3xl border-2 border-border bg-card p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <Badge variant="outline" className="text-[10px] bg-secondary text-foreground font-bold mb-1">
                    시나리오 A
                  </Badge>
                  <h4 className="text-sm font-black text-foreground">
                    {currentPair.scenarioA.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentPair.scenarioA.subtitle}
                  </p>
                </div>
              </div>

              {/* 금액 요약 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30">
                <span className="text-xs text-muted-foreground">발생 치료비</span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {currentPair.scenarioA.input.claimed_amount.toLocaleString('ko-KR')}원
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-navy/10 border border-navy/20">
                <span className="text-xs font-bold text-navy">총 예상 보험금</span>
                <span className="text-lg font-black text-navy font-mono">
                  {reportA.total_estimated_payout.toLocaleString('ko-KR')}원
                </span>
              </div>

              {/* 보험 상품별 세부 산출 내역 */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs font-bold text-muted-foreground">보험 상품별 지급 내역</span>
                <div className="flex flex-col gap-2">
                  {reportA.policy_results.map((policy) => (
                    <div
                      key={policy.contract_id}
                      className="rounded-2xl border border-border p-3 bg-background flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground line-clamp-1">{policy.policy_name}</span>
                        <span className="font-black text-foreground font-mono">
                          {policy.total_payout_for_policy.toLocaleString('ko-KR')}원
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {policy.relevant_judgments.map((j) => (
                          <div
                            key={j.coverage_id}
                            className="flex items-center justify-between text-[11px] text-muted-foreground pl-1 border-l-2 border-coral/40"
                          >
                            <span>{j.coverage_name}</span>
                            <span className="font-medium">
                              {j.status === 'EXCLUDED' ? (
                                <span className="text-red-500 font-bold">면책 (0원)</span>
                              ) : (
                                `${j.estimated_payout.toLocaleString('ko-KR')}원`
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단 적용 버튼 */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onApplyScenarioToWorkspace(currentPair.scenarioA.input)
                  onOpenChange(false)
                  toast.success(`'${currentPair.scenarioA.title}' 조건이 워크스페이스에 적용되었습니다.`)
                }}
                className="w-full mt-auto rounded-2xl h-10 text-xs font-bold border-navy/30 text-navy hover:bg-navy/10"
              >
                이 조건(A)으로 워크스페이스에 적용
              </Button>
            </div>

            {/* 우측: 시나리오 B */}
            <div className="flex flex-col gap-4 rounded-3xl border-2 border-coral/40 bg-card p-5 shadow-xs relative">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <Badge variant="outline" className="text-[10px] bg-coral/10 text-coral font-bold border-coral/30 mb-1">
                    시나리오 B (확장/대조)
                  </Badge>
                  <h4 className="text-sm font-black text-foreground">
                    {currentPair.scenarioB.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentPair.scenarioB.subtitle}
                  </p>
                </div>
              </div>

              {/* 금액 요약 */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30">
                <span className="text-xs text-muted-foreground">발생 치료비</span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {currentPair.scenarioB.input.claimed_amount.toLocaleString('ko-KR')}원
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-coral/10 border border-coral/20">
                <span className="text-xs font-bold text-coral">총 예상 보험금</span>
                <span className="text-lg font-black text-coral font-mono">
                  {reportB.total_estimated_payout.toLocaleString('ko-KR')}원
                </span>
              </div>

              {/* 보험 상품별 세부 산출 내역 */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs font-bold text-muted-foreground">보험 상품별 지급 내역</span>
                <div className="flex flex-col gap-2">
                  {reportB.policy_results.map((policy) => (
                    <div
                      key={policy.contract_id}
                      className="rounded-2xl border border-border p-3 bg-background flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground line-clamp-1">{policy.policy_name}</span>
                        <span className="font-black text-foreground font-mono">
                          {policy.total_payout_for_policy.toLocaleString('ko-KR')}원
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {policy.relevant_judgments.map((j) => (
                          <div
                            key={j.coverage_id}
                            className="flex items-center justify-between text-[11px] text-muted-foreground pl-1 border-l-2 border-coral/40"
                          >
                            <span>{j.coverage_name}</span>
                            <span className="font-medium">
                              {j.status === 'EXCLUDED' ? (
                                <span className="text-red-500 font-bold">면책 (0원)</span>
                              ) : (
                                `${j.estimated_payout.toLocaleString('ko-KR')}원`
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 하단 적용 버튼 */}
              <Button
                type="button"
                onClick={() => {
                  onApplyScenarioToWorkspace(currentPair.scenarioB.input)
                  onOpenChange(false)
                  toast.success(`'${currentPair.scenarioB.title}' 조건이 워크스페이스에 적용되었습니다.`)
                }}
                className="w-full mt-auto rounded-2xl h-10 text-xs font-bold bg-coral hover:bg-coral/90 text-white shadow-md shadow-coral/20"
              >
                이 조건(B)으로 워크스페이스에 적용
              </Button>
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="border-t border-border bg-card px-6 py-3.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            💡 마음에 드는 시나리오의 [적용] 버튼을 누르면 워크스페이스에서 바로 시뮬레이션할 수 있습니다.
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold h-9 px-4"
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
