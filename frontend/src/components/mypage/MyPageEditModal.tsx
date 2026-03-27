"use client";

import React, { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera, ChevronRight, User, X } from "lucide-react";
import type { Gender, UserData } from "@/types/mypage";
import type { GenreResponse } from "@/api/genres";
import { prepareUploadImage, readFileAsDataUrl } from "@/lib/imageCompression";
import useToastStore from "@/store/useToastStore";

export default function MyPageEditModal(props: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDeleteAccount: () => void;
  isSavePending: boolean;
  isDeletePending: boolean;
  editFormData: UserData;
  setEditFormData: React.Dispatch<React.SetStateAction<UserData>>;
  setProfileImageFile: React.Dispatch<React.SetStateAction<File | null>>;
  profileImageFile: File | null;
  togglePreference: (genreId: number) => void;
  isGenresLoading: boolean;
  isGenresError: boolean;
  mainGenres: GenreResponse[];
  novelSubGenres: GenreResponse[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addToast = useToastStore((s) => s.addToast);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const prepared = await prepareUploadImage(file, "profile");
      const previewDataUrl = await readFileAsDataUrl(prepared.file);
      props.setProfileImageFile(prepared.file);
      props.setEditFormData((prev) => ({
        ...prev,
        profileImage: previewDataUrl,
      }));

      if (prepared.usedOriginalFallback) {
        addToast("이미지 압축에 실패해 원본 파일로 업로드합니다.", "info");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "이미지를 처리하지 못했습니다.";
      addToast(message, "error");
      props.setProfileImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!props.isOpen) return null;

  const selectedMainGenres = props.editFormData.preferences;
  const shouldShowNovelSub =
    selectedMainGenres.includes(27594) && props.novelSubGenres.length > 0;

  const handleDeleteProfileImage = () => {
    props.setProfileImageFile(null);
    props.setEditFormData((prev) => ({
      ...prev,
      profileImage: "",
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={props.onClose}
      />
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 flex items-center justify-between bg-white">
          <h3 className="text-2xl font-black uppercase tracking-tight">
            Edit Profile
          </h3>
          <button
            onClick={props.onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 md:px-8 pb-8 overflow-y-auto space-y-10 bg-white">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="relative w-28 h-28 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center transition-all group-hover:border-black">
                {props.editFormData.profileImage ? (
                  <img
                    src={props.editFormData.profileImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-gray-300" />
                )}
                <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
            <button
              type="button"
              onClick={handleDeleteProfileImage}
              disabled={!props.editFormData.profileImage}
              className="text-[10px] font-bold text-gray-400 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:text-red-500 transition-colors"
            >
              삭제
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                닉네임
              </label>
              <input
                type="text"
                value={props.editFormData.nickname}
                maxLength={10}
                onChange={(e) => {
                  const filtered = e.target.value.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
                  props.setEditFormData((prev) => ({
                    ...prev,
                    nickname: filtered,
                  }));
                }}
                className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                placeholder="닉네임을 입력하세요"
              />
              <p className="text-[10px] text-gray-400 font-medium mt-2">
                한글, 영문, 숫자만 10자 이내로 입력해 주세요.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  성별
                </label>
                <div className="relative">
                  <select
                    value={props.editFormData.gender}
                    onChange={(e) =>
                      props.setEditFormData((prev) => ({
                        ...prev,
                        gender: e.target.value as Gender,
                      }))
                    }
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all appearance-none"
                  >
                    <option value="">선택 안함</option>
                    <option value="MALE">남성</option>
                    <option value="FEMALE">여성</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  출생년도
                </label>
                <div className="relative">
                  <select
                    value={props.editFormData.birthday}
                    onChange={(e) =>
                      props.setEditFormData((prev) => ({
                        ...prev,
                        birthday: e.target.value,
                      }))
                    }
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all appearance-none"
                  >
                    <option value="">출생년도 선택</option>
                    {Array.from({ length: 100 }, (_, i) => 2024 - i).map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                선호 장르 (다중 선택)
              </label>

              <div className="flex flex-wrap gap-2">
                {props.isGenresLoading ? (
                  <div className="text-[11px] text-gray-400 font-bold">장르 로딩 중...</div>
                ) : props.isGenresError ? (
                  <div className="text-[11px] text-red-500 font-bold">장르 정보를 불러오지 못했습니다.</div>
                ) : (
                  props.mainGenres.map((genre) => {
                    const selected = props.editFormData.preferences.includes(genre.id);
                    return (
                      <button
                        key={genre.id}
                        onClick={() => props.togglePreference(genre.id)}
                        className={`px-4 py-2.5 text-xs font-bold transition-all rounded-full border ${
                          selected
                            ? "bg-[#0033FF] text-white border-[#0033FF]"
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black"
                        }`}
                      >
                        {genre.genreName}
                      </button>
                    );
                  })
                )}
              </div>

              {/* 소설 세부장르 선택 (애니메이션/UX는 유지) */}
              <AnimatePresence initial={false}>
                {shouldShowNovelSub && !props.isGenresLoading && !props.isGenresError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden bg-gray-50 p-6 mt-4"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        어떤 소설을 좋아하시나요?
                      </label>
                      <button
                        onClick={() => {
                          const subGenreIds = props.novelSubGenres.map((g) => g.id);
                          const allSelected = subGenreIds.every((id) =>
                            props.editFormData.preferences.includes(id)
                          );

                          props.setEditFormData((prev) => {
                            if (allSelected) {
                              return {
                                ...prev,
                                preferences: prev.preferences.filter(
                                  (id) => !subGenreIds.includes(id)
                                ),
                              };
                            }

                            return {
                              ...prev,
                              preferences: Array.from(
                                new Set([...prev.preferences, ...subGenreIds])
                              ),
                            };
                          });
                        }}
                        className="text-[10px] font-bold text-white bg-black px-3 py-1 uppercase tracking-widest hover:bg-[#0033FF] transition-colors rounded-full"
                        type="button"
                      >
                        {props.novelSubGenres.every((genre) =>
                        props.editFormData.preferences.includes(genre.id)
                      )
                        ? "전체 해제"
                        : "전체 선택"}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {props.novelSubGenres.map((genre) => {
                        const selected = props.editFormData.preferences.includes(genre.id);
                        return (
                          <button
                            key={genre.id}
                            onClick={() => props.togglePreference(genre.id)}
                            className={`px-4 py-2 text-xs font-bold transition-all rounded-full border ${
                              selected
                                ? "bg-[#0033FF] text-white border-[#0033FF]"
                                : "bg-white text-gray-500 border-gray-200 hover:border-[#0033FF] hover:text-black"
                            }`}
                            type="button"
                          >
                            {genre.genreName}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 회원 탈퇴 (스크롤 영역 맨 아래, 작은 글씨) */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={props.onDeleteAccount}
              disabled={props.isDeletePending}
              className="inline-block text-center text-[12px] font-bold text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {props.isDeletePending ? "회원 탈퇴 처리중..." : "회원 탈퇴"}
            </button>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="p-6 md:p-8 border-t border-gray-100 flex gap-3 bg-white">
          <button
            onClick={props.onClose}
            className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors rounded-2xl text-sm"
          >
            취소
          </button>
          <button
            onClick={props.onSave}
            disabled={props.isSavePending}
            className="flex-1 py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-[#4D41FF] transition-colors rounded-2xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {props.isSavePending ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

