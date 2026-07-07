import { useMemo, useState } from "react";
import type { Dataset, Worker } from "../types";
import { fmtGongsu, fmtNum, fmtWon } from "../lib/format";

interface Props {
  dataset: Dataset;
  companies: string[];
  colorOf: (c: string) => string;
}

type SortKey = "company" | "name" | "totalGongsu" | "rate" | "totalPay";

export function WorkerTable({ dataset, companies, colorOf }: Props) {
  const [companyFilter, setCompanyFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("company");
  const [sortDesc, setSortDesc] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const rows = useMemo(() => {
    let list = dataset.workers;
    if (companyFilter !== "전체")
      list = list.filter((w) => w.company === companyFilter);
    const q = search.trim();
    if (q) list = list.filter((w) => w.name.includes(q));
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
  }, [dataset, companyFilter, search, sortKey, sortDesc]);

  const sumGongsu = rows.reduce((s, w) => s + w.totalGongsu, 0);
  const sumPay = rows.reduce((s, w) => s + w.totalPay, 0);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDesc(!sortDesc);
    else {
      setSortKey(k);
      setSortDesc(k === "totalGongsu" || k === "totalPay");
    }
  }

  const arrow = (k: SortKey) =>
    sortKey === k ? (sortDesc ? " ▼" : " ▲") : "";

  const keyOf = (w: Worker) => `${w.company}-${w.no}-${w.name}`;

  return (
    <div className="card">
      <h3>인원별 상세 내역</h3>
      <div className="filter-bar">
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
        <input
          placeholder="성명 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="result-count">
          {fmtNum(rows.length)}명 · 행을 클릭하면 일자별 내역이 열립니다
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort("company")}>
                업체{arrow("company")}
              </th>
              <th className="num">순번</th>
              <th className="sortable" onClick={() => toggleSort("name")}>
                성명{arrow("name")}
              </th>
              <th className="num">출역일</th>
              <th
                className="num sortable"
                onClick={() => toggleSort("totalGongsu")}
              >
                출역 공수{arrow("totalGongsu")}
              </th>
              <th className="num sortable" onClick={() => toggleSort("rate")}>
                노무비 단가{arrow("rate")}
              </th>
              <th
                className="num sortable"
                onClick={() => toggleSort("totalPay")}
              >
                노무비 총액{arrow("totalPay")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => {
              const k = keyOf(w);
              const open = openKey === k;
              const workedDays = Object.keys(w.days).length;
              return [
                <tr
                  key={k}
                  className="clickable"
                  onClick={() => setOpenKey(open ? null : k)}
                >
                  <td>
                    <span
                      className="company-chip"
                      style={{ background: colorOf(w.company) }}
                    >
                      {w.company}
                    </span>
                  </td>
                  <td className="num">{w.no}</td>
                  <td>
                    {open ? "▾ " : "▸ "}
                    {w.name}
                  </td>
                  <td className="num">{workedDays}일</td>
                  <td className="num">{fmtGongsu(w.totalGongsu)}</td>
                  <td className="num">{fmtWon(w.rate)}</td>
                  <td className="num">{fmtWon(w.totalPay)}</td>
                </tr>,
                open ? (
                  <tr key={k + "-detail"} className="day-detail">
                    <td colSpan={7}>
                      <div className="day-detail-grid">
                        {Object.entries(w.days)
                          .sort((a, b) => Number(a[0]) - Number(b[0]))
                          .map(([d, v]) => (
                            <div className="day-cell" key={d}>
                              <div className="d">{d}일</div>
                              <div className="v">{fmtGongsu(v)}</div>
                            </div>
                          ))}
                      </div>
                    </td>
                  </tr>
                ) : null,
              ];
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4}>합계 ({fmtNum(rows.length)}명)</td>
              <td className="num">{fmtGongsu(sumGongsu)}</td>
              <td></td>
              <td className="num">{fmtWon(sumPay)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
