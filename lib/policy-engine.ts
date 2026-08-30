import type {
  CoverageItemJudgment,
  InsurancePolicyDocument,
  MultiPolicySimulationReport,
  PolicyCoverageItem,
  SinglePolicySimulationResult,
  UserEnrolledPolicy,
  UserSituationInput,
} from '@/types/policy'

/** 두 날짜 사이의 일수(day diff) 계산 (종료일 - 시작일) */
export function calculateElapsedDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  const diffTime = end.getTime() - start.getTime()
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
}

/**
 * 1. 사용자 상황과 보장 항목 간의 연관성(Relevance) 판정
 */
export function evaluateCoverageRelevance(
  coverage: PolicyCoverageItem,
  input: UserSituationInput,
): { isRelated: boolean; matchReason: string } {
  const textToSearch = `${input.situation_description} ${input.incident_name} ${input.incident_type}`.toLowerCase()

  // 1) 조건 키워드 매칭
  const matchedKeywords: string[] = []
  for (const cond of coverage.conditions) {
    for (const kw of cond.required_keywords) {
      if (textToSearch.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw)
      }
    }
  }

  // 2) 치료 유형 직접 매칭 (diagnosis, hospitalization, surgery, outpatient, loss 등)
  let categoryMatch = false
  if (input.incident_type === 'diagnosis' && coverage.category.includes('진단비')) categoryMatch = true
  if (input.incident_type === 'surgery' && coverage.category.includes('수술비')) categoryMatch = true
  if (
    input.incident_type === 'hospitalization' &&
    (coverage.category.includes('입원') || coverage.category.includes('실손입원'))
  )
    categoryMatch = true
  if (input.incident_type === 'loss' && coverage.category.includes('손해')) categoryMatch = true
  if (
    input.incident_type === 'outpatient' &&
    (coverage.category.includes('통원') || coverage.category.includes('3대비급여'))
  )
    categoryMatch = true

  if (matchedKeywords.length > 0 || categoryMatch) {
    const reason =
      matchedKeywords.length > 0
        ? `상황 내 핵심 키워드 [${matchedKeywords.join(', ')}]와 약관 조건이 일치합니다.`
        : `치료 유형(${input.incident_type})과 보장 카테고리(${coverage.category})가 부합합니다.`
    return { isRelated: true, matchReason: reason }
  }

  return {
    isRelated: false,
    matchReason: `사용자 상황(진단명: ${input.incident_name || '미기재'}, 유형: ${input.incident_type})과 약관의 지급 조건 키워드가 일치하지 않습니다.`,
  }
}

/**
 * 2. 단일 보장 항목에 대한 정밀 약관 심사 및 계산
 */
export function judgeCoverageItem(
  coverage: PolicyCoverageItem,
  input: UserSituationInput,
  elapsedDays: number,
): CoverageItemJudgment {
  const relevance = evaluateCoverageRelevance(coverage, input)
  const evidences: CoverageItemJudgment['evidences'] = []
  const notes: string[] = []

  // 관련이 없는 항목인 경우
  if (!relevance.isRelated) {
    return {
      coverage_id: coverage.id,
      coverage_name: coverage.name,
      status: 'NOT_APPLICABLE',
      is_related: false,
      estimated_payout: 0,
      calculation_formula: '0원 (관련 보장 항목 아님)',
      decision_reason: relevance.matchReason,
      evidences: [],
    }
  }

  // 관련 조건 evidence 등록
  for (const cond of coverage.conditions) {
    evidences.push({
      rule_type: 'condition',
      title: `지급 조건: ${cond.summary}`,
      content: cond.evidence,
    })
  }

  // 1단계: 면책(Exclusion) & 예외(Exception) 심사
  const specialFlags = input.special_circumstances ?? []
  let isExcluded = false
  let exclusionReason = ''

  for (const excl of coverage.exclusions) {
    evidences.push({
      rule_type: 'exclusion',
      title: `면책 조항: ${excl.summary}`,
      content: excl.evidence,
    })

    // 특수 면책 키워드 점검 (음주, 고의, 미용, 단순분실 등)
    if (
      (specialFlags.includes('고의') || input.situation_description.includes('고의')) &&
      excl.summary.includes('고의')
    ) {
      isExcluded = true
      exclusionReason = '피보험자/계약자의 고의 사고에 해당하여 면책 조항이 적용됩니다.'
    }
    if (
      (specialFlags.includes('미용목적') || input.situation_description.includes('미용')) &&
      excl.summary.includes('미용')
    ) {
      isExcluded = true
      exclusionReason = '치료 목적이 아닌 미용/성형 목적에 해당하여 보상하지 않습니다.'
    }
    if (
      (specialFlags.includes('단순분실') || input.situation_description.includes('분실')) &&
      excl.summary.includes('분실')
    ) {
      isExcluded = true
      exclusionReason = '도난/파손이 아닌 단순 분실(유실)은 약관상 보상하지 않는 손해입니다.'
    }
  }

  // 면책의 예외(Exceptions) 점검
  if (isExcluded && coverage.exceptions && coverage.exceptions.length > 0) {
    for (const exc of coverage.exceptions) {
      evidences.push({
        rule_type: 'exception',
        title: `면책 예외 조항: ${exc.summary}`,
        content: exc.evidence,
      })
      if (
        specialFlags.includes('심신상실') ||
        input.situation_description.includes('심신상실') ||
        input.situation_description.includes('의사결정 불가')
      ) {
        isExcluded = false
        notes.push('면책 예외 규정(자유로운 의사결정이 불가능한 상태)이 확인되어 면책 적용이 해제되었습니다.')
      }
    }
  }

  if (isExcluded) {
    return {
      coverage_id: coverage.id,
      coverage_name: coverage.name,
      status: 'EXCLUDED',
      is_related: true,
      estimated_payout: 0,
      calculation_formula: '0원 (면책 조항 적용)',
      decision_reason: exclusionReason,
      evidences,
      notes,
    }
  }

  // 2단계: 시기 규칙 (면책기간, 감액기간) 심사
  let payoutRatio = 1.0
  let isWaitingPeriod = false
  let isReductionPeriod = false
  let timeRuleReason = ''

  if (coverage.time_rules && coverage.time_rules.length > 0) {
    for (const tr of coverage.time_rules) {
      evidences.push({
        rule_type: 'time_rule',
        title: `시기 규칙: ${tr.description}`,
        content: tr.evidence,
      })

      if (tr.type === 'waiting_period' && elapsedDays <= tr.period_days) {
        isWaitingPeriod = true
        payoutRatio = 0
        timeRuleReason = `계약일로부터 경과일(${elapsedDays}일)이 면책기간(${tr.period_days}일) 이내이므로 보장 개시 전으로 면책(0원)됩니다.`
      } else if (
        tr.type === 'reduction_period' &&
        !isWaitingPeriod &&
        elapsedDays <= tr.period_days
      ) {
        isReductionPeriod = true
        payoutRatio = tr.payout_ratio
        timeRuleReason = `계약일로부터 경과일(${elapsedDays}일)이 감액기간(${tr.period_days}일 이내)에 해당하여 가입금액의 ${Math.round(
          tr.payout_ratio * 100,
        )}%만 감액 지급됩니다.`
      }
    }
  }

  if (isWaitingPeriod) {
    return {
      coverage_id: coverage.id,
      coverage_name: coverage.name,
      status: 'EXCLUDED',
      is_related: true,
      estimated_payout: 0,
      calculation_formula: `가입금액(${coverage.insured_amount.toLocaleString()}원) × 면책비율(0%) = 0원`,
      decision_reason: timeRuleReason,
      evidences,
      notes: ['약관상 면책기간(보장개시일 이전)에 발생한 사고/진단으로 판단됩니다.'],
    }
  }

  // 3단계: 지급 공식(Payment) 및 한도(Limits/Deductibles) 계산
  evidences.push({
    rule_type: 'payment',
    title: `지급 기준: ${coverage.payment.formula_description}`,
    content: coverage.payment.evidence,
  })

  if (coverage.limits) {
    for (const lim of coverage.limits) {
      evidences.push({
        rule_type: 'limit',
        title: `한도/공제 기준: ${lim.description}`,
        content: lim.evidence,
      })
    }
  }

  let estimatedPayout = 0
  let calculationFormula = ''
  let finalStatus: CoverageItemJudgment['status'] = isReductionPeriod ? 'REDUCED' : 'ELIGIBLE'

  switch (coverage.payment.type) {
    case 'fixed': {
      const base = coverage.payment.base_amount ?? coverage.insured_amount
      estimatedPayout = Math.round(base * payoutRatio)
      if (isReductionPeriod) {
        calculationFormula = `가입금액 ${base.toLocaleString('ko-KR')}원 × 감액률 ${Math.round(
          payoutRatio * 100,
        )}% = ${estimatedPayout.toLocaleString('ko-KR')}원`
      } else {
        calculationFormula = `가입금액 전액 = ${estimatedPayout.toLocaleString('ko-KR')}원`
      }
      break
    }

    case 'daily': {
      const days = input.hospitalization_days ?? 1
      const dailyAmount = coverage.payment.base_amount ?? coverage.insured_amount
      const maxDays = coverage.limits?.[0]?.annual_limit ?? 180
      const appliedDays = Math.min(days, maxDays)
      estimatedPayout = appliedDays * dailyAmount
      calculationFormula = `입원일수(${appliedDays}일) × 일당(${dailyAmount.toLocaleString('ko-KR')}원) = ${estimatedPayout.toLocaleString('ko-KR')}원`
      if (days > maxDays) {
        notes.push(`최대 한도 ${maxDays}일이 적용되어 초과 ${days - maxDays}일은 제외되었습니다.`)
      }
      break
    }

    case 'per_event': {
      const count = input.surgery_count ?? 1
      const perAmount = coverage.payment.base_amount ?? coverage.insured_amount
      estimatedPayout = count * perAmount
      calculationFormula = `수술 횟수(${count}회) × 1회당 지급액(${perAmount.toLocaleString('ko-KR')}원) = ${estimatedPayout.toLocaleString('ko-KR')}원`
      break
    }

    case 'proportional': {
      const claimed = input.claimed_amount
      if (claimed <= 0) {
        return {
          coverage_id: coverage.id,
          coverage_name: coverage.name,
          status: 'INSUFFICIENT_DATA',
          is_related: true,
          estimated_payout: 0,
          calculation_formula: '계산 불가 (치료비/손해액 0원 또는 미입력)',
          decision_reason: '실손 비례 보장 항목은 실제 발생한 치료비/손해 금액이 필수입니다.',
          evidences,
          notes: ['정확한 병원비 영수증 또는 손해 금액을 입력해 주세요.'],
        }
      }

      // 도수치료 등 특약 한도 및 공제 계산
      if (coverage.id === 'cov_special_manual_therapy') {
        const deductible = Math.max(30_000, Math.round(claimed * 0.3))
        const afterDeductible = Math.max(0, claimed - deductible)
        const cap = coverage.limits?.[0]?.annual_limit ?? 3_500_000
        estimatedPayout = Math.min(afterDeductible, cap)
        calculationFormula = `min(${claimed.toLocaleString('ko-KR')}원 - max(3만원, 30%=${Math.round(
          claimed * 0.3,
        ).toLocaleString('ko-KR')}원), 한도 ${cap.toLocaleString('ko-KR')}원) = ${estimatedPayout.toLocaleString('ko-KR')}원`
      } else if (coverage.id === 'cov_travel_luggage_loss') {
        const itemCap = 200_000
        const deductible = 10_000
        const itemLoss = Math.min(claimed, itemCap)
        estimatedPayout = Math.max(0, itemLoss - deductible)
        calculationFormula = `min(손해액 ${claimed.toLocaleString('ko-KR')}원, 1개한도 200,000원) - 자기부담금 10,000원 = ${estimatedPayout.toLocaleString('ko-KR')}원`
      } else {
        // 일반 실손의료비
        const ratio = coverage.payment.base_ratio ?? 0.8
        const raw = Math.round(claimed * ratio)
        const cap = coverage.insured_amount
        estimatedPayout = Math.min(raw, cap)
        calculationFormula = `min(실제치료비 ${claimed.toLocaleString('ko-KR')}원 × 보장비율 ${Math.round(
          ratio * 100,
        )}%, 한도 ${cap.toLocaleString('ko-KR')}원) = ${estimatedPayout.toLocaleString('ko-KR')}원`
      }
      break
    }
  }

  const decisionReason = timeRuleReason || `약관 지급 조건 및 한도 기준을 충족하여 정상 산출되었습니다.`

  return {
    coverage_id: coverage.id,
    coverage_name: coverage.name,
    status: finalStatus,
    is_related: true,
    estimated_payout: estimatedPayout,
    calculation_formula: calculationFormula,
    decision_reason: decisionReason,
    evidences,
    notes,
  }
}

/**
 * 3. 단일 가입 보험에 대한 시뮬레이션
 */
export function runSinglePolicySimulation(
  enrolledPolicy: UserEnrolledPolicy,
  input: UserSituationInput,
): SinglePolicySimulationResult {
  const policyDoc = enrolledPolicy.policy_document
  const elapsedDays = calculateElapsedDays(enrolledPolicy.contract_date, input.incident_date)
  const relevantJudgments: CoverageItemJudgment[] = []
  const unrelatedCoverages: { coverage_id: string; coverage_name: string; reason: string }[] = []

  let policyPayout = 0

  for (const coverage of policyDoc.coverages) {
    const judgment = judgeCoverageItem(coverage, input, elapsedDays)
    if (judgment.is_related) {
      relevantJudgments.push(judgment)
      policyPayout += judgment.estimated_payout
    } else {
      unrelatedCoverages.push({
        coverage_id: coverage.id,
        coverage_name: coverage.name,
        reason: judgment.decision_reason,
      })
    }
  }

  return {
    contract_id: enrolledPolicy.contract_id,
    policy_id: enrolledPolicy.policy_id,
    policy_name: policyDoc.product_name,
    insurer_name: policyDoc.insurer_name,
    contract_date: enrolledPolicy.contract_date,
    incident_date: input.incident_date,
    elapsed_days: elapsedDays,
    total_payout_for_policy: policyPayout,
    relevant_judgments: relevantJudgments,
    unrelated_coverages: unrelatedCoverages,
  }
}

/**
 * 4. 사용자의 복수 가입 보험 전체에 대한 통합 시뮬레이션 마스터 함수
 */
export function runMultiPolicySimulation(
  enrolledPolicies: UserEnrolledPolicy[],
  input: UserSituationInput,
): MultiPolicySimulationReport {
  const policyResults: SinglePolicySimulationResult[] = []
  let grandTotalPayout = 0

  for (const policy of enrolledPolicies) {
    const res = runSinglePolicySimulation(policy, input)
    policyResults.push(res)
    grandTotalPayout += res.total_payout_for_policy
  }

  // 전문가/AI 통합 소견 생성
  const insights: string[] = []
  const activePayoutPolicies = policyResults.filter((p) => p.total_payout_for_policy > 0)

  if (activePayoutPolicies.length > 1) {
    insights.push(
      `가입하신 ${enrolledPolicies.length}개 보험 중 [${activePayoutPolicies
        .map((p) => p.policy_name)
        .join(', ')}] 총 ${activePayoutPolicies.length}개 상품에서 중복/복합 보장이 가능합니다.`,
    )
    insights.push(
      `실손의료비는 실제 발생한 본인부담금을 실손 비례 보상하며, 건강보험의 진단비 및 수술비는 정액으로 중복 수령이 가능합니다.`,
    )
  } else if (activePayoutPolicies.length === 1) {
    insights.push(
      `가입하신 보험 중 [${activePayoutPolicies[0].policy_name}]에서 보장 요건을 충족하여 총 ${activePayoutPolicies[0].total_payout_for_policy.toLocaleString('ko-KR')}원의 예상 보험금이 산출되었습니다.`,
    )
  } else {
    insights.push(
      `가입하신 보험 목록 중 현재 발생한 상황(${input.incident_name || '미기재'})에 부합하거나 면책 기준을 통과한 보장 내역이 없습니다.`,
    )
  }

  return {
    id: `multi_sim_${Date.now()}`,
    timestamp: new Date().toISOString(),
    user_input: input,
    evaluated_policies_count: enrolledPolicies.length,
    total_estimated_payout: grandTotalPayout,
    policy_results: policyResults,
    expert_insights: insights,
    disclaimer:
      '본 결과는 고객님이 가입하신 복수 보험의 약관 JSON 데이터를 기반으로 산출된 모의 시뮬레이션 결과입니다. 실제 보험금 청구 및 심사 시 보험사의 현장실사, 의무기록 및 기왕증 조사 등에 따라 지급 금액이 달라질 수 있습니다.',
  }
}
