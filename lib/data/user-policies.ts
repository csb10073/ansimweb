import type { UserEnrolledPolicy } from '@/types/policy'
import { SAMPLE_POLICIES } from './policies/sample-policies'

/**
 * 사용자가 현재 가입 중인 보험 계약 목록 (마이데이터 / 회원 조회 기준)
 * 백엔드에 사전 등록된 보험약관 JSON(`SAMPLE_POLICIES`)과 1:1로 매핑됩니다.
 */
export const DEFAULT_USER_POLICIES: UserEnrolledPolicy[] = [
  {
    contract_id: 'contract_hlth_001',
    policy_id: 'policy_health_comprehensive',
    policy_document: SAMPLE_POLICIES[0], // 안심 3대 질병 종합건강보험
    contract_number: 'ANSIM-2025-HLTH-9941',
    insured_name: '홍길동',
    contract_date: '2025-08-01',
    monthly_premium: 85_000,
    status: 'ACTIVE',
    tag_color: 'coral',
  },
  {
    contract_id: 'contract_indem_002',
    policy_id: 'policy_indemnity_4th',
    policy_document: SAMPLE_POLICIES[1], // 안심 4세대 표준 실손의료보험
    contract_number: 'ANSIM-2024-INDM-3312',
    insured_name: '홍길동',
    contract_date: '2024-01-10',
    monthly_premium: 24_500,
    status: 'ACTIVE',
    tag_color: 'mint',
  },
  {
    contract_id: 'contract_trvl_003',
    policy_id: 'policy_traveler_global',
    policy_document: SAMPLE_POLICIES[2], // 안심 글로벌 해외여행자보험
    contract_number: 'ANSIM-2026-TRVL-7782',
    insured_name: '홍길동',
    contract_date: '2026-07-01',
    monthly_premium: 18_000,
    status: 'ACTIVE',
    tag_color: 'navy',
  },
]
