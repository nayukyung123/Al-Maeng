import React from 'react';

/**
 * 혼합된 데이터(HTML 엔티티 + 실제 기호 + 다양한 줄바꿈)를 
 * 안전하게 일반 텍스트 및 React 엘리먼트로 변환합니다.
 * Next.js SSR 환경에서도 에러가 나지 않도록 브라우저 전용 API(DOMParser) 호출 시 가드를 둡니다.
 */
export const formatBookContent = (rawStr: string | null | undefined): React.ReactNode => {
  if (!rawStr || typeof rawStr !== 'string') return "";

  let decodedText = rawStr;

  // [STEP 1] HTML 엔티티 디코딩 (&lt; -> < / &amp; -> &)
  // 브라우저 환경에서만 DOMParser를 사용합니다.
  if (typeof window !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawStr, 'text/html');
      decodedText = doc.documentElement.textContent || rawStr;
    } catch (e) {
      console.error("DOMParser decoding failed:", e);
      decodedText = rawStr;
    }
  }

  // [STEP 2] 모든 형태의 줄바꿈 및 태그 문자열 통일
  const normalizedText = decodedText
    .replace(/<br\s*\/?>/gi, '\n') // <br>, <br/> 등을 \n으로 통일
    .replace(/&lt;br\s*\/?&gt;/gi, '\n') // 에스케이프된 <br>도 처리
    .replace(/\r\n|\r/g, '\n');    // 윈도우식 줄바꿈 통일

  // [STEP 3] React에서 줄바꿈이 적용되도록 배열로 반환
  const lines = normalizedText.split('\n');
  
  if (lines.length <= 1) return normalizedText;

  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};
