export interface Worker {
  company: string;
  category: string;
  no: number;
  name: string;
  /** 일자(1~31) → 공수 */
  days: Record<string, number>;
  totalGongsu: number;
  rate: number;
  totalPay: number;
}

export interface Dataset {
  label: string;
  daysInMonth: number;
  workers: Worker[];
}

/** 브라우저 localStorage에 보관되는 데이터 단위 (사용자 PC 밖으로 나가지 않음) */
export interface StoredDataset {
  id: string;
  label: string;
  savedAt: string;
  isDemo?: boolean;
  data: Dataset;
}

export interface CompanySummary {
  company: string;
  headcount: number;
  totalGongsu: number;
  totalPay: number;
}

export type PageKey = "gongsu" | "settlement" | "site" | "docs";
