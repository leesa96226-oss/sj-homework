import * as XLSX from "xlsx";
import type { Dataset, Worker } from "../types";

const SHEET_NAME = "웹_데이터";
const REAL_SUFFIX = "_실근무본";
const REPORT_SUFFIX = "_신고본";

function round2(n: number): number {
  return Math.round((n + 1e-9) * 100) / 100;
}

/**
 * 한 시트(worksheet)의 인원 행들을 파싱한다.
 * 헤더 이름으로 열을 찾으므로 열 순서가 달라도 동작한다.
 * - companyOverride가 주어지면(시트명 기반) 그 값을 업체로 쓰고,
 *   없으면 '업체' 열 값을 사용한다.
 * - '구분' 또는 '직종' 헤더를 직종(category)으로 인식한다.
 * 파싱 결과가 없으면(성명/일자 열 부재 등) 빈 배열을 반환한다(throw하지 않음).
 * 엑셀 값을 읽어 담기만 하며(표시 전용) 값을 새로 만들어내지 않는다.
 */
function parseSheetWorkers(
  ws: XLSX.WorkSheet,
  companyOverride?: string
): Worker[] {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  });
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => (h == null ? "" : String(h).trim()));
  const col = (label: string) => header.indexOf(label);

  const cCompany = col("업체");
  const cCategory = col("구분") >= 0 ? col("구분") : col("직종");
  const cNo = col("순번");
  const cName = col("성명");
  const cTotal = col("출역일수");
  const cRate = col("노무비단가");
  const cPay = col("노무비총액");
  if (cName < 0) return [];

  const dayCols = new Map<number, number>();
  header.forEach((h, i) => {
    const d = Number(h);
    if (Number.isInteger(d) && d >= 1 && d <= 31) dayCols.set(d, i);
  });
  if (dayCols.size === 0) return [];

  const workers: Worker[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = row[cName];
    if (name == null || String(name).trim() === "") continue;

    const days: Record<string, number> = {};
    let sum = 0;
    for (const [d, i] of dayCols) {
      const v = row[i];
      const n = typeof v === "number" ? v : Number(v);
      if (v != null && v !== "" && !Number.isNaN(n) && n !== 0) {
        days[String(d)] = round2(n);
        sum += n;
      }
    }

    const totalRaw = cTotal >= 0 ? Number(row[cTotal]) : NaN;
    const rate = cRate >= 0 ? Number(row[cRate]) || 0 : 0;
    const payRaw = cPay >= 0 ? Number(row[cPay]) : NaN;
    const totalGongsu = Number.isFinite(totalRaw)
      ? round2(totalRaw)
      : round2(sum);
    const totalPay = Number.isFinite(payRaw)
      ? Math.round(payRaw)
      : Math.round(totalGongsu * rate);

    const company =
      companyOverride ??
      (cCompany >= 0 ? String(row[cCompany] ?? "").trim() : "");

    workers.push({
      company: company || "(미지정)",
      category: cCategory >= 0 ? String(row[cCategory] ?? "").trim() : "",
      no: cNo >= 0 ? Number(row[cNo]) || workers.length + 1 : workers.length + 1,
      name: String(name).trim(),
      days,
      totalGongsu,
      rate,
      totalPay,
    });
  }
  return workers;
}

/** '공영_실근무본' → '공영' 처럼 시트명 접두어를 업체명으로 뽑는다. */
function companyFromSheetName(sheetName: string, suffix: string): string {
  return sheetName.slice(0, sheetName.length - suffix.length).trim() || "(미지정)";
}

/**
 * 인력공수 엑셀 파일을 파싱한다.
 *
 * 1) 시트명이 '_실근무본'/'_신고본'으로 끝나는 시트가 있으면:
 *    - '_실근무본' 시트들을 모아 실근무본(workers)으로,
 *    - '_신고본' 시트들을 모아 신고본(reportWorkers)으로 읽는다.
 *    - 업체명은 시트명 접두어에서 얻는다(예: '공영_실근무본' → '공영').
 *    - 신고본 시트가 없는 업체는 신고본에 그냥 포함되지 않는다(에러 없음).
 * 2) 그런 시트가 하나도 없으면 기존 방식('웹_데이터' 단일 시트)으로 폴백한다.
 *
 * 어떤 경우에도 엑셀 값을 읽어 담기만 하며(표시 전용) 별도 계산은 하지 않는다.
 */
export function parseGongsuWorkbook(buf: ArrayBuffer): Dataset {
  const wb = XLSX.read(buf, { type: "array" });

  const realSheets = wb.SheetNames.filter((n) => n.endsWith(REAL_SUFFIX));
  const reportSheets = wb.SheetNames.filter((n) => n.endsWith(REPORT_SUFFIX));

  if (realSheets.length > 0 || reportSheets.length > 0) {
    const workers = realSheets.flatMap((n) =>
      parseSheetWorkers(wb.Sheets[n], companyFromSheetName(n, REAL_SUFFIX))
    );
    const reportWorkers = reportSheets.flatMap((n) =>
      parseSheetWorkers(wb.Sheets[n], companyFromSheetName(n, REPORT_SUFFIX))
    );
    if (workers.length === 0 && reportWorkers.length === 0)
      throw new Error(
        "'_실근무본'/'_신고본' 시트에서 인원 데이터를 찾지 못했습니다. 양식을 확인해 주세요."
      );
    return {
      label: "",
      daysInMonth: 31,
      workers,
      reportWorkers: reportWorkers.length > 0 ? reportWorkers : undefined,
    };
  }

  // ── 폴백: 기존 '웹_데이터' 단일 시트 방식 ──────────────────────────
  const sheetName = wb.SheetNames.includes(SHEET_NAME)
    ? SHEET_NAME
    : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error("시트를 찾을 수 없습니다.");

  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: null,
  });
  if (rows.length < 2) throw new Error("데이터 행이 없습니다.");

  const header = rows[0].map((h) => (h == null ? "" : String(h).trim()));
  if (header.indexOf("업체") < 0 || header.indexOf("성명") < 0)
    throw new Error(
      `'${sheetName}' 시트에서 '업체'/'성명' 헤더를 찾지 못했습니다. 양식을 확인해 주세요.`
    );
  const hasDay = header.some((h) => {
    const d = Number(h);
    return Number.isInteger(d) && d >= 1 && d <= 31;
  });
  if (!hasDay)
    throw new Error("일자(1~31) 열을 찾지 못했습니다. 양식을 확인해 주세요.");

  const workers = parseSheetWorkers(ws);
  if (workers.length === 0) throw new Error("인원 데이터가 없습니다.");
  return { label: "", daysInMonth: 31, workers };
}
