'use client'

import * as React from 'react'
import {
  CANDIDATE_EXTRA_POLICIES,
  getDefaultPoliciesForUser,
  getLastSyncTime,
  getStoredUserPolicies,
  getUserStorageKey,
  resetStoredUserPolicies,
  saveStoredUserPolicies,
  USER_POLICIES_CHANGE_EVENT,
} from '@/lib/data/user-policies'
import type { UserEnrolledPolicy } from '@/types/policy'
import { useAuth } from '@/lib/auth-context'

export function useUserPolicies() {
  const { user } = useAuth()
  const [policies, setPoliciesState] = React.useState<UserEnrolledPolicy[]>(() =>
    getStoredUserPolicies(user),
  )
  const [lastSyncTime, setLastSyncTimeState] = React.useState<string>('실시간 연동됨')
  const [isSyncing, setIsSyncing] = React.useState(false)

  // 로그인된 유저가 변경되거나 초기 마운트 시 해당 계정의 보험 목록 로드
  React.useEffect(() => {
    const initialPolicies = getStoredUserPolicies(user)
    setPoliciesState(initialPolicies)
    setLastSyncTimeState(getLastSyncTime(user))

    // 이벤트 리스너 등록
    const handlePolicyChange = (e: Event) => {
      const customEvent = e as CustomEvent<{
        policies: UserEnrolledPolicy[]
        lastSyncTime: string
        userId?: string
      }>
      if (customEvent.detail) {
        // 현재 사용자의 이벤트이거나 전역 이벤트인 경우 반영
        if (!customEvent.detail.userId || customEvent.detail.userId === user?.id) {
          if (customEvent.detail.policies) {
            setPoliciesState(customEvent.detail.policies)
          }
          if (customEvent.detail.lastSyncTime) {
            setLastSyncTimeState(customEvent.detail.lastSyncTime)
          }
        }
      }
    }

    const handleStorage = (e: StorageEvent) => {
      const targetKey = getUserStorageKey(user?.id)
      if (e.key === targetKey) {
        setPoliciesState(getStoredUserPolicies(user))
        setLastSyncTimeState(getLastSyncTime(user))
      }
    }

    window.addEventListener(USER_POLICIES_CHANGE_EVENT, handlePolicyChange)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(USER_POLICIES_CHANGE_EVENT, handlePolicyChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [user?.id, user?.name])

  // 전체 교체 저장
  const updatePolicies = React.useCallback(
    (newPolicies: UserEnrolledPolicy[]) => {
      setPoliciesState(newPolicies)
      saveStoredUserPolicies(newPolicies, user)
      setLastSyncTimeState(getLastSyncTime(user))
    },
    [user],
  )

  // 단일 보험 추가
  const addPolicy = React.useCallback(
    (newPolicy: UserEnrolledPolicy) => {
      setPoliciesState((prev) => {
        // 중복 방지
        if (prev.some((p) => p.contract_id === newPolicy.contract_id)) {
          return prev
        }
        const updated = [newPolicy, ...prev]
        saveStoredUserPolicies(updated, user)
        return updated
      })
      setLastSyncTimeState(getLastSyncTime(user))
    },
    [user],
  )

  // 단일 보험 삭제
  const removePolicy = React.useCallback(
    (contractId: string) => {
      setPoliciesState((prev) => {
        const updated = prev.filter((p) => p.contract_id !== contractId)
        saveStoredUserPolicies(updated, user)
        return updated
      })
      setLastSyncTimeState(getLastSyncTime(user))
    },
    [user],
  )

  // 단일 보험 수정 (예: 월 보험료, 상태 등)
  const updatePolicyItem = React.useCallback(
    (contractId: string, patch: Partial<UserEnrolledPolicy>) => {
      setPoliciesState((prev) => {
        const updated = prev.map((p) => (p.contract_id === contractId ? { ...p, ...patch } : p))
        saveStoredUserPolicies(updated, user)
        return updated
      })
      setLastSyncTimeState(getLastSyncTime(user))
    },
    [user],
  )

  // 기본값 리셋 (현재 계정의 기본 증권으로 복원)
  const resetToDefault = React.useCallback(() => {
    const res = resetStoredUserPolicies(user)
    setPoliciesState(res)
    setLastSyncTimeState(getLastSyncTime(user))
    return res
  }, [user])

  // 실시간 마이데이터 연동 시뮬레이션
  const syncWithMyData = React.useCallback(async () => {
    setIsSyncing(true)
    try {
      // 1.2초간 금융사 통신 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1200))

      const current = getStoredUserPolicies(user)
      // 아직 등록되지 않은 후보 보험 중 1개를 신규 가입 건으로 감지하여 자동 편입
      const candidateToAdd = CANDIDATE_EXTRA_POLICIES.find(
        (cand) => !current.some((c) => c.policy_id === cand.policy_id),
      )

      let updatedList = [...current]
      let addedCount = 0

      if (candidateToAdd) {
        const customCandidate = {
          ...candidateToAdd,
          insured_name: user?.name || '홍길동',
        }
        updatedList = [customCandidate, ...current]
        addedCount = 1
      } else {
        // 이미 모든 후보가 다 들어있다면, 가입일자와 보험료를 최신 동기화 처리
        updatedList = current.map((p) => ({
          ...p,
          status: 'ACTIVE' as const,
        }))
      }

      saveStoredUserPolicies(updatedList, user)
      setPoliciesState(updatedList)
      setLastSyncTimeState(getLastSyncTime(user))

      return {
        success: true,
        addedCount,
        message:
          addedCount > 0
            ? `마이데이터 실시간 연동 완료: 신규 계약 [${candidateToAdd?.policy_document.product_name}] 1건이 새롭게 반영되었습니다!`
            : '마이데이터 실시간 연동 완료: 현재 가입 중인 모든 보험 계약 정보가 최신으로 동기화되었습니다.',
      }
    } finally {
      setIsSyncing(false)
    }
  }, [user])

  return {
    policies,
    lastSyncTime,
    isSyncing,
    updatePolicies,
    addPolicy,
    removePolicy,
    updatePolicyItem,
    resetToDefault,
    syncWithMyData,
  }
}
