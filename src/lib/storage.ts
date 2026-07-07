import type { StoredDataset } from "../types";

/**
 * 데이터 보안 원칙:
 * 업로드된 공수 데이터는 이 브라우저의 localStorage에만 저장된다.
 * 서버 전송, 외부 저장, 저장소(GitHub) 커밋은 일절 없다.
 */
const KEY = "sj-dashboard.datasets.v1";

export function loadDatasets(): StoredDataset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDatasets(list: StoredDataset[]): string | null {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return null;
  } catch {
    return "브라우저 저장 공간이 부족해 데이터를 저장하지 못했습니다. 오래된 데이터를 삭제해 주세요.";
  }
}

export function newId(): string {
  return `ds-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
