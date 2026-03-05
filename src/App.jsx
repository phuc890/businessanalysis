import { useState, useMemo } from "react";

const TABS = ["Cân đối kế toán", "Kết quả kinh doanh", "LCTT trực tiếp", "Chỉ số tài chính"];

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = parseFloat(v);
  if (isNaN(n)) return "-";
  // TCBS trả về đơn vị tỷ đồng
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

// ── Map TCBS data → rows ───────────────────────────────────────────────────
function buildBalanceSheet(items, headers) {
  const g = (field) => headers.map(h => fmt(items[h]?.[field]));
  return [
    { id:"ts",      pid:null,   label:"A. TÀI SẢN NGẮN HẠN",                  lv:0, bold:1, hl:0, sec:0, vals:g("shortAsset") },
    { id:"ts-1",    pid:"ts",   label:"I. Tiền và các khoản tương đương tiền",  lv:1, bold:1, hl:0, sec:0, vals:g("cash") },
    { id:"ts-2",    pid:"ts",   label:"II. ĐTTC ngắn hạn",                      lv:1, bold:1, hl:0, sec:0, vals:g("shortInvest") },
    { id:"ts-3",    pid:"ts",   label:"III. Các khoản phải thu ngắn hạn",       lv:1, bold:1, hl:0, sec:0, vals:g("shortReceivable") },
    { id:"ts-4",    pid:"ts",   label:"IV. Hàng tồn kho",                       lv:1, bold:1, hl:0, sec:0, vals:g("inventory") },
    { id:"ts-5",    pid:"ts",   label:"V. Tài sản ngắn hạn khác",               lv:1, bold:0, hl:0, sec:0, vals:g("otherShortAsset") },
    { id:"tsdh",    pid:null,   label:"B. TÀI SẢN DÀI HẠN",                    lv:0, bold:1, hl:0, sec:0, vals:g("longAsset") },
    { id:"tsdh-1",  pid:"tsdh", label:"I. Phải thu dài hạn",                   lv:1, bold:0, hl:0, sec:0, vals:g("longReceivable") },
    { id:"tsdh-2",  pid:"tsdh", label:"II. Tài sản cố định",                   lv:1, bold:1, hl:0, sec:0, vals:g("fixedAsset") },
    { id:"tsdh-3",  pid:"tsdh", label:"III. ĐTTC dài hạn",                     lv:1, bold:0, hl:0, sec:0, vals:g("longInvest") },
    { id:"tsdh-4",  pid:"tsdh", label:"IV. Tài sản dài hạn khác",              lv:1, bold:0, hl:0, sec:0, vals:g("otherLongAsset") },
    { id:"total-ts",pid:null,   label:"TỔNG TÀI SẢN",                          lv:0, bold:1, hl:1, sec:0, vals:g("asset") },
    { id:"no",      pid:null,   label:"A. NỢ PHẢI TRẢ",                        lv:0, bold:1, hl:0, sec:0, vals:g("debt") },
    { id:"no-1",    pid:"no",   label:"I. Nợ ngắn hạn",                        lv:1, bold:1, hl:0, sec:0, vals:g("shortDebt") },
    { id:"no-1-1",  pid:"no-1", label:"1. Vay và nợ thuê TC ngắn hạn",         lv:2, bold:0, hl:0, sec:0, vals:g("shortLoan") },
    { id:"no-1-2",  pid:"no-1", label:"2. Phải trả người bán",                 lv:2, bold:0, hl:0, sec:0, vals:g("tradePayable") },
    { id:"no-2",    pid:"no",   label:"II. Nợ dài hạn",                        lv:1, bold:1, hl:0, sec:0, vals:g("longDebt") },
    { id:"no-2-1",  pid:"no-2", label:"1. Vay và nợ thuê TC dài hạn",          lv:2, bold:0, hl:0, sec:0, vals:g("longLoan") },
    { id:"vcsh",    pid:null,   label:"B. VỐN CHỦ SỞ HỮU",                    lv:0, bold:1, hl:0, sec:0, vals:g("equity") },
    { id:"vcsh-1",  pid:"vcsh", label:"I. Vốn chủ sở hữu",                    lv:1, bold:1, hl:0, sec:0, vals:g("capital") },
    { id:"vcsh-2",  pid:"vcsh", label:"II. Lợi ích CĐKKS",                    lv:1, bold:0, hl:0, sec:0, vals:g("minorShareHolderProfit") },
    { id:"total-nv",pid:null,   label:"TỔNG NGUỒN VỐN",                        lv:0, bold:1, hl:1, sec:0, vals:g("asset") },
  ];
}

function buildIncomeStatement(items, headers) {
  const g = (field) => headers.map(h => fmt(items[h]?.[field]));
  return [
    { id:"dt",      pid:null,    label:"1. Doanh thu thuần",                   lv:0, bold:1, hl:0, sec:0, vals:g("revenue") },
    { id:"gvhb",    pid:null,    label:"2. Giá vốn hàng bán",                  lv:0, bold:0, hl:0, sec:0, vals:g("costOfGoodSold") },
    { id:"ln-gop",  pid:null,    label:"3. Lợi nhuận gộp",                     lv:0, bold:1, hl:1, sec:0, vals:g("grossProfit") },
    { id:"dtc",     pid:null,    label:"4. Doanh thu tài chính",               lv:0, bold:0, hl:0, sec:0, vals:g("financialRevenue") },
    { id:"cptc",    pid:null,    label:"5. Chi phí tài chính",                 lv:0, bold:1, hl:0, sec:0, vals:g("financialExpense") },
    { id:"lai-vay", pid:"cptc",  label:"  - Chi phí lãi vay",                  lv:1, bold:0, hl:0, sec:0, vals:g("interestExpense") },
    { id:"cpbh",    pid:null,    label:"6. Chi phí bán hàng",                  lv:0, bold:0, hl:0, sec:0, vals:g("sellingExpense") },
    { id:"cpql",    pid:null,    label:"7. Chi phí quản lý",                   lv:0, bold:0, hl:0, sec:0, vals:g("managementExpense") },
    { id:"ln-hd",   pid:null,    label:"8. Lợi nhuận thuần HĐKD",              lv:0, bold:1, hl:0, sec:0, vals:g("operationProfit") },
    { id:"lntt",    pid:null,    label:"9. Lợi nhuận trước thuế",              lv:0, bold:1, hl:1, sec:0, vals:g("preTaxProfit") },
    { id:"lnst",    pid:null,    label:"10. Lợi nhuận sau thuế",               lv:0, bold:1, hl:1, sec:0, vals:g("postTaxProfit") },
    { id:"lnst-me", pid:"lnst",  label:"  - LN thuộc cổ đông công ty mẹ",      lv:1, bold:0, hl:0, sec:0, vals:g("shareHolderIncome") },
    { id:"lnst-kks",pid:"lnst",  label:"  - Lợi ích cổ đông không kiểm soát",  lv:1, bold:0, hl:0, sec:0, vals:g("minorShareHolderProfit") },
    { id:"eps",     pid:null,    label:"11. EPS (đồng)",                       lv:0, bold:1, hl:0, sec:0, vals:g("earningPerShare") },
  ];
}

function buildCashFlow(items, headers) {
  const g = (field) => headers.map(h => fmt(items[h]?.[field]));
  return [
    { id:"hd1",    pid:null,  label:"I. LCTT TỪ HĐKD",                       lv:0, bold:1, hl:1, sec:0, vals:g("operationCashFlow") },
    { id:"hd1-1",  pid:"hd1", label:"1. LN trước thuế",                       lv:1, bold:0, hl:0, sec:0, vals:g("incomeTax") },
    { id:"hd1-2",  pid:"hd1", label:"2. Khấu hao TSCĐ",                       lv:1, bold:0, hl:0, sec:0, vals:g("depreciation") },
    { id:"hd1-3",  pid:"hd1", label:"3. Tăng/giảm phải thu",                  lv:1, bold:0, hl:0, sec:0, vals:g("changeInReceivables") },
    { id:"hd1-4",  pid:"hd1", label:"4. Tăng/giảm hàng tồn kho",              lv:1, bold:0, hl:0, sec:0, vals:g("changeInInventory") },
    { id:"hd1-5",  pid:"hd1", label:"5. Tăng/giảm phải trả",                  lv:1, bold:0, hl:0, sec:0, vals:g("changeInPayable") },
    { id:"hd2",    pid:null,  label:"II. LCTT TỪ HĐ ĐẦU TƯ",                 lv:0, bold:1, hl:1, sec:0, vals:g("investCashFlow") },
    { id:"hd2-1",  pid:"hd2", label:"1. Mua sắm TSCĐ",                        lv:1, bold:0, hl:0, sec:0, vals:g("capex") },
    { id:"hd3",    pid:null,  label:"III. LCTT TỪ HĐ TÀI CHÍNH",             lv:0, bold:1, hl:1, sec:0, vals:g("financeCashFlow") },
    { id:"hd3-1",  pid:"hd3", label:"1. Tiền vay nhận được",                  lv:1, bold:0, hl:0, sec:0, vals:g("loanReceipt") },
    { id:"hd3-2",  pid:"hd3", label:"2. Tiền chi trả nợ gốc",                 lv:1, bold:0, hl:0, sec:0, vals:g("loanPayment") },
    { id:"hd3-3",  pid:"hd3", label:"3. Cổ tức đã trả",                       lv:1, bold:0, hl:0, sec:0, vals:g("dividendPayment") },
    { id:"lctt",   pid:null,  label:"LCTT THUẦN TRONG KỲ",                    lv:0, bold:1, hl:0, sec:0, vals:g("netCashFlow") },
    { id:"tien-ck",pid:null,  label:"Tiền và TĐT cuối kỳ",                    lv:0, bold:1, hl:1, sec:0, vals:g("endCash") },
  ];
}

function buildRatios(items, headers) {
  const g = (field, fn) => headers.map(h => (fn || fmt)(items[h]?.[field]));
  return [
    { id:"s1",   pid:null, label:"TĂNG TRƯỞNG",                  lv:0, bold:1, hl:0, sec:1, vals:headers.map(()=>"") },
    { id:"s1-1", pid:"s1", label:"Tăng trưởng doanh thu",         lv:1, bold:0, hl:0, sec:0, vals:g("revenueGrowth", fmtPct) },
    { id:"s1-2", pid:"s1", label:"Tăng trưởng LNST",              lv:1, bold:0, hl:0, sec:0, vals:g("postTaxProfitGrowth", fmtPct) },
    { id:"s2",   pid:null, label:"SINH LỜI",                      lv:0, bold:1, hl:0, sec:1, vals:headers.map(()=>"") },
    { id:"s2-1", pid:"s2", label:"ROE (%)",                       lv:1, bold:0, hl:0, sec:0, vals:g("roe", fmtPct) },
    { id:"s2-2", pid:"s2", label:"ROA (%)",                       lv:1, bold:0, hl:0, sec:0, vals:g("roa", fmtPct) },
    { id:"s2-3", pid:"s2", label:"Biên LN gộp (%)",               lv:1, bold:0, hl:0, sec:0, vals:g("grossProfitMargin", fmtPct) },
    { id:"s2-4", pid:"s2", label:"Biên LN ròng (%)",              lv:1, bold:0, hl:0, sec:0, vals:g("netProfitMargin", fmtPct) },
    { id:"s3",   pid:null, label:"ĐÒN BẨY & THANH KHOẢN",        lv:0, bold:1, hl:0, sec:1, vals:headers.map(()=>"") },
    { id:"s3-1", pid:"s3", label:"Nợ/Vốn CSH",                   lv:1, bold:0, hl:0, sec:0, vals:g("debtOnEquity", fmtX) },
    { id:"s3-2", pid:"s3", label:"Thanh toán hiện hành",          lv:1, bold:0, hl:0, sec:0, vals:g("currentRatio", fmtX) },
    { id:"s3-3", pid:"s3", label:"Thanh toán nhanh",              lv:1, bold:0, hl:0, sec:0, vals:g("quickRatio", fmtX) },
    { id:"s4",   pid:null, label:"ĐỊNH GIÁ",                      lv:0, bold:1, hl:0, sec:1, vals:headers.map(()=>"") },
    { id:"s4-1", pid:"s4", label:"EPS (đồng)",                    lv:1, bold:1, hl:0, sec:0, vals:g("earningPerShare") },
    { id:"s4-2", pid:"s4", label:"P/E (x)",                       lv:1, bold:0, hl:0, sec:0, vals:g("priceToEarning", fmtX) },
    { id:"s4-3", pid:"s4", label:"P/B (x)",                       lv:1, bold:0, hl:0, sec:0, vals:g("priceToBook", fmtX) },
  ];
}

const INDENT = { 0: 0, 1: 16, 2: 32, 3: 48 };
const TYPE_MAP = {
  "Cân đối kế toán": "balancesheet",
  "Kết quả kinh doanh": "incomestatement",
  "LCTT trực tiếp": "cashflow",
  "Chỉ số tài chính": "ratio",
};

export default function App() {
  const [activeTab, setActiveTab] = useState("Kết quả kinh doanh");
  const [ticker, setTicker] = useState("MWG");
  const [period, setPeriod] = useState("yearly");
  const [numPeriods, setNumPeriods] = useState(5);
  const [collapsed, setCollapsed] = useState({});
  const [analysis, setAnalysis] = useState("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Data state
  const [allData, setAllData] = useState({});   // { "MWG-yearly": { balancesheet: {...}, ... } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadedTicker, setLoadedTicker] = useState("");

  const cacheKey = `${ticker}-${period}`;
  const isYearly = period === "yearly" ? 1 : 0;

  // Fetch all 4 reports at once
  async function loadData() {
    setLoading(true);
    setError("");
    setAnalysis("");
    try {
      const types = ["balancesheet", "incomestatement", "cashflow", "ratio"];
      const results = await Promise.all(
        types.map(type =>
          fetch(`/api/finance?ticker=${ticker}&type=${type}&yearly=${isYearly}&size=10`)
            .then(r => r.json())
        )
      );
      const [bs, is, cf, rt] = results;
      setAllData(prev => ({
        ...prev,
        [cacheKey]: { balancesheet: bs, incomestatement: is, cashflow: cf, ratio: rt }
      }));
      setLoadedTicker(ticker);
    } catch (e) {
      setError("Không thể tải dữ liệu. Kiểm tra mã cổ phiếu và thử lại.");
    }
    setLoading(false);
  }

  // Build rows from cached data
  const { rows, headers } = useMemo(() => {
    const cached = allData[cacheKey];
    if (!cached) return { rows: [], headers: [] };

    const typeKey = TYPE_MAP[activeTab];
    const raw = cached[typeKey];
    if (!raw || !raw.listFinancialRatio && !raw.listBalanceSheet && !raw.listIncomeStatement && !raw.listCashFlow) {
      return { rows: [], headers: [] };
    }

    // TCBS returns different array keys per endpoint
    const listKey = {
      balancesheet: "listBalanceSheet",
      incomestatement: "listIncomeStatement",
      cashflow: "listCashFlow",
      ratio: "listFinancialRatio",
    }[typeKey];

    const list = raw[listKey] || [];
    if (!list.length) return { rows: [], headers: [] };

    // Build a map: { "2024": { revenue: 123, ... }, ... }
    const itemMap = {};
    list.forEach(item => {
      const label = period === "yearly"
        ? String(item.year || item.fiscalYear || "")
        : `Q${item.quarter}/${String(item.year).slice(-2)}`;
      itemMap[label] = item;
    });

    // Sort headers: years ascending, quarters as-is
    const sortedHeaders = Object.keys(itemMap).sort((a, b) => {
      if (period === "yearly") return parseInt(a) - parseInt(b);
      // For quarters, keep natural order from API
      return 0;
    }).slice(-numPeriods);

    let builtRows = [];
    if (typeKey === "balancesheet") builtRows = buildBalanceSheet(itemMap, sortedHeaders);
    else if (typeKey === "incomestatement") builtRows = buildIncomeStatement(itemMap, sortedHeaders);
    else if (typeKey === "cashflow") builtRows = buildCashFlow(itemMap, sortedHeaders);
    else if (typeKey === "ratio") builtRows = buildRatios(itemMap, sortedHeaders);

    return { rows: builtRows, headers: sortedHeaders };
  }, [allData, cacheKey, activeTab, numPeriods, period]);

  const parentIds = useMemo(() => {
    const s = new Set();
    rows.forEach(r => { if (r.pid) s.add(r.pid); });
    return s;
  }, [rows]);

  const visibleRows = useMemo(() => {
    const rowMap = {};
    rows.forEach(r => { rowMap[r.id] = r; });
    return rows.filter(row => {
      if (!row.pid) return true;
      let pid = row.pid;
      while (pid) {
        if (collapsed[pid]) return false;
        pid = rowMap[pid]?.pid || null;
      }
      return true;
    });
  }, [rows, collapsed]);

  const toggleCollapse = (id) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  async function analyzeWithClaude() {
    if (!rows.length) return;
    setLoadingAnalysis(true);
    setAnalysis("");
    try {
      const tableText = visibleRows
        .filter(r => !r.sec)
        .map(r => `${r.label}: ${r.vals.join(" | ")}`)
        .join("\n");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "Bạn là chuyên gia phân tích tài chính doanh nghiệp Việt Nam. Phân tích ngắn gọn bằng tiếng Việt, tập trung xu hướng, điểm mạnh/yếu và rủi ro. Dùng emoji.",
          messages: [{ role: "user", content: `Phân tích ${activeTab} (${period === "yearly" ? "theo năm" : "theo quý"}) của ${loadedTicker} (tỷ đồng), kỳ: ${headers.join(", ")}:\n\n${tableText}` }]
        })
      });
      const json = await response.json();
      setAnalysis(json.content?.[0]?.text || "Không thể phân tích.");
    } catch { setAnalysis("Lỗi kết nối."); }
    setLoadingAnalysis(false);
  }

  const isNeg = (v) => v && (v.startsWith("(") || (v.startsWith("-") && v.length > 1));
  const hasData = rows.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", color: "#e2e8f0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#131720", borderBottom: "1px solid #1e2535", padding: "0 24px", display: "flex", alignItems: "center", gap: "12px", height: "54px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>F</div>
          <span style={{ fontWeight: "700", fontSize: "15px", color: "#f1f5f9" }}>FinResearch</span>
        </div>
        <div style={{ width: "1px", height: "24px", background: "#1e2535" }} />

        {/* Ticker input + Load */}
        <input
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && loadData()}
          placeholder="VD: MWG"
          style={{ background: "#1a2035", border: "1px solid #2a3550", borderRadius: "6px", padding: "4px 10px", color: "#3b82f6", fontWeight: "700", fontSize: "15px", width: "90px", outline: "none", letterSpacing: "1px" }}
        />
        <button onClick={loadData} disabled={loading}
          style={{ background: loading ? "#1e2535" : "#2563eb", border: "none", borderRadius: "6px", padding: "6px 14px", color: loading ? "#475569" : "#fff", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
          {loading ? "⏳ Đang tải..." : "🔄 Tải dữ liệu"}
        </button>

        {loadedTicker && (
          <span style={{ fontSize: "12px", color: "#22c55e" }}>✓ {loadedTicker} • HOSE</span>
        )}

        <div style={{ marginLeft: "auto" }}>
          <button onClick={analyzeWithClaude} disabled={loadingAnalysis || !hasData}
            style={{ background: !hasData ? "#1e2535" : loadingAnalysis ? "#1e3a5f" : "linear-gradient(135deg, #2563eb, #0891b2)", border: "none", borderRadius: "6px", padding: "6px 16px", color: !hasData || loadingAnalysis ? "#475569" : "#fff", fontSize: "12px", cursor: hasData ? "pointer" : "not-allowed", fontWeight: "600" }}>
            {loadingAnalysis ? "⏳ Đang phân tích..." : "🤖 Phân tích AI"}
          </button>
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Error */}
        {error && (
          <div style={{ background: "#2d0f0f", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#fca5a5", fontSize: "13px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Empty state */}
        {!hasData && !loading && !error && (
          <div style={{ background: "#131720", borderRadius: "8px", padding: "48px", textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>📊</div>
            <div style={{ color: "#64748b", fontSize: "14px", marginBottom: "8px" }}>Nhập mã cổ phiếu và nhấn <strong style={{ color: "#3b82f6" }}>Tải dữ liệu</strong> để bắt đầu</div>
            <div style={{ color: "#475569", fontSize: "12px" }}>Ví dụ: MWG, VNM, HPG, FPT, VCB, TCB...</div>
          </div>
        )}

        {/* Tabs + period controls */}
        {(hasData || loading) && (
          <>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", background: "#131720", borderRadius: "8px 8px 0 0", padding: "4px 4px 0", borderBottom: "1px solid #1e2535", flexWrap: "wrap" }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => { setActiveTab(tab); setAnalysis(""); }}
                  style={{ background: activeTab === tab ? "#0d0f14" : "transparent", border: "none", borderRadius: "6px 6px 0 0", padding: "8px 14px", color: activeTab === tab ? "#3b82f6" : "#64748b", fontSize: "12px", fontWeight: activeTab === tab ? "600" : "400", cursor: "pointer", borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent", whiteSpace: "nowrap" }}>
                  {tab}
                </button>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px 6px" }}>
                <div style={{ display: "flex", background: "#0d0f14", borderRadius: "6px", overflow: "hidden", border: "1px solid #2a3550" }}>
                  {[["yearly","Năm"],["quarterly","Quý"]].map(([p, label]) => (
                    <button key={p} onClick={() => { setPeriod(p); setNumPeriods(5); setAllData({}); setLoadedTicker(""); }}
                      style={{ background: period === p ? "#2563eb" : "transparent", border: "none", padding: "4px 12px", color: period === p ? "#fff" : "#64748b", fontSize: "11px", cursor: "pointer", fontWeight: period === p ? "600" : "400" }}>
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", background: "#0d0f14", borderRadius: "6px", overflow: "hidden", border: "1px solid #2a3550" }}>
                  {[5, 10].map(n => (
                    <button key={n} onClick={() => setNumPeriods(n)}
                      style={{ background: numPeriods === n ? "#2563eb" : "transparent", border: "none", padding: "4px 12px", color: numPeriods === n ? "#fff" : "#64748b", fontSize: "11px", cursor: "pointer", fontWeight: numPeriods === n ? "600" : "400" }}>
                      {n} kỳ
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: "10px", color: "#475569" }}>tỷ đồng</span>
              </div>
            </div>

            {/* Table */}
            <div style={{ background: "#131720", borderRadius: "0 0 8px 8px", overflowX: "auto", marginBottom: "20px" }}>
              {loading ? (
                <div style={{ padding: "48px", textAlign: "center", color: "#475569", fontSize: "13px" }}>⏳ Đang tải dữ liệu từ TCBS...</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: numPeriods === 10 ? "900px" : "600px" }}>
                  <thead>
                    <tr style={{ background: "#0d1220" }}>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", color: "#64748b", fontWeight: "600", borderBottom: "1px solid #1e2535", minWidth: "280px", position: "sticky", left: 0, background: "#0d1220", zIndex: 1 }}>Chỉ tiêu</th>
                      {headers.map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "right", fontSize: "12px", color: "#64748b", fontWeight: "600", borderBottom: "1px solid #1e2535", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((r, i) => {
                      const isSection = r.sec;
                      const hasChildren = parentIds.has(r.id);
                      const isCollapsed = collapsed[r.id];
                      const bg = r.hl ? "#0f1a2e" : isSection ? "#0d1018" : i % 2 === 0 ? "#131720" : "#111520";
                      return (
                        <tr key={r.id} style={{ background: bg, borderBottom: "1px solid #1a2030" }}
                          onMouseEnter={e => { if (!isSection) { e.currentTarget.style.background = "#1a2540"; e.currentTarget.querySelector("td").style.background = "#1a2540"; } }}
                          onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.querySelector("td").style.background = bg; }}>
                          <td style={{
                            padding: isSection ? "10px 16px 4px" : "8px 12px",
                            paddingLeft: `${12 + (INDENT[r.lv] || 0)}px`,
                            fontSize: isSection ? "10px" : "13px",
                            color: isSection ? "#3b82f6" : r.bold ? "#e2e8f0" : "#94a3b8",
                            fontWeight: r.bold ? "600" : "400",
                            letterSpacing: isSection ? "1px" : "0",
                            textTransform: isSection ? "uppercase" : "none",
                            borderLeft: r.hl ? "3px solid #3b82f6" : "3px solid transparent",
                            display: "flex", alignItems: "center", gap: "6px",
                            position: "sticky", left: 0, background: bg, zIndex: 1
                          }}>
                            {hasChildren ? (
                              <button onClick={() => toggleCollapse(r.id)}
                                style={{ background: "#1e2535", border: "none", borderRadius: "3px", width: "16px", height: "16px", cursor: "pointer", color: "#64748b", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {isCollapsed ? "+" : "−"}
                              </button>
                            ) : <span style={{ width: "16px", flexShrink: 0 }} />}
                            {r.label}
                          </td>
                          {r.vals.map((val, j) => (
                            <td key={j} style={{ padding: "8px 16px", textAlign: "right", fontSize: "13px", color: val === "" || val === "-" ? "#334155" : r.hl ? "#60a5fa" : isNeg(val) ? "#f87171" : r.bold ? "#e2e8f0" : "#94a3b8", fontWeight: r.bold ? "600" : "400", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                              {val}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* AI Analysis */}
        {(analysis || loadingAnalysis) && (
          <div style={{ background: "#131720", border: "1px solid #1e3a5f", borderRadius: "8px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <div style={{ width: "22px", height: "22px", background: "linear-gradient(135deg, #2563eb, #06b6d4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>✦</div>
              <span style={{ fontWeight: "600", color: "#60a5fa", fontSize: "14px" }}>Phân tích AI — {activeTab} ({period === "yearly" ? "Năm" : "Quý"})</span>
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#475569" }}>{loadedTicker} • Claude Sonnet</span>
            </div>
            {loadingAnalysis
              ? <div style={{ color: "#475569", fontSize: "13px" }}>⏳ Đang phân tích dữ liệu...</div>
              : <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{analysis}</div>
            }
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d0f14; }
        ::-webkit-scrollbar-thumb { background: #2a3550; border-radius: 3px; }
      `}</style>
    </div>
  );
}
