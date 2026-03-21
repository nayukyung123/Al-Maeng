import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 유저 정보 타입 (백엔드 응답에 맞게 확장) */
export interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl?: string;
}

interface AuthState {
  /** 로그인 여부 */
  isLoggedIn: boolean;
  /** 유저 정보 */
  user: UserInfo | null;
  /** 액세스 토큰 */
  accessToken: string | null;

  // --- Actions ---
  /** 로그인: 유저 정보와 토큰을 저장 */
  login: (user: UserInfo, accessToken: string) => void;
  /** 로그아웃: 상태 초기화 */
  logout: () => void;
  /** 유저 정보 부분 업데이트 */
  updateUser: (partial: Partial<UserInfo>) => void;
  /** 토큰 갱신 */
  setAccessToken: (accessToken: string) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      accessToken: null,

      login: (user, accessToken) => {
        // localStorage에도 직접 저장 → axios 인터셉터에서 참조
        localStorage.setItem("accessToken", accessToken);
        set({ isLoggedIn: true, user, accessToken });
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        set({ isLoggedIn: false, user: null, accessToken: null });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setAccessToken: (accessToken) => {
        localStorage.setItem("accessToken", accessToken);
        set({ accessToken });
      },
    }),
    {
      name: "auth-storage", // localStorage 키 이름
      // accessToken은 localStorage에 별도로 관리하므로 persist 대상에서 제외 가능
      // 필요 시 partialize로 저장 항목 선택
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);

export default useAuthStore;
