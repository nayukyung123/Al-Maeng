import type { Banner } from "@/types/home";
// import apiClient from "@/lib/axios"; // 🔴 백엔드 완성 후 주석 해제

/** 배너 목업 데이터 */
const MOCK_BANNERS: Banner[] = [
  {
    id: 1,
    movie: "왕과 사는 남자",
    movieSeed: "king",
    quote:
      '"1457, 청령포.<br/><span class="bg-[#0033FF] text-white px-2 font-bold">권력은 떠났고 인간만 남았다.</span>"',
    books: [
      { title: "동물농장", copy: "권력은 언제나 누군가를 밀어낸다.", seed: "animalfarm" },
      { title: "1984", copy: "감시당하는 삶은 어떤 얼굴을 하는가.", seed: "1984" },
      { title: "단종 평전", copy: "비극의 왕이 아니라, 한 인간 이홍위.", seed: "danjong" },
    ],
  },
  {
    id: 2,
    movie: "인터스텔라",
    movieSeed: "interstellar",
    quote:
      '"우린 답을 찾을 것이다.<br/><span class="bg-[#0033FF] text-white px-2 font-bold">늘 그랬듯이.</span>"',
    books: [
      { title: "코스모스", copy: "광활한 우주 속 우리의 위치.", seed: "cosmos" },
      { title: "이기적 유전자", copy: "생존을 향한 끝없는 여정.", seed: "gene" },
      { title: "사피엔스", copy: "인류는 어디로 나아가는가.", seed: "sapiens" },
    ],
  },
  {
    id: 3,
    movie: "헤어질 결심",
    movieSeed: "decision",
    quote:
      '"마침내, 붕괴된 사람들을 위한<br/><span class="bg-[#0033FF] text-white px-2 font-bold">활자 속의 미결 사건들</span>"',
    books: [
      {
        title: "안나 카레니나",
        copy: "파괴적인 사랑의 끝에서 발견하는 인간의 본성.",
        seed: "anna",
      },
      {
        title: "참을 수 없는 존재의 가벼움",
        copy: "사랑과 존재의 무거움에 대하여.",
        seed: "lightness",
      },
      { title: "이방인", copy: "부조리한 세상 속 고독한 개인.", seed: "stranger" },
    ],
  },
  {
    id: 4,
    movie: "에브리씽 에브리웨어 올 앳 원스",
    movieSeed: "eeaao",
    quote:
      '"모든 차원의 나를 경험한 끝에<br/><span class="bg-[#0033FF] text-white px-2 font-bold">결국 다정함을 선택하다.</span>"',
    books: [
      { title: "다정함의 과학", copy: "우리를 구원하는 가장 강력한 무기.", seed: "kindness" },
      {
        title: "미드나잇 라이브러리",
        copy: "수많은 삶 중 내가 선택한 단 하나의 삶.",
        seed: "midnight",
      },
      {
        title: "우리가 빛의 속도로 갈 수 없다면",
        copy: "우주적 고독 속에서 피어나는 연대.",
        seed: "lightspeed",
      },
    ],
  },
];

/**
 * 🟡 MOCK API — GET /api/banners (백엔드 미구현)
 * 백엔드 완성 후: return apiClient.get<Banner[]>('/api/banners').then(r => r.data)
 */
export async function fetchBanners(): Promise<Banner[]> {
  return Promise.resolve(MOCK_BANNERS);
}
