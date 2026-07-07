import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Dataset } from "../types";
import { fmtGongsu } from "../lib/format";

interface Props {
  dataset: Dataset;
  companies: string[];
  colorOf: (c: string) => string;
}

export function DailyChart({ dataset, companies, colorOf }: Props) {
  const data = useMemo(() => {
    const rows: Record<string, number | string>[] = [];
    for (let d = 1; d <= dataset.daysInMonth; d++) {
      const row: Record<string, number | string> = { day: `${d}` };
      for (const c of companies) row[c] = 0;
      rows.push(row);
    }
    for (const w of dataset.workers) {
      for (const [d, v] of Object.entries(w.days)) {
        const idx = Number(d) - 1;
        if (rows[idx]) {
          rows[idx][w.company] = Math.round(
            ((rows[idx][w.company] as number) + v) * 100
          ) / 100;
        }
      }
    }
    return rows;
  }, [dataset, companies]);

  return (
    <div className="card">
      <h3>일자별 출역 공수 (업체별)</h3>
      <ResponsiveContainer width="100%" height={430}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={1} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v, name) => [fmtGongsu(Number(v)) + " 공수", name]}
            labelFormatter={(l) => `${l}일`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {companies.map((c) => (
            <Bar key={c} dataKey={c} stackId="a" fill={colorOf(c)} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
