import { useMemo, useRef, useState } from "react";
import type { CompanySummary, PageKey, StoredDataset } from "./types";
import { parseGongsuWorkbook } from "./lib/parseExcel";
import { loadDatasets, newId, saveDatasets } from "./lib/storage";
import { makeDemoDataset } from "./lib/demoData";
import { fmtGongsu, fmtNum, fmtWon } from "./lib/format";
import { KpiCards } from "./components/KpiCards";
import { CompanySection } from "./components/CompanySection";
import { DailyChart } from "./components/DailyChart";
import { WorkerTable } from "./components/WorkerTable";
import { EmptyState } from "./components/EmptyState";
import { SettlementPage } from "./components/SettlementPage";

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

const NAV: { key: PageKey; label: string; ready: boolean }[] = [
  { key: "gongsu", label: "📊 인력공수 관리", ready: true },
  { key: "settlement", label: "🧾 노무비 정산", ready: true },
  { key: "site", label: "🏗️ 현장 관리", ready: false },
  { key: "docs", label: "📁 문서 관리", ready: false },
];

export default function App() {
  const [datasets, setDatasets] = useState<StoredDataset[]>(loadDatasets);
  const [activeId, setActiveId] = useState<string | null>(
    () => loadDatasets()[0]?.id ?? null
  );
  const [page, setPage] = useState<PageKey>("gongsu");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = datasets.find((d) => d.id === activeId) ?? datasets[0] ?? null;
  const dataset = active?.data ?? null;

  const companies = useMemo(
    () => (dataset ? [...new Set(dataset.workers.map((w) => w.company))] : []),
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
      dataset
        ? companies.map((company) => {
            const ws = dataset.workers.filter((w) => w.company === company);
            return {
              company,
              headcount: ws.length,
              totalGongsu: ws.reduce((s, w) => s + w.totalGongsu, 0),
              totalPay: ws.reduce((s, w) => s + w.totalPay, 0),
            };
          })
        : [],
    [dataset, companies]
  );

  function persist(next: StoredDataset[], nextActiveId: string | null) {
    setDatasets(next);
    setActiveId(nextActiveId);
    const err = saveDatasets(next);
    if (err) setError(err);
  }

  async function onFile(file: File) {
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseGongsuWorkbook(buf);
      parsed.label = file.name.replace(/\.(xlsx|xls|xlsm)$/i, "");
      const stored: StoredDataset = {
        id: newId(),
        label: parsed.label,
        savedAt: new Date().toISOString(),
        data: parsed,
      };
      persist([stored, ...datasets.filter((d) => !d.isDemo)], stored.id);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일을 읽지 못했습니다.");
    }
  }

  function onDemo() {
    const demo: StoredDataset = {
      id: newId(),
      label: "데모 데이터 (가상)",
      savedAt: new Date().toISOString(),
      isDemo: true,
      data: makeDemoDataset(),
    };
    persist([demo, ...datasets.filter((d) => !d.isDemo)], demo.id);
    setError(null);
  }

  function onDelete(id: string) {
    const target = datasets.find((d) => d.id === id);
    if (!target) return;
    if (!window.confirm(`'${target.label}' 데이터를 삭제할까요?`)) return;
    const next = datasets.filter((d) => d.id !== id);
    persist(next, next[0]?.id ?? null);
  }

  const uploadInput = (
    <input
      ref={fileRef}
      type="file"
      accept=".xlsx,.xls,.xlsm"
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
        e.target.value = "";
      }}
    />
  );

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <h1>신정개발</h1>
          <p>일용인력 대시보드</p>
        </div>
        <nav>
          {NAV.map((n) =>
            n.ready ? (
              <button
                key={n.key}
                className={`nav-item ready ${page === n.key ? "active" : ""}`}
                onClick={() => setPage(n.key)}
              >
                {n.label}
              </button>
            ) : (
              <button key={n.key} className="nav-item soon" disabled>
                {n.label} <span className="badge">준비중</span>
              </button>
            )
          )}
        </nav>
        <div className="privacy-note">
          🔒 업로드한 데이터는 이 컴퓨터의 브라우저에만 저장되며 서버로 전송되지
          않습니다.
        </div>
      </aside>

      <main className="main">
        {!dataset ? (
          <>
            <EmptyState
              onUploadClick={() => fileRef.current?.click()}
              onDemo={onDemo}
            />
            {error && <div className="error-box">⚠ {error}</div>}
            {uploadInput}
          </>
        ) : (
          <>
            <div className="page-head">
              <div>
                <h2>
                  {page === "settlement"
                    ? "노무비 정산"
                    : "인력공수 계산 대시보드"}
                </h2>
                <p className="sub">
                  현재 데이터: <strong>{active!.label}</strong> · 인원{" "}
                  {fmtNum(dataset.workers.length)}명 · 업체 {companies.length}곳
                </p>
              </div>
              <div className="head-actions">
                <select
                  value={active!.id}
                  onChange={(e) => setActiveId(e.target.value)}
                  title="보관된 데이터 전환"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <button
                  className="upload-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  ⬆ 엑셀 업로드
                </button>
                <button
                  className="ghost-btn"
                  onClick={() => onDelete(active!.id)}
                >
                  삭제
                </button>
              </div>
            </div>
            {uploadInput}

            {error && <div className="error-box">⚠ {error}</div>}

            {page === "settlement" ? (
              <SettlementPage dataset={dataset} colorOf={colorOf} />
            ) : (
              <>
                <KpiCards dataset={dataset} />
                <div className="two-col">
                  <CompanySection summaries={summaries} colorOf={colorOf} />
                  <DailyChart
                    dataset={dataset}
                    companies={companies}
                    colorOf={colorOf}
                  />
                </div>
                <WorkerTable
                  dataset={dataset}
                  companies={companies}
                  colorOf={colorOf}
                />
              </>
            )}

            <p className="footer-note">
              🔒 데이터는 이 브라우저(내 컴퓨터)에만 저장됩니다 · 총 노무비{" "}
              {fmtWon(summaries.reduce((s, c) => s + c.totalPay, 0))} / 총 공수{" "}
              {fmtGongsu(summaries.reduce((s, c) => s + c.totalGongsu, 0))}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
