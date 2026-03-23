"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { User, LogOut, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import useAuthStore from "@/store/useAuthStore";
import { logout as logoutApi } from "@/api/auth";

/** 메인 네비게이션 항목 정의 */
const NAV_ITEMS = [
  { id: "home", label: "홈", href: "/" },
  { id: "wizard", label: "취향 찾기", href: "/wizard" },
  { id: "library", label: "갤러리", href: "/library" },
] as const;

/** 현재 pathname → 활성 navItem id 반환 */
function getActiveId(pathname: string): string {
  if (pathname === "/") return "home";
  const matched = NAV_ITEMS.find(
    (item) => item.href !== "/" && pathname.startsWith(item.href)
  );
  return matched?.id ?? "";
}

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const activeId = getActiveId(pathname);

  const { isLoggedIn, user, logout } = useAuthStore();

  /* 드롭다운 외부 클릭 시 닫기 */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // 1. 백엔드 로그아웃 API 호출 (성공/실패 여부와 상관없이 진행)
      await logoutApi();
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      // 2. 프론트엔드 상태 및 로컬 스토리지 비우기
      logout();
      setIsDropdownOpen(false);
    }
  };

  /** 로고 클릭: 검색 오버레이가 열려 있으면 닫아주는 이벤트 발행 */
  const handleLogoClick = () => {
    window.dispatchEvent(new CustomEvent("closeSearchOverlay"));
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md z-40 border-b border-black/10">
      <div className="max-w-7xl mx-auto w-full h-full flex justify-between items-center px-6 md:px-12">

        {/* ── 로고 (텍스트 로고: 최상위 페이지에서는 h1, 나머지는 strong) ── */}
        {pathname === "/" ? (
          <h1 className="m-0 leading-none flex items-center">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="font-black text-2xl tracking-tighter uppercase italic hover:text-[#0033FF] transition-colors shrink-0 leading-none"
              aria-label="Al-Maeng 홈으로 이동"
            >
              Al-Maeng
            </Link>
          </h1>
        ) : (
          <strong className="leading-none flex items-center">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="font-black text-2xl tracking-tighter uppercase italic hover:text-[#0033FF] transition-colors shrink-0"
              aria-label="Al-Maeng 홈으로 이동"
            >
              Al-Maeng
            </Link>
          </strong>
        )}

        <div className="flex items-center gap-8">
          {/* ── PC 네비게이션 ── */}
          <nav aria-label="주요 메뉴" className="flex items-center">
            <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
              {NAV_ITEMS.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id} className="flex items-center">
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={clsx(
                        "flex items-center leading-none text-xs font-bold uppercase tracking-widest transition-colors hover:text-[#0033FF] whitespace-nowrap",
                        isActive ? "text-[#0033FF]" : "text-black"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ── 유저 영역 ── */}
          <div
            className="flex items-center gap-4 shrink-0 relative"
            ref={dropdownRef}
          >
            {isLoggedIn ? (
              <>
                {/* 프로필 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={isDropdownOpen}
                  aria-label="사용자 메뉴 열기"
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 overflow-hidden",
                    pathname.startsWith("/mypage") || isDropdownOpen
                      ? "border-[#0033FF] bg-[#0033FF]/10 text-[#0033FF]"
                      : "border-black/10 hover:border-black text-black"
                  )}
                >
                  {user?.profileImageUrl ? (
                    /**
                     * 프로필 이미지는 외부(Google 등) URL이므로 <img> 사용.
                     * next.config.ts의 images.remotePatterns에 도메인 추가 후
                     * next/image로 교체 가능.
                     */
                    <img
                      src={user.profileImageUrl}
                      alt={`${user.nickname} 프로필 사진`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={18} aria-hidden="true" />
                  )}
                </button>

                {/* 드롭다운 메뉴 */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      role="menu"
                      aria-label="계정 메뉴"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white border border-black/10 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <ul className="py-1 list-none">
                        {/* 마이페이지 */}
                        <li role="none">
                          <Link
                            href="/mypage"
                            role="menuitem"
                            onClick={() => setIsDropdownOpen(false)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                          >
                            <Settings
                              size={16}
                              aria-hidden="true"
                              className="text-gray-400 group-hover:text-[#0033FF]"
                            />
                            <span className="text-xs font-bold uppercase tracking-widest text-black group-hover:text-[#0033FF]">
                              마이페이지
                            </span>
                          </Link>
                        </li>

                        <li role="none" aria-hidden="true">
                          <div className="h-px bg-black/5 mx-2" />
                        </li>

                        {/* 회원정보 수정 */}
                        <li role="none">
                          <Link
                            href="/mypage/edit"
                            role="menuitem"
                            onClick={() => setIsDropdownOpen(false)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                          >
                            <User
                              size={16}
                              aria-hidden="true"
                              className="text-gray-400 group-hover:text-[#0033FF]"
                            />
                            <span className="text-xs font-bold uppercase tracking-widest text-black group-hover:text-[#0033FF]">
                              회원정보수정
                            </span>
                          </Link>
                        </li>

                        <li role="none" aria-hidden="true">
                          <div className="h-px bg-black/5 mx-2" />
                        </li>

                        {/* 로그아웃 */}
                        <li role="none">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                            aria-label="로그아웃"
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors group"
                          >
                            <LogOut
                              size={16}
                              aria-hidden="true"
                              className="text-gray-400 group-hover:text-red-500"
                            />
                            <span className="text-xs font-bold uppercase tracking-widest text-black group-hover:text-red-500">
                              로그아웃
                            </span>
                          </button>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              /* 비로그인 상태 */
              <Link
                href="/login"
                aria-label="로그인 페이지로 이동"
                className="flex items-center leading-none text-xs font-bold tracking-widest hover:text-[#0033FF] transition-colors"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
