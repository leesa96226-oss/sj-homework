import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompanySummary } from "../types";
import { fmtGongsu, fmtNum, fmtWon } from "../lib/format";

interface Props {
  summaries: CompanySummary[];
  colorOf: (c: string) => string;
}

export function CompanySection({ summaries, colorOf }: Props) {
  const totalPay = summaries.reduce((s, c) => s + c.totalPay, 0);
  const totalGongsu = summaries.reduce((s, c) => s + c.totalGongsu, 0);
  const totalHead = summaries.reduce((s, c) => s + c.headcount, 0);

  return (
    <div className="card">
      <h3>업체별 공수 · 노무비</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={summaries} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="company" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v) => [fmtGongsu(Number(v)) + " 공수", "출역 공수"]}
          />
          <Bar dataKey="totalGongsu" radius={[6, 6, 0, 0]}>
            {summaries.map((s) => (
              <Cell key={s.company} fill={colorOf(s.company)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="table-wrap" style={{ marginTop: 10 }}>
        <table>
          <thead>
            <tr>
              <th>업체</th>
              <th className="num">인원</th>
              <th className="num">출역 공수</th>
              <th className="num">노무비</th>
              <th className="num">노무비 비중</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.company}>
                <td>
                  <span
                    className="company-chip"
                    style={{ background: colorOf(s.company) }}
                  >
                    {s.company}
                  </span>
                </td>
                <td className="num">{fmtNum(s.headcount)}명</td>
                <td className="num">{fmtGongsu(s.totalGongsu)}</td>
                <td className="num">{fmtWon(s.totalPay)}</td>
                <td className="num">
                  {totalPay ? ((s.totalPay / totalPay) * 100).toFixed(1) : "0"}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>합계</td>
              <td className="num">{fmtNum(totalHead)}명</td>
              <td className="num">{fmtGongsu(totalGongsu)}</td>
              <td className="num">{fmtWon(totalPay)}</td>
              <td className="num">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
