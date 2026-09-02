/**
 * ANSIM 보험 — 약관 JSON 및 다중 보험 시뮬레이션 데이터 타입 정의
 */

/** 시기 규칙 (면책기간, 감액기간 등) */
export interface TimeRule {
  /** 룰 유형: 면책 기간(0원) | 감액 기간(비율 지급) */
  type: 'waiting_period' | 'reduction_period'
  /** 적용 기간 (일 단위) */
  period_days: number
  /** 설명 (예: "계약일로부터 90일 이내") */
  description: string
  /** 감액 시 지급 비율 (0.0 ~ 1.0, 면책이면 0) */
  payout_ratio: number
  /** 해당 조항 근거 원문 */
  evidence: string
}

/** 한도 및 공제(자기부담금) 규칙 */
export interface LimitRule {
  per_claim_limit?: number
  annual_limit?: number
  deductible_amount?: number
  deductible_ratio?: number
  description: string
  evidence: string
}

/** 지급 계산 방식 */
export interface PaymentRule {
  type: 'fixed' | 'proportional' | 'daily' | 'per_event'
  base_amount?: number
  base_ratio?: number
  formula_description: string
  evidence: string
}

/** 단일 보장 항목 (Coverage Item) 약관 JSON 구조 */
export interface PolicyCoverageItem {
  id: string
  name: string
  category: string
  insured_amount: number
  conditions: {
    summary: string
    required_keywords: string[]
    evidence: string
  }[]
  exclusions: {
    summary: string
    evidence: string
  }[]
  exceptions?: {
    summary: string
    evidence: string
  }[]
  time_rules?: TimeRule[]
  limits?: LimitRule[]
  payment: PaymentRule
}

/** 보험 상품 전체 약관 JSON */
export interface InsurancePolicyDocument {
  id: string
  product_name: string
  product_code: string
  category: '건강보험' | '실손의료보험' | '여행자보험' | '운전자보험' | '치아보험' | string
  insurer_name: string
  version: string
  summary: string
  coverages: PolicyCoverageItem[]
}

/** 사용자가 가입한 개별 보험 계약 (증권 정보) */
export interface UserEnrolledPolicy {
  contract_id: string
  policy_id: string
  policy_document: InsurancePolicyDocument
  contract_number: string
  insured_name: string
  contract_date: string // 계약 가입일 (YYYY-MM-DD)
  monthly_premium: number // 월 납입 보험료 (원)
  status: 'ACTIVE' | 'EXPIRED' | 'LAPSED'
  tag_color: 'coral' | 'navy' | 'mint' | 'yellow'
}

/** 시뮬레이션을 위한 사용자 상황 입력 */
export interface UserSituationInput {
  policy_id?: string
  contract_date?: string
  situation_description: string
  incident_name: string
  incident_type: 'diagnosis' | 'hospitalization' | 'surgery' | 'outpatient' | 'loss' | 'other'
  incident_date: string // 사고/진단 발생일 (YYYY-MM-DD)
  claimed_amount: number // 발생 총 치료비/손해액 (원)
  hospitalization_days?: number
  surgery_count?: number
  special_circumstances?: string[]
}

/** 판정 상태 */
export type CoverageJudgmentStatus =
  | 'ELIGIBLE' // 지급 가능
  | 'REDUCED' // 감액 지급
  | 'EXCLUDED' // 면책 (0원)
  | 'NOT_APPLICABLE' // 해당 없음
  | 'INSUFFICIENT_DATA' // 정보 부족

/** 보장 항목별 정밀 판단 결과 */
export interface CoverageItemJudgment {
  coverage_id: string
  coverage_name: string
  status: CoverageJudgmentStatus
  is_related: boolean
  estimated_payout: number
  calculation_formula: string
  decision_reason: string
  evidences: {
    rule_type: 'condition' | 'exclusion' | 'exception' | 'time_rule' | 'limit' | 'payment'
    title: string
    content: string
  }[]
  notes?: string[]
}

/** 단일 가입 보험에 대한 시뮬레이션 결과 */
export interface SinglePolicySimulationResult {
  contract_id: string
  policy_id: string
  policy_name: string
  insurer_name: string
  contract_date: string
  incident_date: string
  elapsed_days: number
  total_payout_for_policy: number
  relevant_judgments: CoverageItemJudgment[]
  unrelated_coverages: {
    coverage_id: string
    coverage_name: string
    reason: string
  }[]
}

/** 단일 보험 리포트 카드용 인터페이스 */
export interface PolicySimulationReport {
  id: string
  policy_id: string
  policy_name: string
  insurer_name: string
  elapsed_days: number
  total_estimated_payout: number
  summary_comment?: string
  user_input: UserSituationInput
  relevant_judgments: CoverageItemJudgment[]
  excluded_unrelated_coverages: {
    coverage_id: string
    coverage_name: string
    reason: string
  }[]
  expert_insights?: string[]
  disclaimer: string
}

/** 다중 가입 보험 통합 시뮬레이션 종합 리포트 */
export interface MultiPolicySimulationReport {
  id: string
  timestamp: string
  user_input: UserSituationInput
  evaluated_policies_count: number
  total_estimated_payout: number // 모든 가입 보험에서 받을 총 예상 금액
  policy_results: SinglePolicySimulationResult[]
  expert_insights: string[] // 전문가/AI 종합 진단 소견
  disclaimer: string
}
