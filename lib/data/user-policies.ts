import type { UserEnrolledPolicy } from '@/types/policy'
import { SAMPLE_POLICIES } from './policies/sample-policies'

/**
 * 홍길동 계정 전용 보유 보험 증권 목록 (총 3건: 암/종합건강 + 실손 + 여행자)
 */
export const HONG_USER_POLICIES: UserEnrolledPolicy[] = [
  {
    contract_id: 'contract_hong_hlth_001',
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
    contract_id: 'contract_hong_indem_002',
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
    contract_id: 'contract_hong_trvl_003',
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

/**
 * 김안심 계정 전용 보유 보험 증권 목록 (총 2건: 실손 + 종합건강)
 */
export const KIM_USER_POLICIES: UserEnrolledPolicy[] = [
  {
    contract_id: 'contract_kim_indem_001',
    policy_id: 'policy_indemnity_4th',
    policy_document: SAMPLE_POLICIES[1], // 안심 4세대 표준 실손의료보험
    contract_number: 'ANSIM-2025-INDM-5521',
    insured_name: '김안심',
    contract_date: '2025-03-15',
    monthly_premium: 27_000,
    status: 'ACTIVE',
    tag_color: 'mint',
  },
  {
    contract_id: 'contract_kim_hlth_002',
    policy_id: 'policy_health_comprehensive',
    policy_document: SAMPLE_POLICIES[0], // 안심 3대 질병 종합건강보험
    contract_number: 'ANSIM-2024-HLTH-1192',
    insured_name: '김안심',
    contract_date: '2024-06-20',
    monthly_premium: 72_000,
    status: 'ACTIVE',
    tag_color: 'coral',
  },
]

/**
 * 기본 가입 보험 계약 목록 (fallback)
 */
export const DEFAULT_USER_POLICIES: UserEnrolledPolicy[] = HONG_USER_POLICIES

/**
 * 사용자 정보에 따른 기본 증권 목록 반환 함수
 */
export function getDefaultPoliciesForUser(
  user?: { id?: string; name?: string } | string | null,
): UserEnrolledPolicy[] {
  const name = typeof user === 'string' ? user : user?.name
  const id = typeof user === 'object' ? user?.id : undefined

  if (id === 'user_kim_02' || name?.includes('김안심')) {
    return KIM_USER_POLICIES
  }
  return HONG_USER_POLICIES
}

/**
 * 마이데이터 연동 또는 추가 등록 가능한 후보 보험 계약 목록
 */
export const CANDIDATE_EXTRA_POLICIES: UserEnrolledPolicy[] = [
  {
    contract_id: 'contract_drv_004',
    policy_id: 'policy_driver_protection',
    policy_document: SAMPLE_POLICIES[3], // 안심 프리미엄 운전자 비용보장보험
    contract_number: 'ANSIM-2026-DRV-1109',
    insured_name: '홍길동',
    contract_date: '2026-02-15',
    monthly_premium: 19_800,
    status: 'ACTIVE',
    tag_color: 'yellow',
  },
  {
    contract_id: 'contract_crd_005',
    policy_id: 'policy_brain_cardio_intensive',
    policy_document: SAMPLE_POLICIES[4], // 안심 뇌·심장 집중케어보험
    contract_number: 'ANSIM-2026-CRD-8821',
    insured_name: '홍길동',
    contract_date: '2026-03-01',
    monthly_premium: 45_000,
    status: 'ACTIVE',
    tag_color: 'coral',
  },
  {
    contract_id: 'contract_dent_006',
    policy_id: 'policy_dental_care',
    policy_document: SAMPLE_POLICIES[5], // 안심 든든 치아케어보험
    contract_number: 'ANSIM-2026-DENT-5541',
    insured_name: '홍길동',
    contract_date: '2026-04-10',
    monthly_premium: 32_000,
    status: 'ACTIVE',
    tag_color: 'mint',
  },
]

export const USER_POLICIES_CHANGE_EVENT = 'ansim:user-policies-changed'

export function getUserStorageKey(userId?: string | null): string {
  return `ansim_user_enrolled_policies_v4_${userId || 'default'}`
}

export function getUserLastSyncKey(userId?: string | null): string {
  return `ansim_user_policies_last_sync_v4_${userId || 'default'}`
}

/**
 * 로컬 스토리지에서 사용자의 현재 가입 보험 목록을 안전하게 가져옵니다.
 */
export function getStoredUserPolicies(
  user?: { id?: string; name?: string } | null,
): UserEnrolledPolicy[] {
  const fallback = getDefaultPoliciesForUser(user)
  if (typeof window === 'undefined') return fallback

  try {
    const key = getUserStorageKey(user?.id)
    const raw = localStorage.getItem(key)
    if (!raw) {
      return fallback
    }
    const parsed = JSON.parse(raw) as UserEnrolledPolicy[]
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => {
        const matchingSample = SAMPLE_POLICIES.find((p) => p.id === item.policy_id)
        return {
          ...item,
          policy_document: matchingSample || item.policy_document,
        }
      })
    }
    return fallback
  } catch {
    return fallback
  }
}

/**
 * 변경된 보험 목록을 로컬 스토리지에 저장하고 앱 전역에 브로드캐스트합니다.
 */
export function saveStoredUserPolicies(
  policies: UserEnrolledPolicy[],
  user?: { id?: string; name?: string } | null,
): void {
  if (typeof window === 'undefined') return

  try {
    const key = getUserStorageKey(user?.id)
    const syncKey = getUserLastSyncKey(user?.id)
    localStorage.setItem(key, JSON.stringify(policies))
    const nowStr = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    localStorage.setItem(syncKey, nowStr)

    // 동일 브라우저 탭 내 다른 컴포넌트들에게 변경 이벤트 발송
    window.dispatchEvent(
      new CustomEvent(USER_POLICIES_CHANGE_EVENT, {
        detail: { policies, lastSyncTime: nowStr, userId: user?.id },
      }),
    )
  } catch (err) {
    console.error('Failed to save user policies:', err)
  }
}

/**
 * 가입 보험 데이터를 해당 계정의 초기 기본값으로 리셋합니다.
 */
export function resetStoredUserPolicies(
  user?: { id?: string; name?: string } | null,
): UserEnrolledPolicy[] {
  const defaultList = getDefaultPoliciesForUser(user)
  if (typeof window === 'undefined') return defaultList

  try {
    const key = getUserStorageKey(user?.id)
    const syncKey = getUserLastSyncKey(user?.id)
    localStorage.removeItem(key)
    const nowStr = new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    localStorage.setItem(syncKey, nowStr)

    window.dispatchEvent(
      new CustomEvent(USER_POLICIES_CHANGE_EVENT, {
        detail: { policies: defaultList, lastSyncTime: nowStr, userId: user?.id },
      }),
    )
    return defaultList
  } catch {
    return defaultList
  }
}

/**
 * 마지막 마이데이터 동기화 일시 조회
 */
export function getLastSyncTime(user?: { id?: string } | null): string {
  if (typeof window === 'undefined') return '실시간 연동됨'
  try {
    const syncKey = getUserLastSyncKey(user?.id)
    return localStorage.getItem(syncKey) || '실시간 연동됨'
  } catch {
    return '실시간 연동됨'
  }
}
