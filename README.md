# 🛡️ ANSIM (안심) — AI 기반 금융/보험 정밀 분석 & 시뮬레이션 서비스

AI 기반으로 가입된 보험 약관을 분석하고, 사고/청구 상황에 따른 예상 보험금을 정밀하게 시뮬레이션하는 웹 플랫폼입니다.

---

## 📌 주요 기능

1. **📋 내 보험 조회 및 약관 분석**
   - 가입된 보험 상품별 보장 범위, 보장 한도, 약관 상세 정보 확인
   - 약관 조건 대조(Claim Condition Comparator)를 통한 맞춤형 보장 분석

2. **⚙️ 보험금 정밀 시뮬레이터**
   - 보험 종류, 사고 유형, 청구 금액, 가입 기간을 기반으로 예상 보험금 산출
   - 지급 한도 및 보장 비율 가중치를 반영한 실시간 시뮬레이션 리포트 생성

3. **📊 복수 보험 비교 리포트**
   - 여러 보험 상품의 중복 보장 및 보장 공백을 시각적으로 비교

4. **🔐 유연한 백엔드 아키텍처 (Supabase & Mock 지원)**
   - Supabase 미연동 환경에서도 Mock 데이터로 모든 UI와 시뮬레이션 기능이 완전하게 동작
   - Supabase 연동 시 데이터베이스(`insurance_products`, `insurance_simulations`) 및 인증 시스템 자동 활성화

---

## 🛠️ 기술 스택 (Tech Stack)

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Lucide Icons, Sonner
- **Backend / Database**: [Supabase](https://supabase.com/) (선택 사항)

---

## 🚀 시작하기 (Getting Started)

### 1. 패키지 설치
```bash
# pnpm 사용 시
pnpm install

# 또는 npm 사용 시
npm install
```

### 2. 환경 변수 설정 (선택 사항)
Supabase와 연동하려면 `.env.local.example` 파일을 복사하여 `.env.local`을 생성하고 키를 입력합니다.  
*(값을 비워두면 자동으로 Mock 데이터 모드로 동작합니다.)*

```bash
cp .env.local.example .env.local
```

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 개발 서버 실행
```bash
# pnpm
pnpm dev

# npm
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

---

## 🔒 보안 및 환경 변수 관리

- `.env`, `.env*.local` 등 민감한 API 키와 환경 변수 파일은 [`.gitignore`](.gitignore)에 등록되어 버전 관리 시스템(Git)에 커밋되지 않습니다.
- Supabase의 `SERVICE_ROLE_KEY`와 같은 관리자 키는 절대 클라이언트에 노출하지 마세요.

---

## 📁 프로젝트 구조

```text
├── app/                  # Next.js App Router (페이지 및 레이아웃)
│   ├── layout.tsx        # 루트 레이아웃 & 테마 설정
│   ├── page.tsx          # 메인 대시보드 페이지
│   ├── login/            # 로그인 페이지
│   └── simulation/       # 보험금 시뮬레이션 상세 페이지
├── components/           # UI 컴포넌트
│   ├── ansim/            # 안심 서비스 도메인 컴포넌트 (모달, 리포트 카드, 그리드 등)
│   ├── auth/             # 인증 및 가드 컴포넌트
│   └── ui/               # 공통 UI 컴포넌트 (Button, Dialog, Card 등)
├── lib/                  # 유틸리티 및 비즈니스 로직
│   ├── data/             # Mock 데이터 및 보험 약관 시나리오
│   ├── policy-engine.ts  # 약관 분석 및 보장 매칭 엔진
│   ├── simulation.ts     # 보험금 계산 시뮬레이터 로직
│   └── supabase/         # Supabase 클라이언트 설정
└── types/                # TypeScript 타입 정의
```
