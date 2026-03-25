"use client";

import React, { useRef } from "react";
import { Camera, User, X } from "lucide-react";
import type { Gender, UserData } from "@/types/mypage";
import type { GenreResponse } from "@/api/genres";

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    props.setProfileImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      props.setEditFormData((prev) => ({
        ...prev,
        profileImage: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  if (!props.isOpen) return null;

  const selectedMainGenres = props.editFormData.preferences;
  const shouldShowNovelSub =
    selectedMainGenres.includes(27594) && props.novelSubGenres.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={props.onClose} />
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-black uppercase tracking-tight">Edit Profile</h3>
          <button
            onClick={props.onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-black bg-gray-50 flex items-center justify-center">
                {props.editFormData.profileImage ? (
                  <img
                    src={props.editFormData.profileImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
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
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={props.editFormData.nickname}
                onChange={(e) =>
                  props.setEditFormData((prev) => ({ ...prev, nickname: e.target.value }))
                }
                className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-black transition-all"
                placeholder="닉네임을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  성별
                </label>
                <select
                  value={props.editFormData.gender}
                  onChange={(e) =>
                    props.setEditFormData((prev) => ({
                      ...prev,
                      gender: e.target.value as Gender,
                    }))
                  }
                  className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold focus:ring-2 focus:ring-black transition-all appearance-none"
                >
                  <option value="">선택 안함</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  생일
                </label>
                <select
                  value={props.editFormData.birthday}
                  onChange={(e) =>
                    props.setEditFormData((prev) => ({ ...prev, birthday: e.target.value }))
                  }
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
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
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
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                          selected ? "bg-black text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {genre.genreName}
                      </button>
                    );
                  })
                )}
              </div>

              {shouldShowNovelSub && !props.isGenresLoading && !props.isGenresError && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                      어떤 소설을 좋아하시나요?
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const subGenreIds = props.novelSubGenres.map((g) => g.id);
                        const allSelected = subGenreIds.every((id) =>
                          props.editFormData.preferences.includes(id)
                        );

                        props.setEditFormData((prev) => {
                          if (allSelected) {
                            return {
                              ...prev,
                              preferences: prev.preferences.filter((id) => !subGenreIds.includes(id)),
                            };
                          }

                          return {
                            ...prev,
                            preferences: Array.from(new Set([...prev.preferences, ...subGenreIds])),
                          };
                        });
                      }}
                      className="text-[10px] font-black text-[#0033FF] uppercase tracking-widest hover:underline"
                    >
                      {props.novelSubGenres.every((g) =>
                        props.editFormData.preferences.includes(g.id)
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
                          className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${
                            selected
                              ? "border-black bg-black text-white"
                              : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                          }`}
                        >
                          {genre.genreName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={props.onClose}
            disabled={props.isSavePending || props.isDeletePending}
            className="flex-1 py-4 bg-gray-100 text-gray-500 font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={props.onSave}
            disabled={
              props.isSavePending ||
              !props.editFormData.nickname.trim() ||
              !props.editFormData.birthday ||
              !props.editFormData.gender
            }
            className="flex-1 py-4 bg-black text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#4D41FF] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {props.isSavePending ? "저장 중..." : "저장하기"}
          </button>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={props.onDeleteAccount}
            disabled={props.isDeletePending}
            className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {props.isDeletePending ? "탈퇴 중..." : "회원 탈퇴"}
          </button>
        </div>
      </div>
    </div>
  );
}

