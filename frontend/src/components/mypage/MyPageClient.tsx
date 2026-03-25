"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { ChevronLeft, ChevronRight, User, ArrowLeft, Camera, X } from 'lucide-react';
import { Book, type Gender, type UserData } from '@/types/mypage';
import { fetchCompletedBooks } from "@/api/completedBooks";
import { deleteMyAccount, fetchMyProfile, updateMyProfile } from "@/api/mypage";
import { fetchTopLevelGenres } from "@/api/genres";
import { getPresignedUrl, uploadImageToS3 } from "@/api/auth";
import useAuthStore from "@/store/useAuthStore";
import { WISHLIST_BOOKS, MAIN_CHART_DATA, FICTION_SUB_CHART_DATA } from '@/data/mypage';
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
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const {
    data: mainGenres = [],
    isLoading: isGenresLoading,
    isError: isGenresError,
  } = useQuery({
    queryKey: ["genres-top-level"],
    queryFn: fetchTopLevelGenres,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const [editFormData, setEditFormData] = useState<UserData>({
    nickname: '',
    gender: '',
    preferences: [],
    birthday: '',
    profileImage: ''
  });

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      // UI 프리뷰용 base64 URL (업로드 후 실제 URL은 save 시점에 교체)
      setEditFormData((prev) => ({ ...prev, profileImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

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

  const wishlistTotalPages = Math.ceil(WISHLIST_BOOKS.length / itemsPerPage);
  const currentWishlistBooks = WISHLIST_BOOKS.slice(
    (wishlistPage - 1) * itemsPerPage,
    wishlistPage * itemsPerPage
  );

  const finishedBooks: Book[] = completedBooks.map((book) => ({
    bookId: book.bookId,
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
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-3 justify-center md:justify-start">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">{userData?.nickname || '텍스트힙스터'}</h2>
                <span className="bg-black text-white px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest shrink-0">
                  {myProfile?.tier
                    ? (myProfile.tier.tierName ?? (myProfile.tier.id ? `LV.${myProfile.tier.id}` : "LV"))
                    : "티어 로딩중"}
                </span>
              </div>
              <div className="w-full max-w-sm bg-gray-100 h-2 rounded-full overflow-hidden mb-2 mx-auto md:mx-0">
                {(() => {
                  if (!myProfile?.tier) return <div className="bg-[#0033FF] h-full" style={{ width: "0%" }} />;

                  const exp = myProfile.tier.exp ?? 0;
                  const min = myProfile.tier.minExp ?? 0;
                  const next = myProfile.tier.nextMinExp ?? null;
                  const pct = next !== null
                    ? Math.max(0, Math.min(100, ((exp - min) / Math.max(1, next - min)) * 100))
                    : 100;
                  return <div className="bg-[#0033FF] h-full" style={{ width: `${pct}%` }} />;
                })()}
              </div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">
                {(() => {
                  if (!myProfile?.tier) return "티어 정보를 불러오는 중입니다.";

                  const exp = myProfile.tier.exp ?? 0;
                  const next = myProfile.tier.nextMinExp ?? null;
                  if (next === null) return "최고 티어입니다.";
                  const remaining = Math.max(0, next - exp);
                  return `다음 티어까지 ${remaining}권 남았습니다.`;
                })()}
              </p>
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
                {WISHLIST_BOOKS.length}<span className="text-lg font-medium ml-1">권</span>
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
          {currentWishlistBooks.map((book) => (
            <div key={book.bookId} className="group cursor-pointer">
              <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1">
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm leading-tight line-clamp-2 group-hover:text-[#4D41FF] transition-colors">{book.title}</h4>
                <p className="text-[10px] font-medium text-gray-400">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPLETED Books Section */}
      <section id="completed-section" className="mt-24 scroll-mt-24">
        <div className="flex justify-between items-end mb-8 border-b-2 border-black pb-4">
          <h3 className="text-3xl md:text-4xl font-black tracking-tight uppercase">COMPLETED Books</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
          {currentFinishedBooks.map((book) => (
            <Link
              key={book.bookId}
              href={`/books/${book.bookId}`}
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
                <h4 className="font-black text-sm leading-tight line-clamp-2 group-hover:text-[#4D41FF] transition-colors">{book.title}</h4>
                <p className="text-[10px] font-medium text-gray-400">{book.author}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCancelEdit} />
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">Edit Profile</h3>
              <button onClick={handleCancelEdit} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-black bg-gray-50 flex items-center justify-center">
                    {editFormData.profileImage ? (
                      <img src={editFormData.profileImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-gray-300" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full shadow-lg hover:bg-[#4D41FF] transition-colors"
                  >
                    <Camera size={14} />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">닉네임</label>
                  <input
                    type="text"
                    value={editFormData.nickname}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, nickname: e.target.value }))}
                    className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-black transition-all"
                    placeholder="닉네임을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">성별</label>
                    <select
                      value={editFormData.gender}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, gender: e.target.value as Gender }))}
                      className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-black transition-all appearance-none"
                    >
                      <option value="">선택 안함</option>
                      <option value="MALE">남성</option>
                      <option value="FEMALE">여성</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">생일</label>
                    <select
                      value={editFormData.birthday}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, birthday: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-black transition-all appearance-none"
                    >
                      <option value="">출생년도 선택</option>
                      {Array.from({ length: 201 }, (_, idx) => 2100 - idx).map((year) => (
                        <option key={year} value={String(year)}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">선호 장르 (다중 선택)</label>
                  <div className="flex flex-wrap gap-2">
                    {isGenresLoading ? (
                      <div className="text-[11px] text-gray-400 font-bold">장르 로딩 중...</div>
                    ) : isGenresError ? (
                      <div className="text-[11px] text-red-500 font-bold">장르 정보를 불러오지 못했습니다.</div>
                    ) : (
                      mainGenres.map((genre) => (
                        <button
                          key={genre.id}
                          onClick={() => togglePreference(genre.id)}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                            editFormData.preferences.includes(genre.id)
                              ? "bg-black text-white"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          {genre.genreName}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={saveProfileMutation.isPending || deleteAccountMutation.isPending}
                className="flex-1 py-4 bg-gray-100 text-gray-500 font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={saveProfile}
                disabled={
                  saveProfileMutation.isPending ||
                  !editFormData.nickname.trim() ||
                  !editFormData.birthday ||
                  !editFormData.gender
                }
                className="flex-1 py-4 bg-black text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#4D41FF] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {saveProfileMutation.isPending ? "저장 중..." : "저장하기"}
              </button>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
                className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {deleteAccountMutation.isPending ? "탈퇴 중..." : "회원 탈퇴"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
