import { useMemo, useRef, useState } from "react";
import type { CompanySummary, Dataset } from "./types";
import { parseGongsuWorkbook } from "./lib/parseExcel";
import { fmtGongsu, fmtNum, fmtWon } from "./lib/format";
import { KpiCards } from "./components/KpiCards";
import { CompanySection } from "./components/CompanySection";
import { DailyChart } from "./components/DailyChart";
import { WorkerTable } from "./components/WorkerTable";
import sampleData from "./data/sample.json";

export const COMPANY_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#0ea5e9",
  "#d946ef",
  "#84cc16",
];

export default function App() {
  const [dataset, setDataset] = useState<Dataset>(
    sampleData as unknown as Dataset
  );
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const companies = useMemo(
    () => [...new Set(dataset.workers.map((w) => w.company))],
    [dataset]
  );

  const colorOf = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((c, i) =>
      map.set(c, COMPANY_COLORS[i % COMPANY_COLORS.length])
    );
    return (c: string) => map.get(c) ?? "#94a3b8";
  }, [companies]);

  const summaries: CompanySummary[] = useMemo(
    () =>
      companies.map((company) => {
        const ws = dataset.workers.filter((w) => w.company === company);
        return {
          company,
          headcount: ws.length,
          totalGongsu: ws.reduce((s, w) => s + w.totalGongsu, 0),
          totalPay: ws.reduce((s, w) => s + w.totalPay, 0),
        };
      }),
    [dataset, companies]
  );

  async function onFile(file: File) {
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseGongsuWorkbook(buf);
      parsed.label = file.name.replace(/\.(xlsx|xls)$/i, "");
      setDataset(parsed);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일을 읽지 못했습니다.");
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <h1>신정개발</h1>
          <p>경영지원 대시보드</p>
        </div>
        <nav>
          <button className="nav-item active">📊 인력공수 관리</button>
          <button className="nav-item soon" disabled>
            🧾 노무비 정산 <span className="badge">준비중</span>
          </button>
          <button className="nav-item soon" disabled>
            🏗️ 현장 관리 <span className="badge">준비중</span>
          </button>
          <button className="nav-item soon" disabled>
            📁 문서 관리 <span className="badge">준비중</span>
          </button>
        </nav>
      </aside>

      <main className="main">
        <div className="page-head">
          <div>
            <h2>인력공수 계산 대시보드</h2>
            <p className="sub">
              현재 데이터: <strong>{dataset.label}</strong> · 인원{" "}
              {fmtNum(dataset.workers.length)}명 · 업체 {companies.length}곳
            </p>
          </div>
          <div>
            <button
              className="upload-btn"
              onClick={() => fileRef.current?.click()}
            >
              ⬆ 엑셀 파일 업로드
            </button>
            <p className="upload-hint">
              ‘웹_데이터’ 시트가 있는 공수 엑셀(.xlsx)
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {error && <div className="error-box">⚠ {error}</div>}

        <KpiCards dataset={dataset} />

        <div className="two-col">
          <CompanySection summaries={summaries} colorOf={colorOf} />
          <DailyChart dataset={dataset} companies={companies} colorOf={colorOf} />
        </div>

        <WorkerTable dataset={dataset} companies={companies} colorOf={colorOf} />

        <p className="footer-note">
          업로드한 파일은 브라우저 안에서만 처리되며 서버로 전송되지 않습니다. ·
          총 노무비 {fmtWon(summaries.reduce((s, c) => s + c.totalPay, 0))} / 총
          공수 {fmtGongsu(summaries.reduce((s, c) => s + c.totalGongsu, 0))}
        </p>
      </main>
    </div>
  );
}
