'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileSearch,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth, DEMO_USERS } from '@/lib/auth-context'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'

  const { isLoggedIn, isLoading, login, quickLogin, socialLogin } = useAuth()

  const [activeTab, setActiveTab] = React.useState<'email' | 'social'>('email')
  const [email, setEmail] = React.useState('hong@ansim.ai')
  const [password, setPassword] = React.useState('1234')
  const [showPassword, setShowPassword] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')

  // 이미 로그인되어 있으면 메인 또는 returnUrl로 이동
  React.useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace(returnUrl)
    }
  }, [isLoggedIn, isLoading, router, returnUrl])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim()) {
      setErrorMessage('이메일 또는 아이디를 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await login(email, password)
      if (success) {
        router.push(returnUrl)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickLogin = async (userKey: 'hong' | 'kim' | 'lee') => {
    setIsSubmitting(true)
    try {
      const success = await quickLogin(userKey)
      if (success) {
        router.push(returnUrl)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSocialLogin = async (provider: 'kakao' | 'naver' | 'toss' | 'pass') => {
    setIsSubmitting(true)
    try {
      const success = await socialLogin(provider)
      if (success) {
        router.push(returnUrl)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFE1] text-foreground">
      {/* 상단 네비게이션 */}
      <header className="w-full px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2" aria-label="ANSIM 보험 홈으로 이동">
          <div className="flex size-9 items-center justify-center rounded-xl bg-coral text-white shadow-md shadow-coral/25">
            <Star className="size-5 fill-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-navy">
            ANSIM<span className="text-coral">보험</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <ShieldCheck className="size-4 text-mint" />
          <span className="hidden sm:inline">256-bit 금융 보안 암호화 적용</span>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 좌측: 서비스 소개 & 특장점 (데스크톱) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-coral/10 text-coral text-xs font-bold w-fit">
              <Sparkles className="size-3.5" />
              <span>금융 AI 안심(ANSIM) v2.0</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-navy leading-tight">
                복잡한 보험 약관, <br />
                <span className="text-coral">안심</span>하고 한 번에 확인하세요.
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                마이데이터로 내 가입 보험을 실시간 연동하고, 질환 및 사고 발생 시 수령 가능한 예상
                보험금을 AI 약관 엔진으로 정밀하게 시뮬레이션해 드립니다.
              </p>
            </div>

            {/* 특장점 리스트 */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/70 border border-border shadow-xs">
                <div className="flex size-8 items-center justify-center rounded-xl bg-coral/15 text-coral shrink-0 mt-0.5">
                  <FileSearch className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">흩어진 내 보험 한눈에 모아보기</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    건강보험, 4세대 실손, 여행자보험 등 내 모든 증권을 즉시 조회합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/70 border border-border shadow-xs">
                <div className="flex size-8 items-center justify-center rounded-xl bg-navy/10 text-navy shrink-0 mt-0.5">
                  <Zap className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">AI 약관 JSON 기반 정밀 계산</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    면책기간, 감액조건, 자기부담금을 반영한 오차 없는 청구 예상액을 산출합니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/70 border border-border shadow-xs">
                <div className="flex size-8 items-center justify-center rounded-xl bg-mint/20 text-mint-foreground shrink-0 mt-0.5">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">금융보안원 가이드라인 완벽 준수</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    사용자 개인정보를 철저히 암호화하여 안심하고 이용할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 로그인 카드 */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Card className="rounded-3xl border border-border bg-white shadow-xl shadow-stone-200/50 overflow-hidden">
              <CardHeader className="p-6 sm:p-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="bg-coral/10 text-coral text-xs font-bold px-2.5 py-1 rounded-full border-0">
                    회원 로그인
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    신규 회원은 로그인 시 자동 가입됩니다
                  </span>
                </div>
                <CardTitle className="text-2xl font-black text-foreground">
                  안심 보험에 오신 것을 환영합니다 👋
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                  계정 정보를 입력하거나 1-클릭 체험 계정으로 바로 시작하세요.
                </CardDescription>

                {/* 탭 전환 */}
                <div className="grid grid-cols-2 p-1 mt-4 rounded-2xl bg-secondary/60 border border-border">
                  <button
                    type="button"
                    onClick={() => setActiveTab('email')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      activeTab === 'email'
                        ? 'bg-white text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    일반 로그인
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('social')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      activeTab === 'social'
                        ? 'bg-white text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    간편 소셜 / 마이데이터
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 pt-2 space-y-6">
                {activeTab === 'email' ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold text-foreground">
                        이메일 또는 아이디
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@ansim.ai"
                          className="pl-10 h-11 rounded-xl text-sm border-border bg-secondary/20 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-xs font-bold text-foreground">
                          비밀번호
                        </Label>
                        <span className="text-[11px] text-coral hover:underline cursor-pointer">
                          비밀번호 찾기
                        </span>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11 rounded-xl text-sm border-border bg-secondary/20 focus:bg-white"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-border text-coral focus:ring-coral size-4"
                        />
                        <span className="text-xs text-muted-foreground">로그인 상태 유지</span>
                      </label>
                      <span className="text-xs text-muted-foreground">
                        보안 접속 중 🔒
                      </span>
                    </div>

                    {errorMessage && (
                      <p className="text-xs font-semibold text-destructive bg-destructive/10 p-2.5 rounded-xl">
                        {errorMessage}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-2xl bg-coral hover:bg-coral/90 text-white font-bold text-sm shadow-lg shadow-coral/25 transition duration-150"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          로그인 중...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>로그인하고 메인으로 이동</span>
                          <ArrowRight className="size-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                ) : (
                  /* 간편 소셜 / 마이데이터 탭 */
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('kakao')}
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-2xl bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99]"
                    >
                      <span className="text-base font-black">💬</span>
                      카카오 1초 간편 로그인
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialLogin('naver')}
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-2xl bg-[#03C75A] hover:bg-[#03C75A]/90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99]"
                    >
                      <span className="text-base font-black">N</span>
                      네이버 아이디로 로그인
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialLogin('toss')}
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-2xl bg-[#0064FF] hover:bg-[#0064FF]/90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.99]"
                    >
                      <span className="text-base font-black"> Toss </span>
                      토스 마이데이터로 1초 인증
                    </button>
                  </div>
                )}

                {/* 🚀 심사위원 / 평가자 1-클릭 체험 로그인 섹션 */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-navy flex items-center gap-1.5">
                      <UserCheck className="size-3.5 text-coral" />
                      심사위원 / 평가자 원클릭 체험 계정
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-secondary/50 text-muted-foreground border-border">
                      클릭 즉시 로그인
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('hong')}
                      disabled={isSubmitting}
                      className="text-left p-3 rounded-2xl border border-coral/30 bg-coral/5 hover:bg-coral/10 hover:border-coral transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-coral text-white font-bold text-xs">
                          홍
                        </div>
                        <div>
                          <div className="text-xs font-black text-foreground flex items-center gap-1">
                            홍길동
                            <span className="text-[10px] text-coral font-normal">(추천)</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            보유 보험 3건 (건강/실손/여행자)
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 text-coral group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('kim')}
                      disabled={isSubmitting}
                      className="text-left p-3 rounded-2xl border border-border bg-secondary/30 hover:bg-secondary/70 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-mint text-mint-foreground font-bold text-xs">
                          김
                        </div>
                        <div>
                          <div className="text-xs font-black text-foreground">
                            김안심
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            보유 보험 2건 (실손/건강)
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 하단 금융 보안 안내 문구 */}
            <div className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-mint" />
              <span>
                본 서비스는 금융보안 표준을 준수하며, 로그인 후 맞춤형 약관 시뮬레이션을 제공합니다.
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 심플 푸터 */}
      <footer className="w-full py-4 text-center text-xs text-muted-foreground border-t border-border/60 bg-white/40">
        &copy; {new Date().getFullYear()} ANSIM Insurance Inc. All rights reserved.
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFDF9]">
          <div className="flex items-center gap-2 text-sm font-bold text-navy animate-pulse">
            <span className="size-2 rounded-full bg-coral animate-ping" />
            안심 보험 로그인 페이지를 불러오는 중...
          </div>
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  )
}
