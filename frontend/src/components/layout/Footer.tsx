import Link from "next/link";
import { Mail } from "lucide-react";

/** 저작권/법적 링크 목록 */
const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy", external: false },
  { label: "Terms", href: "/terms", external: false },
  { label: "Instagram", href: "https://www.instagram.com", external: true },
] as const;

export default function Footer() {
  return (
    <footer
      className="w-full bg-white border-t border-black/5 py-12 px-6 md:px-12 mt-20 pb-32 md:pb-12"
      aria-label="사이트 푸터"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

        {/* ── 브랜드 소개 ── */}
        <section aria-label="브랜드 소개">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/"
              className="font-black text-xl tracking-tighter uppercase italic hover:text-[#0033FF] transition-colors"
              aria-label="Al-Maeng 홈으로 이동"
            >
              Al-Maeng
            </Link>
            <span className="w-px h-4 bg-black/10" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              알맹이 팀
            </span>
          </div>
          <p className="text-[11px] font-medium text-gray-400 leading-relaxed max-w-md">
            우리는 당신의 독서 취향을 발견하고, 소중한 독서의 순간을 기록하는
            공간을 만듭니다. 모든 책의 알맹이를 찾아 떠나는 여정에 함께하세요.
          </p>
        </section>

        {/* ── 데이터 출처 & 연락처 ── */}
        <aside
          className="flex flex-col gap-6 text-right md:items-end"
          aria-label="데이터 출처 및 연락처"
        >
          {/* 데이터 출처 */}
          <section aria-label="도서 데이터 출처">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">
              Data Source
            </p>
            <p className="text-xs font-medium text-gray-500">
              도서 DB 제공 :{" "}
              <Link
                href="https://www.aladin.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="알라딘 인터넷서점 새 탭으로 열기"
                className="hover:text-[#0033FF] underline underline-offset-4 decoration-black/10 hover:decoration-[#0033FF] transition-all"
              >
                알라딘 인터넷서점(www.aladin.co.kr)
              </Link>
            </p>
          </section>

          {/* 연락처 */}
          <section aria-label="연락처">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">
              Contact & Support
            </p>
            <Link
              href="mailto:contact@al-maeng.com"
              aria-label="이메일로 문의하기"
              className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-[#0033FF] transition-colors group"
            >
              <Mail
                size={14}
                aria-hidden="true"
                className="text-gray-300 group-hover:text-[#0033FF]"
              />
              <span>contact@al-maeng.com</span>
            </Link>
          </section>
        </aside>
      </div>

      {/* ── 하단 바: 저작권 & 법적 링크 ── */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-black/5 flex justify-between items-center">
        <small className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
          © 2026 AL-MAENG TEAM. ALL RIGHTS RESERVED.
        </small>

        <nav aria-label="법적 링크">
          <ul className="flex gap-6 list-none">
            {LEGAL_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  aria-label={
                    item.external
                      ? `${item.label} 새 탭으로 열기`
                      : item.label
                  }
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hover:text-black transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
