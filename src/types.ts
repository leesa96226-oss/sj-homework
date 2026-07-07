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

export interface CompanySummary {
  company: string;
  headcount: number;
  totalGongsu: number;
  totalPay: number;
}
