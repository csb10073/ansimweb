/**
 * ANSIM 보험 — Supabase 테이블 타입 정의
 *
 * 실제 Supabase 프로젝트가 연결되면 이 타입들을 기준으로
 * `lib/supabase/client.ts`의 제네릭 타입 인자로 사용할 수 있습니다.
 * 지금은 목업 데이터와 함수 시그니처를 맞추기 위한 용도로만 사용됩니다.
 */

/** 보험 상품 정보 */
export interface InsuranceProduct {
  id: string
  name: string
  category: '실손보험' | '건강보험' | '여행자보험'
  description: string
  /** 보장 조건 (자유 형식 JSON — 사고 유형별 보장 비율, 한도 등) */
  coverage_rules: Record<string, unknown>
  is_active: boolean
}

/** 보험금 시뮬레이션 결과 기록 */
export interface InsuranceSimulation {
  id: string
  user_id: string | null
  insurance_type: string
  accident_type: string
  claimed_amount: number
  estimated_payout: number
  created_at: string
}

/** 여행자 보험 추천 결과 */
export interface TravelRecommendation {
  id: string
  destination: string
  trip_days: number
  traveler_age_group: string
  recommended_product_id: string
}

/** Supabase generated Database 타입 (간소화 버전) */
export interface Database {
  public: {
    Tables: {
      insurance_products: {
        Row: InsuranceProduct
        Insert: Omit<InsuranceProduct, 'id'> & { id?: string }
        Update: Partial<InsuranceProduct>
      }
      insurance_simulations: {
        Row: InsuranceSimulation
        Insert: Omit<InsuranceSimulation, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<InsuranceSimulation>
      }
      travel_recommendations: {
        Row: TravelRecommendation
        Insert: Omit<TravelRecommendation, 'id'> & { id?: string }
        Update: Partial<TravelRecommendation>
      }
    }
  }
}
