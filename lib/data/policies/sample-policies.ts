import type { InsurancePolicyDocument } from '@/types/policy'

/**
 * 표준 보험약관 데이터셋
 * 실제 금융감독원 표준약관 및 대표 보험사 약관 구조 기반
 */
export const SAMPLE_POLICIES: InsurancePolicyDocument[] = [
  {
    id: 'policy_health_comprehensive',
    product_name: '안심 3대 질병 종합건강보험 (무배당)',
    product_code: 'ANSIM-HLTH-2026-01',
    category: '건강보험',
    insurer_name: 'ANSIM 손해보험',
    version: '2026.03 개정판',
    summary: '암, 뇌혈관질환, 허혈성심장질환 등 중대질병 진단비 및 수술/입원비를 폭넓게 보장하는 종합건강보험',
    coverages: [
      {
        id: 'cov_cancer_general',
        name: '일반암 진단비',
        category: '진단비',
        insured_amount: 50_000_000,
        conditions: [
          {
            summary: '한국표준질병사인분류(KCD) 상 악성신생물(C00~C97)로 최종 확정 진단된 경우 (단, 갑상선암, 기타피부암 등 유사암 제외)',
            required_keywords: ['암', '악성신생물', '위암', '대장암', '폐암', '간암', '유방암', '췌장암'],
            evidence: '약관 제14조(암의 정의 및 진단확정): "암"이라 함은 한국표준질병사인분류 중 [별표3] 악성신생물 분류표에 속하는 질병을 말하며, 병리과 전문의사에 의해 조직검사 또는 미세바늘흡인검사를 기초로 진단확정되어야 합니다.',
          },
        ],
        exclusions: [
          {
            summary: '피보험자, 보험수익자, 계약자의 고의로 인한 사고',
            evidence: '약관 제16조(보험금을 지급하지 않는 사유): 회사는 피보험자가 고의로 자신을 해친 경우 보험금을 지급하지 않습니다.',
          },
          {
            summary: '유사암(갑상선암 C73, 기타피부암 C44, 제자리암 D00-D09, 경계성종양 D37-D48)',
            evidence: '약관 제15조(보장 대상 제외): 갑상선암, 기타피부암, 제자리암, 경계성종양은 일반암 진단비에서 제외되며 유사암 진단비 특약에서 별도 보장합니다.',
          },
        ],
        exceptions: [
          {
            summary: '피보험자가 심신상실 등으로 자유로운 의사결정을 할 수 없는 상태에서 자신을 해친 경우는 보장',
            evidence: '약관 제16조 제2항: 단, 피보험자가 심신상실 등으로 자유로운 의사결정을 할 수 없는 상태에서 자신을 해친 경우에는 보험금을 지급합니다.',
          },
        ],
        time_rules: [
          {
            type: 'waiting_period',
            period_days: 90,
            description: '암보장개시일(계약일로부터 90일이 지난 날의 다음 날) 이전에 암으로 진단확정 시 무효 및 보험료 환급(면책)',
            payout_ratio: 0,
            evidence: '약관 제17조(암보장개시일): 암에 대한 회사의 보장개시일은 계약일로부터 그 날을 포함하여 90일이 지난 날의 다음 날(91일째)로 합니다. 90일 이내 암 진단 확정 시 해당 계약은 무효가 되며 보험금을 지급하지 않습니다.',
          },
          {
            type: 'reduction_period',
            period_days: 365,
            description: '암보장개시일 이후 1년 미만에 암 진단확정 시 가입금액의 50% 지급',
            payout_ratio: 0.5,
            evidence: '약관 제18조(보험금의 감액지급): 암보장개시일 이후 계약일로부터 1년 미만에 암으로 진단확정된 경우 가입금액의 50%를 지급합니다.',
          },
        ],
        limits: [
          {
            per_claim_limit: 50_000_000,
            description: '최초 1회에 한하여 지급',
            evidence: '약관 제14조 제1항: 암 진단비는 최초 1회에 한하여 지급하며, 지급 후 해당 특약은 자동 소멸됩니다.',
          },
        ],
        payment: {
          type: 'fixed',
          base_amount: 50_000_000,
          formula_description: '가입금액(50,000,000원) × 감액기간 적용비율(면책 0%, 1년미만 50%, 1년이상 100%)',
          evidence: '약관 제19조(보험금 지급액 산정): 보험수익자에게 지급할 보험금은 가입금액에 시기별 지급비율을 곱한 금액으로 합니다.',
        },
      },
      {
        id: 'cov_cerebrovascular_diagnosis',
        name: '뇌혈관질환 진단비',
        category: '진단비',
        insured_amount: 20_000_000,
        conditions: [
          {
            summary: '뇌출혈, 뇌경색증, 뇌혈관의 협착 및 폐색 등 뇌혈관질환(I60~I69)으로 진단확정된 경우',
            required_keywords: ['뇌혈관', '뇌출혈', '뇌경색', '중풍', '지주막하출혈', '뇌동맥류', 'I60', 'I63'],
            evidence: '약관 제21조(뇌혈관질환의 정의): "뇌혈관질환"이라 함은 KCD [별표4] 뇌혈관질환 분류표(I60~I69)에 해당하는 질병을 말합니다.',
          },
        ],
        exclusions: [
          {
            summary: '외상성 뇌출혈(상해로 인한 손상 S코드) 또는 뇌손상',
            evidence: '약관 제22조: 외상에 의한 뇌손상(S06 등)은 질병 뇌혈관질환 진단비에서 제외되며 상해 관련 보장에서 심사합니다.',
          },
        ],
        time_rules: [
          {
            type: 'reduction_period',
            period_days: 365,
            description: '계약일로부터 1년 미만에 진단확정 시 가입금액의 50% 지급',
            payout_ratio: 0.5,
            evidence: '약관 제23조(감액규정): 계약일로부터 1년 미만 진단 시 가입금액의 50%를 지급합니다.',
          },
        ],
        limits: [
          {
            per_claim_limit: 20_000_000,
            description: '최초 1회 한',
            evidence: '약관 제21조 제2항: 뇌혈관질환 진단비는 최초 1회에 한하여 지급합니다.',
          },
        ],
        payment: {
          type: 'fixed',
          base_amount: 20_000_000,
          formula_description: '가입금액(20,000,000원) × 감액기간 적용비율',
          evidence: '약관 제24조: 지급금액은 가입금액에 감액률을 곱하여 산출합니다.',
        },
      },
      {
        id: 'cov_disease_surgery',
        name: '질병수술비 (1~5종)',
        category: '수술비',
        insured_amount: 3_000_000,
        conditions: [
          {
            summary: '질병의 치료를 직접적인 목적으로 의료법 제3조에서 정한 병원에서 수술을 받은 경우',
            required_keywords: ['수술', '절제', '절단', '복강경', '로봇수술', '시술'],
            evidence: '약관 제30조(수술의 정의): "수술"이라 함은 의사가 기구를 사용하여 생체에 절단, 절제 등의 조작을 가하는 것을 말합니다. (흡인, 천자, 주사, 도수치료 제외)',
          },
        ],
        exclusions: [
          {
            summary: '미용성형, 건강검진 목적의 폴립 제거(단순 시술), 점/사마귀 제거, 레이저 시력교정술',
            evidence: '약관 제32조: 단순 피하 결절 제거, 점, 주근깨, 사마귀 제거, 미용 목적의 수술은 보장하지 않습니다.',
          },
        ],
        limits: [
          {
            per_claim_limit: 3_000_000,
            description: '수술 1회당 지급 (동일 질병으로 연간 반복 수술 시 종별 기준 적용)',
            evidence: '약관 제31조: 질병수술비는 수술 1회당 정액 지급합니다.',
          },
        ],
        payment: {
          type: 'per_event',
          base_amount: 3_000_000,
          formula_description: '수술 1회당 기본 가입금액(3,000,000원) × 수술 횟수',
          evidence: '약관 제33조: 질병 수술 1회당 해당 가입금액을 지급합니다.',
        },
      },
      {
        id: 'cov_disease_hospitalization_daily',
        name: '질병 입원일당 (1일 이상)',
        category: '입원비',
        insured_amount: 50_000,
        conditions: [
          {
            summary: '질병 치료를 목적으로 1일 이상 계속 입원하여 치료를 받은 경우 (최대 180일 한도)',
            required_keywords: ['입원', '병동', '병실', '입원치료', '퇴원'],
            evidence: '약관 제40조(입원의 정의): "입원"이라 함은 의사가 자택 등에서의 치료가 곤란하여 병원 등에 상주하며 치료를 받는 것을 말합니다.',
          },
        ],
        exclusions: [
          {
            summary: '정상분만, 단순 요양 목적의 입원, 알코올 중독 및 약물 오남용으로 인한 입원',
            evidence: '약관 제42조: 의학적 치료 행위가 없는 단순 요양성 입원이나 피로 회복 목적의 입원은 보장하지 않습니다.',
          },
        ],
        limits: [
          {
            annual_limit: 180,
            description: '1회 입원당 최대 180일 한도',
            evidence: '약관 제41조: 1회 입원당 최고 180일을 한도로 입원일수 1일당 입원일당을 지급합니다.',
          },
        ],
        payment: {
          type: 'daily',
          base_amount: 50_000,
          formula_description: '입원일수(최대 180일) × 일당(50,000원)',
          evidence: '약관 제43조: 입원일수 × 가입금액(50,000원)으로 산정합니다.',
        },
      },
    ],
  },
  {
    id: 'policy_indemnity_4th',
    product_name: '안심 4세대 표준 실손의료보험',
    product_code: 'ANSIM-INDEM-4TH',
    category: '실손의료보험',
    insurer_name: 'ANSIM 화재해상',
    version: '4세대 (2021.07 이후)',
    summary: '급여 80% 보장(자기부담 20%), 비급여 70% 보장(자기부담 30% or 3만원 중 큰 금액) 및 3대 비급여 특약 적용',
    coverages: [
      {
        id: 'cov_indemnity_inpatient_general',
        name: '질병/상해 입원의료비 (기본형 급여+비급여)',
        category: '실손입원',
        insured_amount: 50_000_000,
        conditions: [
          {
            summary: '질병 또는 상해로 병원에 입원하여 실제 부담한 본인부담금 및 비급여 의료비',
            required_keywords: ['입원', '병원비', '치료비', '수술비', '진료비', '병실료'],
            evidence: '실손약관 제3조(입원의료비 보장): 피보험자가 질병 또는 상해로 입원치료를 받은 경우 본인이 실제로 부담한 의료비를 보상합니다.',
          },
        ],
        exclusions: [
          {
            summary: '국민건강보험 미적용 진료(단, 예외규정 제외), 미용성형, 비타민/영양수액, 피로회복, 예방접종, 간병비',
            evidence: '실손약관 제4조(보상하지 않는 사항): 단순 영양제 투여, 미용목적 시술, 건강검진, 간병인 비용은 보상하지 않습니다.',
          },
        ],
        limits: [
          {
            annual_limit: 50_000_000,
            deductible_ratio: 0.2, // 급여/비급여 혼합 기준 기본 20%
            description: '연간 5천만원 한도 (급여 본인부담금의 20%, 비급여의 30%를 공제한 나머지 지급)',
            evidence: '실손약관 제5조: 입원치료 시 본인부담액 중 급여 20%, 비급여 30%를 차감한 잔액을 연간 5,000만원 한도로 지급합니다.',
          },
        ],
        payment: {
          type: 'proportional',
          base_ratio: 0.8,
          formula_description: '실제 발생 치료비 × 80% (자기부담금 20% 공제 후 연간 5천만원 한도 내)',
          evidence: '실손약관 제6조: 보상대상의료비에서 자기부담금을 차감한 금액을 지급합니다.',
        },
      },
      {
        id: 'cov_special_manual_therapy',
        name: '3대 비급여 특약 ①: 도수치료·체외충격파·증식치료',
        category: '3대비급여',
        insured_amount: 3_500_000,
        conditions: [
          {
            summary: '의사의 처방에 따라 실제 도수치료, 체외충격파치료, 증식치료를 받고 발생한 비급여 의료비',
            required_keywords: ['도수치료', '체외충격파', '증식치료', '도수', '척추교정'],
            evidence: '3대비급여특약 제1조: 의사 처방에 의해 질병 또는 상해 치료 목적으로 실시된 도수치료·체외충격파치료·증식치료비를 보상합니다.',
          },
        ],
        exclusions: [
          {
            summary: '치료 목적이 아닌 단순 마사지, 체형 교정, 예방적 목적의 시술',
            evidence: '3대비급여특약 제3조: 단순 체형교정이나 피로회복을 위한 마사지 등은 보상 대상에서 제외합니다.',
          },
        ],
        limits: [
          {
            annual_limit: 3_500_000,
            deductible_amount: 30_000,
            deductible_ratio: 0.3,
            description: '1회당 (3만원과 보장대상의료비의 30% 중 큰 금액) 공제, 연간 350만원 및 최대 50회 한도',
            evidence: '3대비급여특약 제2조: 1회당 자기부담금은 30,000원과 실제 치료비의 30% 중 큰 금액으로 하며, 연간 350만원(최대 50회) 한도 내에서 지급합니다.',
          },
        ],
        payment: {
          type: 'proportional',
          formula_description: 'min(max(치료비 - max(30,000원, 치료비 × 30%), 0), 연간잔여한도 3,500,000원)',
          evidence: '3대비급여특약 제4조: [발생의료비 - max(30,000원, 발생의료비 × 30%)] 수식에 따라 계산하여 지급합니다.',
        },
      },
    ],
  },
  {
    id: 'policy_traveler_global',
    product_name: '안심 글로벌 해외여행자보험 (스마트 플랜)',
    product_code: 'ANSIM-TRVL-GLOBAL',
    category: '여행자보험',
    insurer_name: 'ANSIM 안심보험',
    version: '2026 해외여행 표준',
    summary: '해외 질병/상해 치료비, 휴대품 손해, 항공기 지연, 배상책임을 종합 보장하는 여행자 안심 케어',
    coverages: [
      {
        id: 'cov_travel_overseas_medical',
        name: '해외여행 중 질병/상해 의료비',
        category: '해외의료비',
        insured_amount: 30_000_000,
        conditions: [
          {
            summary: '해외여행 도중 발생한 질병 또는 상해로 해외 현지 의료기관에서 직접 치료를 받고 발생한 의료비',
            required_keywords: ['해외병원', '응급실', '해외질병', '식중독', '뎅기열', '해외치료비', '해외상해', '현지병원'],
            evidence: '해외여행약관 제8조(해외의료비): 피보험자가 해외 체류 중 발생한 질병/상해로 외국의 의사에게 치료를 받은 경우 발생한 실제 의료비를 보상합니다.',
          },
        ],
        exclusions: [
          {
            summary: '출국 전 이미 앓고 있던 기왕증(단, 응급 악화 제외), 스카이다이빙/패러글라이딩 등 위험 레포츠 활동 중 사고',
            evidence: '해외여행약관 제10조: 여행 전 기왕증 및 전문 등반, 스카이다이빙, 행글라이딩 등 위험 레포츠 중 사고는 면책됩니다.',
          },
        ],
        limits: [
          {
            per_claim_limit: 30_000_000,
            deductible_amount: 0,
            description: '자기부담금 없음 (가입금액 3,000만원 한도 내 전액 실손 보장)',
            evidence: '해외여행약관 제9조: 해외의료비는 자기부담금 없이 가입금액 한도 내에서 100% 보상합니다.',
          },
        ],
        payment: {
          type: 'proportional',
          base_ratio: 1.0,
          formula_description: 'min(해외 현지 실제 발생 의료비, 30,000,000원)',
          evidence: '해외여행약관 제11조: 영수증에 기재된 실제 해외 의료비 전액을 환율 적용하여 한도 내에서 지급합니다.',
        },
      },
      {
        id: 'cov_travel_luggage_loss',
        name: '휴대품 손해 (도난/파손)',
        category: '휴대품손해',
        insured_amount: 1_000_000,
        conditions: [
          {
            summary: '해외여행 중 피보험자가 소지한 휴대품이 도난되거나 우연한 사고로 파손/훼손된 경우 (현지 경찰서 도난신고서 Police Report 필수)',
            required_keywords: ['도난', '휴대폰파손', '카메라파손', '소매치기', '캐리어파손', '휴대품', '손해'],
            evidence: '해외여행약관 제15조(휴대품 손해): 여행 중 피보험자 소유의 휴대품에 입은 도난 또는 파손 손해를 보상합니다. (분실은 제외)',
          },
        ],
        exclusions: [
          {
            summary: '단순 분실(잃어버림), 현금/신용카드/유가증권/항공권 손실, 통상의 마모나 흠집',
            evidence: '해외여행약관 제17조(보상하지 않는 손해): 단순 유실(분실), 현금, 유가증권, 여권, 콘택트렌즈는 보상하지 않습니다.',
          },
        ],
        limits: [
          {
            per_claim_limit: 200_000, // 품목 1개당 20만원 한도
            annual_limit: 1_000_000,
            deductible_amount: 10_000,
            description: '물품 1개(조/쌍)당 최대 20만원 한도, 자기부담금 건당 1만원 공제, 총 한도 100만원',
            evidence: '해외여행약관 제16조: 휴대품 1개, 1쌍 또는 1조에 대하여 20만원을 최고 한도로 하며, 1사고당 자기부담금 10,000원을 공제합니다.',
          },
        ],
        payment: {
          type: 'proportional',
          formula_description: 'min(손해액, 200,000원) - 자기부담금 10,000원',
          evidence: '해외여행약관 제18조: [min(품목 손해액, 20만원) - 자기부담금 1만원]으로 계산합니다.',
        },
      },
    ],
  },
]
