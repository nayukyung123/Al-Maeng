"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { ChevronLeft, ChevronRight, User, ArrowLeft, Camera, X } from 'lucide-react';
import { Book, UserData } from '@/types/mypage';
import { FINISHED_BOOKS, WISHLIST_BOOKS, MAIN_CHART_DATA, FICTION_SUB_CHART_DATA } from '@/data/mypage';

export default function MyPageClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [wishlistPage, setWishlistPage] = useState(1);
  const [finishedPage, setFinishedPage] = useState(1);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [issuedTickets, setIssuedTickets] = useState<Set<number>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [editFormData, setEditFormData] = useState<UserData>({
    nickname: '',
    gender: '',
    preferences: [],
    birthday: '',
    profileImage: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true); // Hydration 에러 방지를 위해 클라이언트 마운트 여부 체크

    const savedData = localStorage.getItem('userData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setUserData(parsed);
      setEditFormData({
        nickname: parsed.nickname || '',
        gender: parsed.gender || '',
        preferences: parsed.preferences || [],
        birthday: parsed.birthday || '',
        profileImage: parsed.profileImage || ''
      });
    }

    const savedTickets = localStorage.getItem('issuedTickets');
    if (savedTickets) {
      setIssuedTickets(new Set(JSON.parse(savedTickets)));
    }
  }, []);

  // SSR 단계이거나 하이드레이션 이전이면 스켈레톤만 렌더링
  if (!isMounted) {
    return <div className="pt-24 pb-32 px-6 min-h-screen animate-pulse bg-gray-50" />;
  }

  const toggleTicket = (bookId: number) => {
    const newTickets = new Set(issuedTickets);
    if (newTickets.has(bookId)) {
      newTickets.delete(bookId);
    } else {
      newTickets.add(bookId);
    }
    setIssuedTickets(newTickets);
    localStorage.setItem('issuedTickets', JSON.stringify(Array.from(newTickets)));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePreference = (genre: string) => {
    setEditFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(genre)
        ? prev.preferences.filter(g => g !== genre)
        : [...prev.preferences, genre]
    }));
  };

  const saveProfile = () => {
    const updatedData = { ...userData, ...editFormData } as UserData;
    setUserData(updatedData);
    localStorage.setItem('userData', JSON.stringify(updatedData));
    setIsEditModalOpen(false);
  };

  const genres = ['문학(소설)', '에세이', '인문/철학', 'SF', '과학', '예술', '경제/경영', '자기계발'];
  const itemsPerPage = 10; // 요구사항: 한 번에 최대 10권 (2줄)

  const wishlistTotalPages = Math.ceil(WISHLIST_BOOKS.length / itemsPerPage);
  const currentWishlistBooks = WISHLIST_BOOKS.slice(
    (wishlistPage - 1) * itemsPerPage,
    wishlistPage * itemsPerPage
  );

  const finishedTotalPages = Math.ceil(FINISHED_BOOKS.length / itemsPerPage);
  const currentFinishedBooks = FINISHED_BOOKS.slice(
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
            <div className="relative group cursor-pointer" onClick={() => setIsEditModalOpen(true)}>
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-black shrink-0 bg-gray-50 flex items-center justify-center">
                {userData?.profileImage ? (
                  <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={48} className="text-gray-300" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-3 justify-center md:justify-start">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight">{userData?.nickname || '텍스트힙스터'}</h2>
                <span className="bg-black text-white px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest shrink-0">LV.1 새싹독서가</span>
              </div>
              <div className="w-full max-w-sm bg-gray-100 h-2 rounded-full overflow-hidden mb-2 mx-auto md:mx-0">
                <div className="bg-[#0033FF] h-full" style={{ width: '10%' }} />
              </div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">다음 티어까지 5권 남았습니다.</p>
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
                {FINISHED_BOOKS.length}<span className="text-lg font-medium ml-1">권</span>
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
            <div key={book.bookId} className="group relative cursor-pointer">
              <div className="aspect-[3/4] bg-gray-100 mb-4 overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1 relative">
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-full h-full object-cover transition-all duration-500"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTicket(book.bookId);
                    }}
                    className="w-full py-2.5 bg-transparent border border-white text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-white hover:text-black transition-colors"
                  >
                    {issuedTickets.has(book.bookId) ? '티켓 삭제하기' : '티켓 발행하기'}
                  </button>
                </div>

                {issuedTickets.has(book.bookId) && (
                  <div className="absolute top-2 right-2 bg-[#4D41FF] text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg z-20 animate-in zoom-in duration-300">
                    TICKET ISSUED
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm leading-tight line-clamp-2 group-hover:text-[#4D41FF] transition-colors">{book.title}</h4>
                <p className="text-[10px] font-medium text-gray-400">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight">Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                      onChange={(e) => setEditFormData(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-black transition-all appearance-none"
                    >
                      <option value="">선택 안함</option>
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">생일</label>
                    <input
                      type="date"
                      value={editFormData.birthday}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, birthday: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">선호 장르 (다중 선택)</label>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => togglePreference(genre)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${editFormData.preferences.includes(genre)
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-4 bg-gray-100 text-gray-500 font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={saveProfile}
                className="flex-1 py-4 bg-black text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#4D41FF] transition-colors"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
