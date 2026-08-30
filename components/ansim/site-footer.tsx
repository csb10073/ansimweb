import { Star } from 'lucide-react'

const footerColumns = [
  {
    heading: '서비스',
    links: ['내 보험 조회', '보험금 시뮬레이션', '여행자 보험 추천', '보험 가이드'],
  },
  {
    heading: '회사',
    links: ['회사 소개', '채용 정보', '보도자료', '파트너 제휴'],
  },
  {
    heading: '고객지원',
    links: ['자주 묻는 질문', '이용 약관', '개인정보처리방침', '고객센터'],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Star className="size-4 fill-coral text-coral" aria-hidden="true" />
              <span className="text-lg font-black tracking-tight text-navy">
                ANSIM<span className="text-coral">보험</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              내게 꼭 맞는 보험을, 안심하고 쉽게.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-foreground">{column.heading}</h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#top"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            (주)안심보험서비스 · 대표 홍길동 · 사업자등록번호 123-45-67890 · 서울특별시 강남구
            테헤란로 123
          </p>
          <p>&copy; {new Date().getFullYear()} ANSIM Insurance. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
