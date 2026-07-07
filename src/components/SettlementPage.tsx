import { useMemo } from "react";
import type { Dataset } from "../types";
import { fmtGongsu, fmtNum, fmtWon } from "../lib/format";

interface Props {
  dataset: Dataset;
  colorOf: (c: string) => string;
}

interface RateRow {
  rate: number;
  headcount: number;
  gongsu: number;
  pay: number;
}

interface CompanySettlement {
  company: string;
  rows: RateRow[];
  headcount: number;
  gongsu: number;
  pay: number;
}

/** 업체별 · 단가별로 집계한 노무비 정산서 */
export function SettlementPage({ dataset, colorOf }: Props) {
  const settlements: CompanySettlement[] = useMemo(() => {
    const companies = [...new Set(dataset.workers.map((w) => w.company))];
    return companies.map((company) => {
      const ws = dataset.workers.filter((w) => w.company === company);
      const byRate = new Map<number, RateRow>();
      for (const w of ws) {
        const row =
          byRate.get(w.rate) ??
          ({ rate: w.rate, headcount: 0, gongsu: 0, pay: 0 } as RateRow);
        row.headcount += 1;
        row.gongsu += w.totalGongsu;
        row.pay += w.totalPay;
        byRate.set(w.rate, row);
      }
      const rows = [...byRate.values()].sort((a, b) => a.rate - b.rate);
      return {
        company,
        rows,
        headcount: ws.length,
        gongsu: rows.reduce((s, r) => s + r.gongsu, 0),
        pay: rows.reduce((s, r) => s + r.pay, 0),
      };
    });
  }, [dataset]);

  const grandPay = settlements.reduce((s, c) => s + c.pay, 0);
  const grandGongsu = settlements.reduce((s, c) => s + c.gongsu, 0);
  const grandHead = settlements.reduce((s, c) => s + c.headcount, 0);

  return (
    <div>
      <div className="card print-area">
        <div className="settle-head">
          <h3>업체별 노무비 정산서 — {dataset.label}</h3>
          <button className="ghost-btn no-print" onClick={() => window.print()}>
            🖨 인쇄 / PDF 저장
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>업체</th>
                <th className="num">노무비 단가</th>
                <th className="num">인원</th>
                <th className="num">출역 공수</th>
                <th className="num">노무비 (공수 × 단가)</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((c) =>
                c.rows.map((r, i) => (
                  <tr key={`${c.company}-${r.rate}`}>
                    {i === 0 && (
                      <td rowSpan={c.rows.length + 1}>
                        <span
                          className="company-chip"
                          style={{ background: colorOf(c.company) }}
                        >
                          {c.company}
                        </span>
                      </td>
                    )}
                    <td className="num">{fmtWon(r.rate)}</td>
                    <td className="num">{fmtNum(r.headcount)}명</td>
                    <td className="num">{fmtGongsu(r.gongsu)}</td>
                    <td className="num">{fmtWon(r.pay)}</td>
                  </tr>
                )).concat(
                  <tr key={`${c.company}-sum`} className="subtotal">
                    <td className="num">소계</td>
                    <td className="num">{fmtNum(c.headcount)}명</td>
                    <td className="num">{fmtGongsu(c.gongsu)}</td>
                    <td className="num">{fmtWon(c.pay)}</td>
                  </tr>
                )
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>총 합계</td>
                <td className="num">{fmtNum(grandHead)}명</td>
                <td className="num">{fmtGongsu(grandGongsu)}</td>
                <td className="num">{fmtWon(grandPay)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
