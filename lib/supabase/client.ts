import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * ANSIM 보험 — Supabase 브라우저 클라이언트
 *
 * 아직 Supabase 프로젝트가 연결되지 않았거나 환경변수가 비어 있어도
 * 앱이 오류 없이 동작해야 하므로, 클라이언트 생성 자체를 지연시키고
 * `isSupabaseConfigured()`로 연결 여부를 먼저 확인한 뒤 사용합니다.
 *
 * 실제 연동 시에는 `.env.local`에
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 값을 채워주세요.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** 환경변수가 모두 채워져 있는지 여부 (mock 데이터 fallback 판단용) */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

let cachedClient: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Supabase 브라우저 클라이언트를 반환합니다.
 * 환경변수가 없으면 null을 반환하므로, 호출하는 쪽에서는
 * 항상 null 체크 후 mock 데이터로 fallback 해야 합니다.
 */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!cachedClient) {
    cachedClient = createBrowserClient<Database>(supabaseUrl as string, supabaseAnonKey as string)
  }

  return cachedClient
}
