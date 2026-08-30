'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Star } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoggedIn, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      // 로그인되지 않았으면 로그인 페이지로 이동
      const returnUrl = encodeURIComponent(pathname)
      router.replace(`/login?returnUrl=${returnUrl}`)
    }
  }, [isLoggedIn, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-coral text-white shadow-lg shadow-coral/30">
              <Star className="size-6 fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-navy">
              ANSIM<span className="text-coral">보험</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className="size-2 rounded-full bg-coral animate-ping" />
            인증 상태를 확인하고 있습니다...
          </div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return <>{children}</>
}
