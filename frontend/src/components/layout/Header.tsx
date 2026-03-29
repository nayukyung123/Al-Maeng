"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { User, LogOut, Settings, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import useAuthStore from "@/store/useAuthStore";
import useToastStore from "@/store/useToastStore";
import { useAuthStoreHydrated } from "@/hooks/useAuthStoreHydrated";
import { logout as logoutApi } from "@/api/auth";
import { fetchMyProfile } from "@/api/mypage";
import { displayProfileImageUrl } from "@/lib/profileImageUrl";

/** 메인 네비게이션 항목 정의 */
const NAV_ITEMS = [
    { id: "home", label: "홈", href: "/" },
    { id: "wizard", label: "취향 찾기", href: "/discover" },
    { id: "tickets", label: "나의 티켓", href: "/tickets" },
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
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [mobileNavMounted, setMobileNavMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const activeId = getActiveId(pathname);

    const authHydrated = useAuthStoreHydrated();
    const { isLoggedIn, user, logout, updateUser } = useAuthStore();
    const { addToast } = useToastStore();
    const headerProfileImageSrc = displayProfileImageUrl(user?.profileImageUrl);

    /** 로그인 응답에 프로필이 없어 store만으로는 이미지/닉네임이 비는 경우 — 서버 프로필과 맞춤 */
    useEffect(() => {
        if (!authHydrated || !isLoggedIn) return;
        let cancelled = false;
        (async () => {
            try {
                const profile = await fetchMyProfile();
                if (cancelled) return;
                updateUser({
                    nickname: profile.nickname,
                    profileImageUrl:
                        displayProfileImageUrl(profile.profileImageUrl) ?? undefined,
                });
            } catch {
                // 401 등은 axios 인터셉터가 처리; 그 외는 무시
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [authHydrated, isLoggedIn, updateUser]);

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

    useEffect(() => {
        setMobileNavMounted(true);
    }, []);

    useEffect(() => {
        setIsMobileNavOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isMobileNavOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsMobileNavOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [isMobileNavOpen]);

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
            addToast("성공적으로 로그아웃되었습니다.", "success");
            router.push("/");
        }
    };

    /** 로고 클릭: 검색 오버레이가 열려 있으면 닫아주는 이벤트 발행 */
    const handleLogoClick = () => {
        window.dispatchEvent(new CustomEvent("closeSearchOverlay"));
        setIsMobileNavOpen(false);
    };

    const mobileNavPortal =
        mobileNavMounted &&
        createPortal(
            <AnimatePresence>
                {isMobileNavOpen && (
                    <>
                        <motion.button
                            type="button"
                            key="nav-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[100] bg-black/40 md:hidden"
                            aria-label="메뉴 닫기"
                            onClick={() => setIsMobileNavOpen(false)}
                        />
                        <motion.div
                            id="mobile-nav-panel"
                            key="nav-panel"
                            role="dialog"
                            aria-modal="true"
                            aria-label="주요 메뉴"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            className="fixed top-0 right-0 z-[110] h-full w-[min(88vw,300px)] bg-white border-l border-black/10 shadow-[-8px_0_32px_rgba(0,0,0,0.08)] md:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between h-16 px-5 border-b border-black/10 shrink-0">
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                                    Menu
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="flex items-center justify-center w-10 h-10 rounded-full border border-black/10 text-gray-600 hover:bg-black hover:text-white transition-colors"
                                    aria-label="메뉴 닫기"
                                >
                                    <X size={20} strokeWidth={2} aria-hidden="true" />
                                </button>
                            </div>
                            <nav className="flex-1 overflow-y-auto py-6 px-4" aria-label="주요 메뉴">
                                <ul className="list-none m-0 p-0 space-y-1">
                                    {NAV_ITEMS.map((item) => {
                                        const isActive = activeId === item.id;
                                        return (
                                            <li key={item.id}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsMobileNavOpen(false)}
                                                    aria-current={isActive ? "page" : undefined}
                                                    className={clsx(
                                                        "block px-4 py-4 rounded-xl text-base font-bold uppercase tracking-widest transition-colors border border-transparent",
                                                        isActive
                                                            ? "bg-[#0033FF]/10 text-[#0033FF] border-[#0033FF]/20"
                                                            : "text-black hover:bg-gray-50 hover:border-black/5"
                                                    )}
                                                >
                                                    {item.label}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>,
            document.body
        );

    return (
        <>
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md z-50 border-b border-black/10">
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

                <div className="flex flex-row-reverse items-center gap-3 md:flex-row md:gap-8">
                    {/* ── PC 네비게이션 ── */}
                    <nav aria-label="주요 메뉴" className="hidden md:flex items-center">
                        <ul className="flex items-center gap-8 list-none m-0 p-0">
                            {NAV_ITEMS.map((item) => {
                                const isActive = activeId === item.id;
                                return (
                                    <li key={item.id} className="flex items-center">
                                        <Link
                                            href={item.href}
                                            aria-current={isActive ? "page" : undefined}
                                            className={clsx(
                                                "flex items-center leading-none text-base font-bold uppercase tracking-widest transition-colors hover:text-[#0033FF] whitespace-nowrap",
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

                    {/* ── 모바일: 사이드 메뉴 열기 ── */}
                    <button
                        type="button"
                        className="md:hidden flex items-center justify-center w-8 h-8 rounded-full border-2 border-black/10 text-gray-700 hover:bg-black hover:text-white transition-colors shrink-0"
                        onClick={() => setIsMobileNavOpen(true)}
                        aria-expanded={isMobileNavOpen}
                        aria-controls="mobile-nav-panel"
                        aria-label="메뉴 열기"
                    >
                        <Menu size={18} strokeWidth={2} aria-hidden="true" />
                    </button>

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
                                    {headerProfileImageSrc ? (
                                        <img
                                            src={headerProfileImageSrc}
                                            alt={`${user?.nickname ?? "사용자"} 프로필 사진`}
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
                                                        <User
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
                                                        href="/mypage?edit=true"
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
                                className="flex items-center leading-none text-base font-bold tracking-widest hover:text-[#0033FF] transition-colors"
                            >
                                로그인
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
        {mobileNavPortal}
        </>
    );
}