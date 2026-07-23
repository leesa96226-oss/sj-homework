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
  /** '_실근무본' 시트에서 읽은 실근무본 인력 (기존 화면들이 쓰는 기본 데이터) */
  workers: Worker[];
  /** '_신고본' 시트에서 읽은 신고본 인력. 신고본 시트가 있을 때만 존재. 표시 전용. */
  reportWorkers?: Worker[];
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

export type PageKey =
  | "gongsu"
  | "settlement"
  | "usage"
  | "monthly"
  | "site"
  | "docs";
