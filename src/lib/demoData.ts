import type { Dataset, Worker } from "../types";

/**
 * 화면 구경용 가상 데이터 생성기.
 * 실제 인물·회사와 무관한 값을 코드에서 즉석 생성하므로
 * 저장소에는 어떤 데이터 파일도 존재하지 않는다.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 아래 값은 모두 실제 회사·인물과 무관한 가짜 데이터다.
 * '현장명'은 요청에 따라 A현장·B현장 식으로, '성명'은 홍길동·김철수 같은
 * 대표적인 예시 이름을 사용하므로 GitHub 저장소에 올라가도 무방하다.
 */
const COMPANIES = [
  { name: "A현장", rate: 100000, size: 8 },
  { name: "B현장", rate: 150000, size: 6 },
  { name: "C현장", rate: 200000, size: 5 },
];
const NAMES = [
  "홍길동", "김철수", "이영희", "박민수", "최지영", "정대현",
  "강수진", "조현우", "윤서연", "임재훈", "한지민", "오세훈",
  "서준호", "신미래", "권보라", "황도윤", "안예린", "배성민",
  "문하늘", "유가온",
];
const GONGSU_VALUES = [0.5, 0.9, 1, 1.5, 1.8, 2.1, 2.3, 2.7];

/** 주어진 업체 목록·시드로 한 벌(실근무본 또는 신고본)의 인력을 생성한다. */
function makeWorkers(
  companies: { name: string; rate: number; size: number }[],
  seed: number
): Worker[] {
  const rand = mulberry32(seed);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const workers: Worker[] = [];
  let nameIdx = 0;

  for (const comp of companies) {
    for (let i = 1; i <= comp.size; i++) {
      const days: Record<string, number> = {};
      const workDayCount = 3 + Math.floor(rand() * 15);
      for (let k = 0; k < workDayCount; k++) {
        const d = 1 + Math.floor(rand() * 31);
        days[String(d)] = pick(GONGSU_VALUES);
      }
      const totalGongsu =
        Math.round(Object.values(days).reduce((s, v) => s + v, 0) * 100) / 100;
      workers.push({
        company: comp.name,
        category: "실근무",
        no: i,
        name: NAMES[nameIdx++ % NAMES.length],
        days,
        totalGongsu,
        rate: comp.rate,
        totalPay: Math.round(totalGongsu * comp.rate),
      });
    }
  }
  return workers;
}

export function makeDemoDataset(): Dataset {
  // 실근무본: A·B·C 현장
  const workers = makeWorkers(COMPANIES, 20260708);

  // 신고본: 숫자가 다른 별도 시드로 생성.
  // C현장은 신고본 시트가 없다고 가정해 신고본 모드에서 빠지는 모습을 시연하고,
  // A현장은 실근무본보다 한 명 더 많게 두어 '인원이 다를 수 있음'을 보여준다.
  const reportWorkers = makeWorkers(
    [
      { name: "A현장", rate: 100000, size: 9 },
      { name: "B현장", rate: 150000, size: 6 },
    ],
    99998888
  );

  return {
    label: "샘플 데이터 (가상 현장·인물)",
    daysInMonth: 31,
    workers,
    reportWorkers,
  };
}
