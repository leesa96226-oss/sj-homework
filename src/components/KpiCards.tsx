import type { Dataset } from "../types";
import { fmtGongsu, fmtNum } from "../lib/format";

export function KpiCards({ dataset }: { dataset: Dataset }) {
  const workers = dataset.workers;
  const totalGongsu = workers.reduce((s, w) => s + w.totalGongsu, 0);
  const totalPay = workers.reduce((s, w) => s + w.totalPay, 0);
  const avg = workers.length ? totalGongsu / workers.length : 0;

  const items = [
    { label: "총 투입 인원", value: fmtNum(workers.length), unit: "명" },
    { label: "총 출역 공수", value: fmtGongsu(totalGongsu), unit: "공수" },
    { label: "총 노무비", value: fmtNum(totalPay), unit: "원" },
    { label: "1인 평균 공수", value: fmtGongsu(avg), unit: "공수" },
  ];

  return (
    <div className="kpi-grid">
      {items.map((it) => (
        <div className="kpi" key={it.label}>
          <div className="k-label">{it.label}</div>
          <div className="k-value">
            {it.value}
            <span className="k-unit">{it.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
