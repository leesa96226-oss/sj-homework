import * as XLSX from "xlsx";
import type { Dataset, Worker } from "../types";

const SHEET_NAME = "웹_데이터";

function round2(n: number): number {
  return Math.round((n + 1e-9) * 100) / 100;
}

/**
 * 인력공수 엑셀 파일을 파싱한다.
 * "웹_데이터" 시트(없으면 첫 번째 시트)의 헤더 행을 읽어
 * 업체/구분/순번/성명/1~31일/출역일수/노무비단가/노무비총액 열을 찾는다.
 * 열 순서가 바뀌거나 빈 열이 끼어 있어도 헤더 이름으로 매핑하므로 동작한다.
 */
export function parseGongsuWorkbook(buf: ArrayBuffer): Dataset {
  const wb = XLSX.read(buf, { type: "array" });
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
  const col = (label: string) => header.indexOf(label);

  const cCompany = col("업체");
  const cCategory = col("구분");
  const cNo = col("순번");
  const cName = col("성명");
  const cTotal = col("출역일수");
  const cRate = col("노무비단가");
  const cPay = col("노무비총액");
  if (cCompany < 0 || cName < 0)
    throw new Error(
      `'${sheetName}' 시트에서 '업체'/'성명' 헤더를 찾지 못했습니다. 양식을 확인해 주세요.`
    );

  const dayCols = new Map<number, number>();
  header.forEach((h, i) => {
    const d = Number(h);
    if (Number.isInteger(d) && d >= 1 && d <= 31) dayCols.set(d, i);
  });
  if (dayCols.size === 0)
    throw new Error("일자(1~31) 열을 찾지 못했습니다. 양식을 확인해 주세요.");

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
    const totalGongsu = Number.isFinite(totalRaw) ? round2(totalRaw) : round2(sum);
    const totalPay = Number.isFinite(payRaw)
      ? Math.round(payRaw)
      : Math.round(totalGongsu * rate);

    workers.push({
      company: String(row[cCompany] ?? "").trim() || "(미지정)",
      category: cCategory >= 0 ? String(row[cCategory] ?? "").trim() : "",
      no: cNo >= 0 ? Number(row[cNo]) || workers.length + 1 : workers.length + 1,
      name: String(name).trim(),
      days,
      totalGongsu,
      rate,
      totalPay,
    });
  }

  if (workers.length === 0) throw new Error("인원 데이터가 없습니다.");
  return { label: "", daysInMonth: 31, workers };
}
