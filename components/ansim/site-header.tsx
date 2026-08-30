'use client'

import * as React from 'react'
import { LogIn, LogOut, Menu, Search, Star, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { navLinks } from '@/lib/data/insurance'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface SiteHeaderProps {
  onOpenLookup?: () => void
  onOpenSimulation?: () => void
}

export function SiteHeader({ onOpenLookup, onOpenSimulation }: SiteHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoggedIn, logout } = useAuth()
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (label: string, href: string, e: React.MouseEvent) => {
    if (label === '보험 조회') {
      if (onOpenLookup) {
        e.preventDefault()
        onOpenLookup()
        return
      }
      e.preventDefault()
      router.push('/?action=lookup')
      return
    }

    if (pathname === '/' && href.startsWith('/#')) {
      e.preventDefault()
      const targetId = href.replace('/#', '')
      const el = document.getElementById(targetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-shadow duration-200',
        isScrolled
          ? 'bg-background/95 shadow-sm backdrop-blur-sm'
          : 'bg-background/80 backdrop-blur-sm',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-1.5" aria-label="ANSIM 보험 홈으로 이동">
          <Star className="size-4 fill-coral text-coral" aria-hidden="true" />
          <span className="text-lg font-black tracking-tight text-navy">
            ANSIM<span className="text-coral">보험</span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="주요 메뉴"
        >
          <Link
            href="/simulation"
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-bold transition-colors',
              pathname === '/simulation'
                ? 'text-navy underline underline-offset-4 decoration-coral decoration-2'
                : 'text-coral hover:text-coral/80',
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-coral"></span>
            </span>
            보험금 정밀 시뮬레이터
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(link.label, link.href, e)}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground cursor-pointer"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* 사용자 로그인 상태 영역 (데스크톱) */}
          {isLoggedIn && user ? (
            <div className="hidden sm:flex items-center gap-2 bg-secondary/50 border border-border/80 pl-2.5 pr-1.5 py-1 rounded-full text-xs">
              <div className="flex size-6 items-center justify-center rounded-full bg-coral text-white font-bold text-[10px]">
                {user.name.charAt(0)}
              </div>
              <span className="font-bold text-foreground">
                {user.name} 님
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-6 px-2 rounded-full text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="로그아웃"
              >
                <LogOut className="size-3 mr-1" />
                로그아웃
              </Button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:inline-flex">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full text-xs font-bold px-3 border-coral/40 text-coral hover:bg-coral/10"
              >
                <LogIn className="size-3.5 mr-1" />
                로그인
              </Button>
            </Link>
          )}

          <Button variant="ghost" size="icon" aria-label="검색">
            <Search className="size-4" />
          </Button>

          {/* 모바일 메뉴 시트 */}
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" />}
              aria-label="메뉴 열기"
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>ANSIM 보험 메뉴</SheetTitle>
              </SheetHeader>

              {/* 모바일 사용자 프로필 카드 */}
              <div className="px-4 py-3 my-2 rounded-2xl bg-secondary/60 border border-border">
                {isLoggedIn && user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-full bg-coral text-white font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-black text-foreground">{user.name} 님</div>
                        <div className="text-[10px] text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <SheetClose
                      render={
                        <button
                          type="button"
                          onClick={logout}
                          className="text-[11px] font-bold text-destructive hover:underline p-1"
                        />
                      }
                    >
                      로그아웃
                    </SheetClose>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">로그인이 필요합니다</span>
                    <SheetClose
                      render={
                        <Link
                          href="/login"
                          className="text-xs font-bold text-coral hover:underline p-1"
                        />
                      }
                    >
                      로그인하기 →
                    </SheetClose>
                  </div>
                )}
              </div>

              <nav className="flex flex-col gap-1 px-4" aria-label="모바일 메뉴">
                <SheetClose
                  render={
                    <Link
                      href="/simulation"
                      className="rounded-lg px-3 py-3 text-base font-bold text-coral transition-colors hover:bg-coral/10"
                    />
                  }
                >
                  ✨ 보험금 정밀 시뮬레이터
                </SheetClose>
                {navLinks.map((link) => (
                  <SheetClose
                    key={link.label}
                    render={
                      <Link
                        href={link.href}
                        onClick={(e) => handleNavClick(link.label, link.href, e)}
                        className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent cursor-pointer"
                      />
                    }
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
