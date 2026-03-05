import { useState, useMemo } from "react";

const TABS = ["Cân đối kế toán", "Kết quả kinh doanh", "LCTT trực tiếp", "Chỉ số tài chính"];

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = parseFloat(v);
  if (isNaN(n)) return "-";
  if (n < 0) return `(${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })})`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
};

const fmtPct = (v) => {
  if (v === null || v === undefined) return "-";
  const n = parseFloat(v);
  if (isNaN(n)) return "-";
  return `${(n * 100).toFixed(1)}%`;
};

const fmtX = (v) => {
  if (v === null || v === undefined) return "-";
  const n = parseFloat(v);
  if (isNaN(n)) return "-";
  return `${n.toFixed(2)}x`;
};

// ── Builders ───────────────────────────────────────────────────────────────
function buildBalanceSheet(items, headers) {
  const g = (field) => headers.map(h => fmt(items[h]?.[field]));
  return [
    { id:"ts",     pid:null,   label:"A. TÀI SẢN NGẮN HẠN",            lv:0, bold:1, hl:0, sec:0, vals:g("shortAsset") },
    { id:"ts-1",   pid:"ts",   label:"I. Tiền và các khoản tương đương tiền",  lv:1, bold:1, hl:0, sec:0, vals:g("cash") },
    { id:"ts-4",   pid:"ts",   label:"IV. Hàng tồn kho",                        lv:1, bold:1, hl:0, sec:0, vals:g("inventory") },
    { id:"total-ts",pid:null,   label:"TỔNG TÀI SẢN",                          lv:0, bold:1, hl:1, sec:0, vals:g("asset") },
    { id:"vcsh",   pid:null,   label:"B. VỐN CHỦ SỞ HỮU",                      lv:0, bold:1, hl:0, sec:0, vals:g("equity") },
  ];
}

function buildIncomeStatement(items, headers) {
  const g = (field) => headers.map(h => fmt(items[h]?.[field]));
  return [
    { id:"dt",      pid:null,    label:"1. Doanh thu thuần",                   lv:0, bold:1, hl:0, sec:0, vals:g("revenue") },
    { id:"ln-gop",  pid:null,    label:"3. Lợi nhuận gộp",                     lv:0, bold:1, hl:1, sec:0, vals:g("grossProfit") },
    { id:"lnst",    pid:null,    label:"10. Lợi nhuận sau thuế",               lv:0, bold:1, hl:1, sec:0, vals:g("postTaxProfit") },
  ];
}

function buildCashFlow(items, headers) {
  const g = (field) => headers.map(h => fmt(items[h]?.[field]));
  return [
    { id:"hd1",    pid:null,  label:"I. LCTT TỪ HĐKD",                        lv:0, bold:1, hl:1, sec:0, vals:g("operationCashFlow") },
    { id:"lctt",   pid:null,  label:"LCTT THUẦN TRONG KỲ",                     lv:0, bold:1, hl:0, sec:0, vals:g("netCashFlow") },
  ];
}

function buildRatios(items, headers) {
  const g = (field, fn) => headers.map(h => (fn || fmt)(items[h]?.[field]));
  return [
    { id:"s2-1", pid:null, label:"ROE (%)",                        lv:0, bold:1, hl:0, sec:0, vals:g("roe", fmtPct) },
    { id:"s4-2", pid:null, label:"P/E (x)",                        lv:0, bold:1, hl:0, sec:0, vals:g("priceToEarning", fmtX) },
  ];
}

const TYPE_MAP = {
  "Cân đối kế toán": "balancesheet",
  "Kết quả kinh doanh": "incomestatement",
  "LCTT trực tiếp": "cashflow",
  "Chỉ số tài chính": "ratio",
};

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("Kết quả kinh doanh");
  const [ticker, setTicker] = useState("MWG");
  const [period, setPeriod] = useState("yearly");
  const [numPeriods, setNumPeriods] = useState(5);
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cacheKey = `${ticker}-${period}`;

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const types = ["balancesheet", "incomestatement", "cashflow", "ratio"];
      const results = await Promise.all(
        types.map(type =>
          fetch(`/api/finance?ticker=${ticker}&type=${type}&yearly=${period === "yearly" ? 1 : 0}&size=10`)
            .then(r => r.json())
        )
      );
      setAllData(prev => ({
        ...prev,
        [cacheKey]: { balancesheet: results[0], incomestatement: results[1], cashflow: results[2], ratio: results[3] }
      }));
    } catch (e) {
      setError("Lỗi tải dữ liệu.");
    }
    setLoading(false);
  }

  const { rows, headers } = useMemo(() => {
    const cached = allData[cacheKey];
    if (!cached) return { rows: [], headers: [] };

    const typeKey = TYPE_MAP[activeTab];
    const raw = cached[typeKey];

    // ĐÃ SỬA: Thêm ngoặc đơn để tránh lỗi build Vercel
    if (!raw || ( !raw.listFinancialRatio && !raw.listBalanceSheet && !raw.listIncomeStatement && !raw.listCashFlow )) {
      return { rows: [], headers: [] };
    }

    const listKey = {
      balancesheet: "listBalanceSheet",
      incomestatement: "listIncomeStatement",
      cashflow: "listCashFlow",
      ratio: "listFinancialRatio",
    }[typeKey];

    const list = raw[listKey] || [];
    if (!list.length) return { rows: [], headers: [] };

    const itemMap = {};
    list.forEach(item => {
      const label = period === "yearly" ? String(item.year || item.fiscalYear) : `Q${item.quarter}/${String(item.year).slice(-2)}`;
      itemMap[label] = item;
    });

    const sortedHeaders = Object.keys(itemMap).sort().slice(-numPeriods);

    let builtRows = [];
    if (typeKey === "balancesheet") builtRows = buildBalanceSheet(itemMap, sortedHeaders);
    else if (typeKey === "incomestatement") builtRows = buildIncomeStatement(itemMap, sortedHeaders);
    else if (typeKey === "cashflow") builtRows = buildCashFlow(itemMap, sortedHeaders);
    else if (typeKey === "ratio") builtRows = buildRatios(itemMap, sortedHeaders);

    return { rows: builtRows, headers: sortedHeaders };
  }, [allData, cacheKey, activeTab, numPeriods, period]);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", color: "#fff", padding: "20px" }}>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} style={{ background: "#1a2035", color: "#fff", border: "1px solid #2a3550", padding: "5px" }} />
        <button onClick={loadData} style={{ background: "#2563eb", border: "none", color: "#fff", padding: "5px 15px", cursor: "pointer" }}>Tải dữ liệu</button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? "#2563eb" : "transparent", border: "1px solid #2563eb", color: "#fff", padding: "5px 10px", cursor: "pointer" }}>{t}</button>
        ))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#64748b" }}>
            <th style={{ padding: "10px" }}>Chỉ tiêu</th>
            {headers.map(h => <th key={h} style={{ textAlign: "right", padding: "10px" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #1e2535" }}>
              <td style={{ padding: "10px", fontWeight: r.bold ? "bold" : "normal" }}>{r.label}</td>
              {r.vals.map((v, j) => <td key={j} style={{ textAlign: "right", padding: "10px" }}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
