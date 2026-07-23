import { useMemo, useState } from "react";
import type { Dataset } from "../types";
import { fmtGongsu, fmtNum, fmtWon } from "../lib/format";

interface Props {
  dataset: Dataset;
  companies: string[];
  colorOf: (c: string) => string;
}

type Book = "real" | "report";

/**
 * '월별 공수 확인' 페이지.
 * 지급명세서 양식처럼 가로축=일자(1~말일), 세로축=사람인 매트릭스로
 * 각 사람이 그날 나온 공수를 한눈에 본다.
 *
 * 상단 토글로 '실근무본 / 신고본'을 전환하면 표·소계·총계가 선택한 본의
 * 숫자로 다시 그려진다. 표시 전용 페이지다 — 기존 데이터를 읽기만 하며,
 * 정산·공수 계산 로직과 무관하고 새 데이터도 만들지 않는다.
 */
export function MonthlyGongsuPage({ dataset, companies, colorOf }: Props) {
  const [book, setBook] = useState<Book>("real");
  const [companyFilter, setCompanyFilter] = useState("전체");

  const hasReport = (dataset.reportWorkers?.length ?? 0) > 0;

  // 선택한 본의 인력 목록
  const activeWorkers =
    book === "report" ? dataset.reportWorkers ?? [] : dataset.workers;

  const days = useMemo(
    () => Array.from({ length: dataset.daysInMonth }, (_, i) => i + 1),
    [dataset.daysInMonth]
  );

  // 선택한 본 기준 업체 순서.
  // 실근무본은 상위에서 계산해 넘겨준 companies 순서를 그대로 쓰고,
  // 신고본은 신고본 인력에서 직접 뽑는다(신고본 없는 업체는 자연히 빠짐).
  const activeCompanies = useMemo(
    () =>
      book === "report"
        ? [...new Set(activeWorkers.map((w) => w.company))]
        : companies,
    [book, activeWorkers, companies]
  );

  function changeBook(next: Book) {
    if (next === book) return;
    setBook(next);
    setCompanyFilter("전체"); // 본을 바꾸면 업체 필터는 전체로 초기화
  }

  // 업체 순으로 묶은 행 데이터 (원본 순서 유지 + 업체별 소계)
  const groups = useMemo(() => {
    const visible =
      companyFilter === "전체"
        ? activeCompanies
        : activeCompanies.filter((c) => c === companyFilter);
    return visible.map((company) => {
      const workers = activeWorkers.filter((w) => w.company === company);
      const dayTotals: Record<number, number> = {};
      for (const w of workers)
        for (const [d, g] of Object.entries(w.days))
          dayTotals[Number(d)] = (dayTotals[Number(d)] ?? 0) + g;
      const subDays = workers.reduce(
        (s, w) => s + Object.keys(w.days).length,
        0
      );
      const subPay = workers.reduce((s, w) => s + w.totalPay, 0);
      return { company, workers, dayTotals, subDays, subPay };
    });
  }, [activeCompanies, companyFilter, activeWorkers]);

  // 표시 중인 업체 기준 전체 총계 (맨 아래 날짜별 총계 행)
  const grand = useMemo(() => {
    const dayTotals: Record<number, number> = {};
    let totalDays = 0;
    let totalPay = 0;
    for (const g of groups) {
      for (const d of days)
        if (g.dayTotals[d]) dayTotals[d] = (dayTotals[d] ?? 0) + g.dayTotals[d];
      totalDays += g.subDays;
      totalPay += g.subPay;
    }
    const headcount = groups.reduce((s, g) => s + g.workers.length, 0);
    return { dayTotals, totalDays, totalPay, headcount };
  }, [groups, days]);

  return (
    <div className="card">
      <h3>월별 공수 확인</h3>

      <div className="mx-toggle" role="group" aria-label="본 선택">
        <button
          className={book === "real" ? "active" : ""}
          onClick={() => changeBook("real")}
        >
          실근무본
        </button>
        <button
          className={book === "report" ? "active" : ""}
          onClick={() => changeBook("report")}
          disabled={!hasReport}
          title={hasReport ? "" : "신고본 데이터가 없습니다"}
        >
          신고본{!hasReport ? " (없음)" : ""}
        </button>
      </div>

      <div className="filter-bar">
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        >
          <option value="전체">업체 전체</option>
          {activeCompanies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="result-count">
          {book === "report" ? "신고본" : "실근무본"} · {fmtNum(grand.headcount)}
          명 · {fmtNum(groups.length)}개 업체 · 총 노무비{" "}
          {fmtWon(grand.totalPay)} · 좌우로 넘겨 1~{dataset.daysInMonth}일을
          확인하세요
        </span>
      </div>

      <div className="table-wrap">
        <table className="mx">
          <thead>
            <tr>
              <th className="frozen col-co">업체</th>
              <th className="frozen col-cat">직종</th>
              <th className="frozen col-nm">성명</th>
              {days.map((d) => (
                <th key={d} className="mx-day">
                  {d}
                </th>
              ))}
              <th className="frozen col-days num">출역일수</th>
              <th className="frozen col-pay num">노무비총액</th>
            </tr>
          </thead>

          {groups.map((g) => (
            <tbody key={g.company}>
              {g.workers.map((w, i) => (
                <tr key={`${w.company}-${w.no}-${w.name}`}>
                  {i === 0 && (
                    <td className="frozen col-co" rowSpan={g.workers.length}>
                      <span
                        className="company-chip"
                        style={{ background: colorOf(g.company) }}
                      >
                        {g.company}
                      </span>
                    </td>
                  )}
                  <td className="frozen col-cat">{w.category}</td>
                  <td className="frozen col-nm">{w.name}</td>
                  {days.map((d) => {
                    const v = w.days[String(d)];
                    return (
                      <td key={d} className="mx-day">
                        {v ? fmtGongsu(v) : ""}
                      </td>
                    );
                  })}
                  <td className="frozen col-days num">
                    {fmtNum(Object.keys(w.days).length)}
                  </td>
                  <td className="frozen col-pay num">{fmtWon(w.totalPay)}</td>
                </tr>
              ))}
              <tr className="mx-subtotal">
                <td className="frozen mx-sub-label" colSpan={3}>
                  {g.company} 소계 ({fmtNum(g.workers.length)}명)
                </td>
                {days.map((d) => (
                  <td key={d} className="mx-day">
                    {g.dayTotals[d] ? fmtGongsu(g.dayTotals[d]) : ""}
                  </td>
                ))}
                <td className="frozen col-days num">{fmtNum(g.subDays)}</td>
                <td className="frozen col-pay num">{fmtWon(g.subPay)}</td>
              </tr>
            </tbody>
          ))}

          <tfoot>
            <tr className="mx-total">
              <td className="frozen mx-sub-label" colSpan={3}>
                날짜별 총계
              </td>
              {days.map((d) => (
                <td key={d} className="mx-day">
                  {grand.dayTotals[d] ? fmtGongsu(grand.dayTotals[d]) : ""}
                </td>
              ))}
              <td className="frozen col-days num">{fmtNum(grand.totalDays)}</td>
              <td className="frozen col-pay num">{fmtWon(grand.totalPay)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {grand.headcount === 0 && (
        <p
          className="result-count"
          style={{ display: "block", padding: "12px 0" }}
        >
          {book === "report"
            ? "신고본 데이터가 없습니다."
            : "표시할 인력이 없습니다."}
        </p>
      )}
    </div>
  );
}
