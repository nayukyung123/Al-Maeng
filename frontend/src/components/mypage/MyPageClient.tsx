"use client";

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { ChevronLeft, ChevronRight, User, ArrowLeft } from 'lucide-react';
import { Book, type Gender, type UserData } from '@/types/mypage';
import { fetchCompletedBooks } from "@/api/completedBooks";
import { deleteMyAccount, fetchMyProfile, updateMyProfile } from "@/api/mypage";
import { fetchGenres } from "@/api/genres";
import { getPresignedUrl, uploadImageToS3 } from "@/api/auth";
import useAuthStore from "@/store/useAuthStore";
import MyPageTierSection from "@/components/mypage/MyPageTierSection";
import MyPageEditModal from "@/components/mypage/MyPageEditModal";
import { useMyWishlists } from '@/hooks/useWishlist';
import { MAIN_CHART_DATA, FICTION_SUB_CHART_DATA } from '@/data/mypage';
export default function MyPageClient() {
  const { isLoggedIn, user, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [wishlistPage, setWishlistPage] = useState(1);
  const [finishedPage, setFinishedPage] = useState(1);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 찜 목록 조회 (실제 API)
  const { data: wishlistData } = useMyWishlists(wishlistPage - 1, 10);
  const wishlistItems = wishlistData?.content ?? [];
  const wishlistTotalPages = wishlistData?.totalPages ?? 0;

  const { data: completedBooks = [] } = useQuery({
    queryKey: ["completed-books"],
    queryFn: fetchCompletedBooks,
    enabled: isLoggedIn,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const {
    data: myProfile,
  } = useQuery({
    queryKey: ["my-profile"],
    queryFn: fetchMyProfile,
    enabled: isLoggedIn,
    // 완독 권수/티어는 자주 바뀔 수 있어 캐시로 고정되면 UX가 나빠짐
    // (특히 백엔드 수정 직후엔 기존 캐시가 남아있을 수 있음)
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const {
    data: genres = [],
    isLoading: isGenresLoading,
    isError: isGenresError,
  } = useQuery({
    queryKey: ["genres"],
    queryFn: fetchGenres,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const mainGenres = React.useMemo(() => genres.filter((g) => g.parentId === null), [genres]);
  const novelSubGenres = React.useMemo(
    () => genres.filter((g) => g.parentId === 27594),
    [genres]
  );

  const [editFormData, setEditFormData] = useState<UserData>({
    nickname: '',
    gender: '',
    preferences: [],
    birthday: '',
    profileImage: ''
  });

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!myProfile) return;

    const mapped: UserData = {
      nickname: myProfile.nickname ?? '',
      gender: (myProfile.gender ?? '') as Gender,
      preferences: myProfile.tasteData ?? [],
      birthday: myProfile.birthYear ? String(myProfile.birthYear) : '',
      profileImage: myProfile.profileImageUrl ?? '',
    };

    setUserData(mapped);
    setEditFormData(mapped);
    setProfileImageFile(null);
  }, [myProfile]);

  // URL 기반으로 수정 모달 오픈 제어: /mypage?edit=true
  useEffect(() => {
    const shouldOpen = searchParams.get("edit") === "true";
    if (!shouldOpen) return;
    if (!userData) return; // 프로필 로딩 전에는 오픈하지 않음
    setIsEditModalOpen(true);
  }, [searchParams, userData]);

  const togglePreference = (genreId: number) => {
    setEditFormData((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(genreId)
        ? prev.preferences.filter((id) => id !== genreId)
        : [...prev.preferences, genreId],
    }));
  };

  function parseUserIdFromToken(token: string): number {
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload: { sub?: string } = JSON.parse(atob(base64));
      return payload.sub ? parseInt(payload.sub, 10) : 0;
    } catch {
      return 0;
    }
  }

  function getCurrentUserId(): number {
    if (user?.id) return user.id;
    if (typeof window === "undefined") return 0;
    const token = localStorage.getItem("accessToken");
    if (!token) return 0;
    return parseUserIdFromToken(token);
  }

  const saveProfileMutation = useMutation({
    mutationFn: async (): Promise<{ nickname: string; profileImageUrl: string }> => {
      const uniqueTasteData = Array.from(new Set(editFormData.preferences));
      const birthYearNum = Number(editFormData.birthday);

      if (!Number.isFinite(birthYearNum)) throw new Error("Invalid birthYear");
      if (!editFormData.nickname.trim()) throw new Error("Invalid nickname");
      if (!editFormData.gender) throw new Error("Gender is required");

      const finalNickname = editFormData.nickname.trim();
      let finalProfileImageUrl = editFormData.profileImage;

      if (profileImageFile) {
        const ext = profileImageFile.name.split(".").pop() || "jpeg";
        const uploadInfo = await getPresignedUrl(getCurrentUserId(), `.${ext}`);
        await uploadImageToS3(uploadInfo.presignedUrl, profileImageFile);
        finalProfileImageUrl = uploadInfo.imageUrl;
      }

      await updateMyProfile({
        nickname: finalNickname,
        profileImageUrl: finalProfileImageUrl,
        birthYear: birthYearNum,
        gender: editFormData.gender as Gender,
        tasteData: uniqueTasteData,
      });

      return { nickname: finalNickname, profileImageUrl: finalProfileImageUrl };
    },
    onSuccess: ({ nickname, profileImageUrl }) => {
      // 헤더 즉시 반영 (zustand store 갱신)
      updateUser({ nickname, profileImageUrl });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      setProfileImageFile(null);
      setIsEditModalOpen(false);
      // edit=true로 다시 열리는 현상 방지
      router.replace("/mypage", { scroll: false });
    },
    onError: (err) => {
      console.error(err);
      alert("프로필 저장에 실패했습니다. 다시 시도해주세요.");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      logout();
      router.push("/login");
    },
    onError: (err) => {
      console.error(err);
      alert("회원 탈퇴 처리 중 오류가 발생했습니다.");
    },
  });

  const saveProfile = () => {
    saveProfileMutation.mutate();
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setProfileImageFile(null);
    if (userData) setEditFormData(userData);
    // URL에서 edit 파라미터 제거 (뒤로가기/딥링크 상태 정리)
    router.replace("/mypage", { scroll: false });
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountMutation.isPending) return;
    const ok = confirm("정말 회원 탈퇴하시겠습니까?");
    if (!ok) return;
    try {
      await deleteAccountMutation.mutateAsync();
    } catch {
      // onError에서 alert 처리
    }
  };

  const itemsPerPage = 10; // 요구사항: 한 번에 최대 10권 (2줄)

  const finishedBooks: Book[] = completedBooks.map((book) => ({
    bookId: book.bookId,
    slug: book.slug,
    title: book.title,
    author: book.author,
    coverImageUrl: book.coverImageUrl,
    dateRead: book.completedAt,
  }));

  const finishedTotalPages = Math.ceil(finishedBooks.length / itemsPerPage);
  const currentFinishedBooks = finishedBooks.slice(
    (finishedPage - 1) * itemsPerPage,
    finishedPage * itemsPerPage
  );

  useEffect(() => {
    if (!isLoggedIn) return;
    // 완독 목록이 갱신되면 티어/경험치도 같이 갱신되도록 프로필을 한 번 더 리프레시
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
  }, [isLoggedIn, finishedBooks.length, queryClient]);

  return (
    <div className="pt-8 pb-32 px-6 md:px-12 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16 items-start mb-24">
        {/* Left Column: Profile & Stats */}
        <div className="space-y-12">
          {/* Profile Section */}
          <section className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div
              className="relative"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-black shrink-0 bg-gray-50 flex items-center justify-center">
                {userData?.profileImage ? (
                  <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={48} className="text-gray-300" />
                )}
              </div>
            </div>
            <div className="flex-1 text-center md:text-left md:flex md:flex-col md:justify-center md:pt-4">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-2 justify-center md:justify-start">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">{userData?.nickname || '텍스트힙스터'}</h2>
                <MyPageTierSection part="badge" tier={myProfile?.tier} />
              </div>
              <MyPageTierSection part="progress" tier={myProfile?.tier} />
              <MyPageTierSection part="message" tier={myProfile?.tier} />
            </div>
          </section>

          {/* Dashboard Stats */}
          <section className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                document.getElementById('wishlist-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-black text-white p-6 md:p-8 aspect-[4/3] flex flex-col justify-between text-left hover:bg-gray-900 transition-colors rounded-xl"
            >
              <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">찜한 권수</p>
              <p className="text-3xl md:text-5xl font-black">
                {wishlistData?.totalElements ?? 0}<span className="text-lg font-medium ml-1">권</span>
              </p>
            </button>
            <button
              onClick={() => {
                document.getElementById('completed-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#4D41FF] text-white p-6 md:p-8 aspect-[4/3] flex flex-col justify-between text-left hover:bg-[#3d34e0] transition-colors rounded-xl"
            >
              <p className="text-white/60 font-mono text-[10px] uppercase tracking-widest">완독 권수</p>
              <p className="text-3xl md:text-5xl font-black">
                {finishedBooks.length}<span className="text-lg font-medium ml-1">권</span>
              </p>
            </button>
          </section>
        </div>

        {/* Right Column: Taste Report */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black uppercase tracking-tight">TASTE REPORT</h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1 text-xs font-bold text-[#4D41FF] hover:underline"
              >
                <ArrowLeft size={14} />
                대분류 보기
              </button>
            )}
          </div>
          <div className="bg-white border rounded-xl border-gray-100 p-4 aspect-square flex flex-col items-center justify-center shadow-sm">
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                {selectedCategory === '문학(소설)' ? (
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={FICTION_SUB_CHART_DATA}>
                    <PolarGrid stroke="#f0f0f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#111', fontSize: 10, fontWeight: 'bold' }} />
                    <Radar name="Taste" dataKey="A" stroke="#4D41FF" strokeWidth={2} fill="#4D41FF" fillOpacity={0.15} />
                  </RadarChart>
                ) : (
                  <BarChart
                    data={MAIN_CHART_DATA}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="subject"
                      type="category"
                      tick={{ fill: '#111', fontSize: 10, fontWeight: 'bold' }}
                      width={80}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Bar
                      dataKey="A"
                      radius={[0, 4, 4, 0]}
                      onClick={(data: any) => {
                        if (data.subject === '문학(소설)') {
                          setSelectedCategory('문학(소설)');
                        }
                      }}
                    >
                      {MAIN_CHART_DATA.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.subject === '문학(소설)' ? '#4D41FF' : '#E5E7EB'}
                          className={entry.subject === '문학(소설)' ? 'cursor-pointer hover:opacity-80' : ''}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            {selectedCategory === '문학(소설)' && (
              <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                문학(소설) 소분류 취향 분석
              </p>
            )}
            {!selectedCategory && (
              <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                카테고리를 클릭하여 상세 분석을 확인하세요
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Wishlist Section */}
      <section id="wishlist-section" className="mt-24 scroll-mt-24">
        <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-4">
          <h3 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Wishlist</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
          {wishlistItems.map((item: any) => (
            <Link key={item.bookId} href={`/books/${item.slug}`} className="group block">
              <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1">
                <img
                  src={item.coverImageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm leading-tight line-clamp-2 group-hover:text-[#4D41FF] transition-colors">{item.title}</h4>
                <p className="text-[10px] font-medium text-gray-400">{item.author}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* COMPLETED Books Section */}
      <section id="completed-section" className="mt-24 scroll-mt-24">
        <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-4">
          <h3 className="text-3xl md:text-4xl font-black tracking-tight uppercase">COMPLETED Books</h3>
        </div>

        {finishedBooks.length === 0 ? (
          <div className="py-16 px-4 bg-white border border-gray-100 rounded-xl text-center">
            <p className="text-sm font-black tracking-tight">아직 완독한 도서가 없어요.</p>
            <p className="mt-2 text-xs text-gray-400 font-medium break-keep">
              완독 도서를 추가하고 나만의 티어를 올려보세요.
            </p>
            <Link
              href="/search?focus=true"
              className="inline-flex mt-6 items-center justify-center px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#0033FF] transition-colors"
            >
              완독 도서 추가하러 가기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
            {currentFinishedBooks.map((book) => (
              <Link
                key={book.bookId}
                href={`/books/${book.slug}`}
                className="group block"
              >
                <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1">
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="w-full h-full object-cover transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-sm leading-tight line-clamp-2 group-hover:text-[#4D41FF] transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[10px] font-medium text-gray-400">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Edit Profile Modal */}
      <MyPageEditModal
        isOpen={isEditModalOpen}
        onClose={handleCancelEdit}
        onSave={saveProfile}
        onDeleteAccount={handleDeleteAccount}
        isSavePending={saveProfileMutation.isPending}
        isDeletePending={deleteAccountMutation.isPending}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        profileImageFile={profileImageFile}
        setProfileImageFile={setProfileImageFile}
        togglePreference={togglePreference}
        isGenresLoading={isGenresLoading}
        isGenresError={isGenresError}
        mainGenres={mainGenres}
        novelSubGenres={novelSubGenres}
      />
    </div>
  );
}
