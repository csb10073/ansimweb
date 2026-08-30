import type { LucideIcon } from 'lucide-react'
import {
  Calculator,
  FileSearch,
  Plane,
  Sparkles,
} from 'lucide-react'

/** 상단 헤더 내비게이션 메뉴 */
export const navLinks = [
  { label: '보험 조회', href: '/#services' },
  { label: '여행자 보험', href: '/#services' },
  { label: '보험 가이드', href: '/#guide' },
  { label: '고객센터', href: '/#guide' },
] as const

/** Hero carousel 슬라이드 데이터 */
export interface HeroSlide {
  id: string
  eyebrow: string
  titleLines: [string, { highlight: string; rest: string }]
  description: string
  ctaLabel: string
  action: 'lookup' | 'simulation' | 'travel'
}

export const heroSlides: HeroSlide[] = [
  {
    id: 'slide-overview',
    eyebrow: 'MY INSURANCE, MADE SIMPLE',
    titleLines: ['복잡한 보험,', { highlight: '안심', rest: '하고 한 번에.' }],
    description: '내 보험을 확인하고, 받을 보험금을 미리 살펴보세요.',
    ctaLabel: '내 보험 알아보기',
    action: 'lookup',
  },
  {
    id: 'slide-lookup',
    eyebrow: 'FIND YOUR POLICY IN SECONDS',
    titleLines: ['가입한 보험,', { highlight: '한눈에', rest: '모아보기.' }],
    description: '여기저기 흩어진 내 보험 정보를 한 화면에서 확인하세요.',
    ctaLabel: '내 보험 조회하기',
    action: 'lookup',
  },
  {
    id: 'slide-simulation',
    eyebrow: 'ESTIMATE BEFORE YOU CLAIM',
    titleLines: ['보험금도,', { highlight: '미리', rest: '계산해봐요.' }],
    description: '치료비를 입력하면 예상 보험금을 빠르게 계산해 드려요.',
    ctaLabel: '보험금 시뮬레이션',
    action: 'simulation',
  },
  {
    id: 'slide-travel',
    eyebrow: 'TRAVEL WITH PEACE OF MIND',
    titleLines: ['여행 일정에', { highlight: '딱 맞는', rest: '여행자 보험.' }],
    description: '여행지와 기간만 알려주시면 꼭 맞는 보험을 추천해 드려요.',
    ctaLabel: '여행자 보험 추천받기',
    action: 'travel',
  },
]

/** 보험 서비스 카드 데이터 */
export interface ServiceItem {
  id: string
  number: string
  icon: LucideIcon
  title: string
  description: string
  accent: 'coral' | 'blue' | 'mint' | 'lavender'
  action: 'lookup' | 'simulation' | 'travel' | 'coming-soon'
}

export const serviceItems: ServiceItem[] = [
  {
    id: 'lookup',
    number: '01',
    icon: FileSearch,
    title: '내 보험 조회',
    description: '가입한 보험을 한눈에 확인',
    accent: 'coral',
    action: 'lookup',
  },
  {
    id: 'simulation',
    number: '02',
    icon: Calculator,
    title: '보험금 시뮬레이션',
    description: '예상 보험금을 미리 계산',
    accent: 'blue',
    action: 'simulation',
  },
  {
    id: 'travel',
    number: '03',
    icon: Plane,
    title: '여행자 보험 추천',
    description: '여행 일정에 맞춘 보험 추천',
    accent: 'mint',
    action: 'travel',
  },
  {
    id: 'coming-soon',
    number: '04',
    icon: Sparkles,
    title: '준비 중',
    description: '더 편리한 서비스를 기다려주세요',
    accent: 'lavender',
    action: 'coming-soon',
  },
]

/** 보험금 시뮬레이션 — 보험 종류 옵션 */
export const insuranceTypeOptions = [
  { value: '실손보험', label: '실손보험' },
  { value: '건강보험', label: '건강보험' },
  { value: '여행자보험', label: '여행자 보험' },
] as const

/** 보험금 시뮬레이션 — 사고 유형 옵션 (보험 종류별) */
export const accidentTypeOptionsByInsurance: Record<
  string,
  { value: string; label: string }[]
> = {
  실손보험: [
    { value: '통원치료', label: '통원 치료' },
    { value: '입원치료', label: '입원 치료' },
    { value: '수술', label: '수술' },
  ],
  건강보험: [
    { value: '질병진단', label: '질병 진단' },
    { value: '입원치료', label: '입원 치료' },
    { value: '후유장해', label: '후유 장해' },
  ],
  여행자보험: [
    { value: '해외질병', label: '해외 질병' },
    { value: '휴대품손해', label: '휴대품 손해' },
    { value: '항공기지연', label: '항공기 지연' },
  ],
}

/** 보험금 시뮬레이션 — 가입 기간 옵션 */
export const coveragePeriodOptions = [
  { value: '1년', label: '1년' },
  { value: '3년', label: '3년' },
  { value: '5년', label: '5년' },
  { value: '10년', label: '10년' },
] as const
