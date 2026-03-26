// Backend DTO (CompletedBookResponse, BookResponse 등) 기반 매핑
// 실제 백엔드는 카멜케이스(camelCase) 직렬화를 기본으로 사용합니다.

export interface Book {
  bookId: number;        // BIGINT 기반
  slug?: string;
  title: string;         // VARCHAR
  author: string;
  coverImageUrl: string; // TEXT (DB 컬럼: cover_image_url) -> Java DTO: coverImageUrl
  dateRead?: string;     // 프론트 목업용 추가 데이터
}

export type Gender = "MALE" | "FEMALE";

export interface UserData {
  nickname: string;
  gender: Gender | "";
  preferences: number[];
  /**
   * 백엔드 요청/응답의 birthYear(Integer) 값.
   * UI에서는 문자열로 관리해서 input/select에 바로 바인딩합니다.
   */
  birthday: string;
  profileImage: string;
}
