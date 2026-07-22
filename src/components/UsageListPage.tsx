import { useMemo, useState } from "react";
import type { Dataset } from "../types";
import { fmtGongsu, fmtNum, fmtWon } from "../lib/format";

interface Props {
  dataset: Dataset;
  companies: string[];
  colorOf: (c: string) => string;
}

/** 사용 목록의 한 행 = 한 인력의 하루치 사용 기록 */
interface UsageRow {
  day: number;
  company: string;
  name: string;
  gongsu: number;
  rate: number;
  pay: number;
}

type SortKey = keyof UsageRow;

/**
 * '사용 목록' 페이지.
 * 대시보드가 인력별로 묶어 보여주는 것과 달리, 인력의 일자별 공수를
 * 한 줄=하루로 펼쳐서 '날짜 / 업체 / 성명 / 공수 / 단가 / 총액'으로 나열한다.
 * 표시 전용이며 저장 기능은 없다(엑셀에서 읽은 내용을 보여주기만 한다).
 */
export function UsageListPage({ dataset, companies, colorOf }: Props) {
  const allRows = useMemo<UsageRow[]>(() => {
    const rows: UsageRow[] = [];
    for (const w of dataset.workers) {
      for (const [d, g] of Object.entries(w.days)) {
        rows.push({
          day: Number(d),
          company: w.company,
          name: w.name,
          gongsu: g,
          rate: w.rate,
          pay: Math.round(g * w.rate),
        });
      }
    }
    return rows;
  }, [dataset]);

  const [companyFilter, setCompanyFilter] = useState("전체");
  const [fromDay, setFromDay] = useState(1);
  const [toDay, setToDay] = useState(31);
  const [sortKey, setSortKey] = useState<SortKey>("day");
  const [sortDesc, setSortDesc] = useState(false);

  const rows = useMemo(() => {
    const lo = Math.min(fromDay, toDay);
    const hi = Math.max(fromDay, toDay);
    let list = allRows.filter((r) => r.day >= lo && r.day <= hi);
    if (companyFilter !== "전체")
      list = list.filter((r) => r.company === companyFilter);
    const sorted = [...list].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "ko");
      return sortDesc ? -cmp : cmp;
    });
    return sorted;
  }, [allRows, companyFilter, fromDay, toDay, sortKey, sortDesc]);

  const sumGongsu = rows.reduce((s, r) => s + r.gongsu, 0);
  const sumPay = rows.reduce((s, r) => s + r.pay, 0);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDesc(!sortDesc);
    else {
      setSortKey(k);
      setSortDesc(k === "gongsu" || k === "rate" || k === "pay");
    }
  }
  const arrow = (k: SortKey) =>
    sortKey === k ? (sortDesc ? " ▼" : " ▲") : "";

  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="card">
      <h3>사용 목록</h3>
      <div className="filter-bar">
        <label>
          기간
          <select
            value={fromDay}
            onChange={(e) => setFromDay(Number(e.target.value))}
          >
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {d}일
              </option>
            ))}
          </select>
          <span>~</span>
          <select
            value={toDay}
            onChange={(e) => setToDay(Number(e.target.value))}
          >
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {d}일
              </option>
            ))}
          </select>
        </label>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        >
          <option value="전체">업체 전체</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="result-count">
          {fmtNum(rows.length)}건 · 열 제목을 누르면 정렬됩니다
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="num sortable" onClick={() => toggleSort("day")}>
                날짜{arrow("day")}
              </th>
              <th className="sortable" onClick={() => toggleSort("company")}>
                업체{arrow("company")}
              </th>
              <th className="sortable" onClick={() => toggleSort("name")}>
                성명{arrow("name")}
              </th>
              <th className="num sortable" onClick={() => toggleSort("gongsu")}>
                공수{arrow("gongsu")}
              </th>
              <th className="num sortable" onClick={() => toggleSort("rate")}>
                단가{arrow("rate")}
              </th>
              <th className="num sortable" onClick={() => toggleSort("pay")}>
                총액{arrow("pay")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="num">{r.day}일</td>
                <td>
                  <span
                    className="company-chip"
                    style={{ background: colorOf(r.company) }}
                  >
                    {r.company}
                  </span>
                </td>
                <td>{r.name}</td>
                <td className="num">{fmtGongsu(r.gongsu)}</td>
                <td className="num">{fmtWon(r.rate)}</td>
                <td className="num">{fmtWon(r.pay)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>합계 ({fmtNum(rows.length)}건)</td>
              <td className="num">{fmtGongsu(sumGongsu)}</td>
              <td></td>
              <td className="num">{fmtWon(sumPay)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="result-count" style={{ display: "block", padding: "12px 0" }}>
          해당 조건의 사용 내역이 없습니다.
        </p>
      )}
    </div>
  );
}
