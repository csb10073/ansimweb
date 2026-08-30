'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  joinedDate?: string
  activePoliciesCount?: number
  avatarColor?: string
}

export const DEMO_USERS: Record<string, User> = {
  hong: {
    id: 'user_hong_01',
    name: '홍길동',
    email: 'hong@ansim.ai',
    phone: '010-1234-5678',
    joinedDate: '2024.01.10',
    activePoliciesCount: 3,
    avatarColor: 'bg-coral text-white',
  },
  kim: {
    id: 'user_kim_02',
    name: '김안심',
    email: 'kim@ansim.ai',
    phone: '010-9876-5432',
    joinedDate: '2025.03.15',
    activePoliciesCount: 2,
    avatarColor: 'bg-mint text-mint-foreground',
  },
  lee: {
    id: 'user_lee_03',
    name: '이금융',
    email: 'lee@ansim.ai',
    phone: '010-5555-7777',
    joinedDate: '2025.08.01',
    activePoliciesCount: 1,
    avatarColor: 'bg-navy text-white',
  },
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isLoggedIn: boolean
  login: (email: string, password?: string, customName?: string) => Promise<boolean>
  quickLogin: (userKey: 'hong' | 'kim' | 'lee') => Promise<boolean>
  socialLogin: (provider: 'kakao' | 'naver' | 'toss' | 'pass') => Promise<boolean>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'ansim_auth_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  // 초기 localStorage에서 로그인 정보 로드
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setUser(parsed)
      }
    } catch (e) {
      console.error('Failed to parse stored auth user', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, _password?: string, customName?: string): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 400))

    const matchedKey = Object.keys(DEMO_USERS).find(
      (k) => DEMO_USERS[k].email.toLowerCase() === email.toLowerCase(),
    )

    let loggedInUser: User
    if (matchedKey) {
      loggedInUser = DEMO_USERS[matchedKey]
    } else {
      const displayName = customName || email.split('@')[0] || '안심고객'
      loggedInUser = {
        id: `user_${Date.now()}`,
        name: displayName,
        email,
        phone: '010-0000-0000',
        joinedDate: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
        activePoliciesCount: 3,
        avatarColor: 'bg-coral text-white',
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser))
      setUser(loggedInUser)
      toast.success(`${loggedInUser.name}님 환영합니다!`, {
        description: '안심 AI 보험 서비스에 정상 로그인되었습니다.',
      })
      return true
    } catch (e) {
      console.error('Failed to save auth state', e)
      toast.error('로그인 처리 중 오류가 발생했습니다.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const quickLogin = async (userKey: 'hong' | 'kim' | 'lee'): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 350))

    const target = DEMO_USERS[userKey] || DEMO_USERS.hong
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(target))
      setUser(target)
      toast.success(`${target.name}님으로 로그인되었습니다.`, {
        description: '마이데이터 보유 보험 정보가 동기화되었습니다.',
      })
      return true
    } catch (e) {
      console.error(e)
      toast.error('체험 로그인 실패')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const socialLogin = async (provider: 'kakao' | 'naver' | 'toss' | 'pass'): Promise<boolean> => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 450))

    const providerNames: Record<string, string> = {
      kakao: '카카오',
      naver: '네이버',
      toss: '토스',
      pass: 'PASS',
    }

    const demoUser = DEMO_USERS.hong
    const socialUser: User = {
      ...demoUser,
      id: `${provider}_user_${Date.now()}`,
      name: `${demoUser.name} (${providerNames[provider]})`,
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(socialUser))
      setUser(socialUser)
      toast.success(`${providerNames[provider]} 간편 로그인 완료!`, {
        description: '마이데이터 보험 증권이 자동으로 연동되었습니다.',
      })
      return true
    } catch (e) {
      console.error(e)
      toast.error('간편 로그인 실패')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
      toast.info('로그아웃되었습니다.')
      router.replace('/login')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: Boolean(user),
        login,
        quickLogin,
        socialLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
