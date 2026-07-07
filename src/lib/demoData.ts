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

const COMPANIES = [
  { name: "가나건설(가상)", rate: 100000, size: 9 },
  { name: "다라산업(가상)", rate: 150000, size: 7 },
  { name: "마바기공(가상)", rate: 200000, size: 5 },
];
const SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
const GIVEN = ["철수", "영희", "민준", "서연", "도윤", "하은", "지호", "수아", "예준", "지민"];
const GONGSU_VALUES = [0.5, 0.9, 1, 1.5, 1.8, 2.1, 2.3, 2.7];

export function makeDemoDataset(): Dataset {
  const rand = mulberry32(20260708);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const workers: Worker[] = [];

  for (const comp of COMPANIES) {
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
        name: `${pick(SURNAMES)}${pick(GIVEN)}`,
        days,
        totalGongsu,
        rate: comp.rate,
        totalPay: Math.round(totalGongsu * comp.rate),
      });
    }
  }

  return { label: "데모 데이터 (가상 인물·업체)", daysInMonth: 31, workers };
}
