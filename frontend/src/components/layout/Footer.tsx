import Link from "next/link";
import { Instagram } from "lucide-react";

const INSTAGRAM_URL =
  "https://www.instagram.com/al._.maeng?igsh=a3BwejJscXNnaDN0";

const TMDB_URL = "https://www.themoviedb.org/?language=ko";

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
              TEAM. 알맹이
            </span>
          </div>
          <p className="max-w-md text-[11px] font-medium leading-relaxed text-gray-400">
            우리는 당신의 독서 취향을 발견하고, 소중한 독서의 순간을 기록하는
            공간을 만듭니다.
            <br />
            모든 책의 알맹이를 찾아 떠나는 여정에 함께하세요.
          </p>
        </section>

        {/* ── 데이터 출처 & 연락처 ── */}
        <aside
          className="flex flex-col gap-6 text-right md:items-end"
          aria-label="데이터 출처 및 연락처"
        >
          {/* 데이터 출처 */}
          <section aria-label="데이터 출처">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
              Data Source
            </p>
            <div className="flex flex-col items-end gap-1.5 text-xs font-medium text-gray-500">
              <Link
                href="https://www.aladin.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="알라딘 인터넷서점 새 탭으로 열기"
                className="underline decoration-black/10 underline-offset-4 transition-all hover:text-[#0033FF] hover:decoration-[#0033FF]"
              >
                알라딘 인터넷서점(www.aladin.co.kr)
              </Link>
              <Link
                href={TMDB_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="The Movie Database 새 탭으로 열기"
                className="underline decoration-black/10 underline-offset-4 transition-all hover:text-[#0033FF] hover:decoration-[#0033FF]"
              >
                TMDB: The Movie Database
              </Link>
            </div>
          </section>

          {/* SNS */}
          <section aria-label="인스타그램">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">
              Contact
            </p>
            <Link
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram @al._.maeng 새 탭으로 열기"
              className="group flex items-center gap-2 text-xs font-medium text-gray-500 transition-colors hover:text-[#0033FF]"
            >
              <Instagram
                size={14}
                aria-hidden="true"
                className="text-gray-300 group-hover:text-[#0033FF]"
              />
              <span>@al._.maeng</span>
            </Link>
          </section>
        </aside>
      </div>

      {/* ── 하단 바: 저작권 ── */}
      <div className="mx-auto mt-12 max-w-7xl border-t border-black/5 pt-8">
        <small className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
          © 2026 AL-MAENG TEAM. ALL RIGHTS RESERVED.
        </small>
      </div>
    </footer>
  );
}
