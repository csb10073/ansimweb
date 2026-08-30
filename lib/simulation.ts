import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'

/**
 * ANSIM 보험 — 보험금 시뮬레이션 계산 로직
 *
 * ⚠️ 아래 보장 비율(coverageRatio)과 한도(cap)는 실제 보험 상품과 무관한
 * 예시용 mock 값입니다. Supabase의 `insurance_products.coverage_rules`가
 * 준비되면 이 테이블을 대체해 실제 상품별 보장 조건을 불러오도록 교체하세요.
 */
export interface SimulationInput {
  insuranceType: string
  accidentType: string
  claimedAmount: number
  coveragePeriod: string
}

export interface SimulationResult {
  estimatedPayout: number
  coverageRatio: number
  payoutCap: number
  basisDescription: string
}

/** 보험 종류 + 사고 유형별 mock 보장 비율/한도 테이블 */
const MOCK_COVERAGE_RULES: Record<
  string,
  Record<string, { ratio: number; cap: number }>
> = {
  실손보험: {
    통원치료: { ratio: 0.8, cap: 300_000 },
    입원치료: { ratio: 0.9, cap: 5_000_000 },
    수술: { ratio: 0.9, cap: 10_000_000 },
  },
  건강보험: {
    질병진단: { ratio: 1, cap: 20_000_000 },
    입원치료: { ratio: 0.7, cap: 3_000_000 },
    후유장해: { ratio: 1, cap: 50_000_000 },
  },
  여행자보험: {
    해외질병: { ratio: 0.85, cap: 10_000_000 },
    휴대품손해: { ratio: 0.7, cap: 1_000_000 },
    항공기지연: { ratio: 1, cap: 200_000 },
  },
}

/** 가입 기간이 길수록 보장 비율에 소폭 가산되는 mock 가중치 */
const PERIOD_BONUS: Record<string, number> = {
  '1년': 0,
  '3년': 0.02,
  '5년': 0.04,
  '10년': 0.06,
}

/**
 * 입력값을 바탕으로 예상 보험금을 계산합니다.
 * 실제 서비스에서는 Supabase `insurance_products` 테이블의
 * `coverage_rules`를 조회해 이 함수의 테이블 조회 부분만 대체하면 됩니다.
 */
export function calculateEstimatedPayout(input: SimulationInput): SimulationResult {
  const rule = MOCK_COVERAGE_RULES[input.insuranceType]?.[input.accidentType]

  if (!rule || input.claimedAmount <= 0) {
    return {
      estimatedPayout: 0,
      coverageRatio: 0,
      payoutCap: 0,
      basisDescription: '입력 정보를 확인할 수 없어 계산할 수 없습니다.',
    }
  }

  const bonus = PERIOD_BONUS[input.coveragePeriod] ?? 0
  const effectiveRatio = Math.min(rule.ratio + bonus, 1)
  const rawPayout = input.claimedAmount * effectiveRatio
  const estimatedPayout = Math.min(Math.round(rawPayout), rule.cap)

  const basisDescription = `${input.insuranceType} · ${input.accidentType} 기준 보장 비율 ${Math.round(
    effectiveRatio * 100,
  )}% (가입 기간 ${input.coveragePeriod} 가산 포함), 최대 지급 한도 ${rule.cap.toLocaleString('ko-KR')}원`

  return {
    estimatedPayout,
    coverageRatio: effectiveRatio,
    payoutCap: rule.cap,
    basisDescription,
  }
}

/**
 * 시뮬레이션 결과를 저장합니다.
 * Supabase가 연결되어 있으면 `insurance_simulations` 테이블에 기록하고,
 * 연결되어 있지 않으면 콘솔에만 남기고 조용히 성공을 반환합니다(mock).
 */
export async function saveSimulation(
  input: SimulationInput,
  result: SimulationResult,
): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) {
    console.log('[v0] Supabase가 연결되지 않아 시뮬레이션 결과를 저장하지 않았습니다.', {
      input,
      result,
    })
    return { success: true }
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return { success: true }
  }

  const { error } = await (supabase.from('insurance_simulations') as any).insert({
    user_id: null,
    insurance_type: input.insuranceType,
    accident_type: input.accidentType,
    claimed_amount: input.claimedAmount,
    estimated_payout: result.estimatedPayout,
  })

  if (error) {
    console.log('[v0] 시뮬레이션 결과 저장 중 오류가 발생했습니다.', error)
    return { success: false }
  }

  return { success: true }
}
