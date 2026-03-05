import { useState, useMemo, useEffect } from "react";

const TABS = ["Cân đối kế toán", "Kết quả kinh doanh", "LCTT trực tiếp", "Chỉ số tài chính"];

const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = parseFloat(v);
  return isNaN(n) ? "-" : n.toLocaleString("en-US");
};

const TYPE_MAP = {
  "Cân đối kế toán": "balancesheet",
  "Kết quả kinh doanh": "incomestatement",
  "LCTT trực tiếp": "cashflow",
  "Chỉ số tài chính": "ratio",
};

export default function App() {
  const [activeTab, setActiveTab] = useState("Kết quả kinh doanh");
  const [ticker, setTicker] = useState("MWG");
  const [period, setPeriod] = useState("yearly"); // "yearly" hoặc "quarterly"
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(false);

  // Tự động tải dữ liệu khi mở trang
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const types = ["balancesheet", "incomestatement", "cashflow", "ratio"];
      // FIX: Xác định yearlyParam chuẩn 0 hoặc 1
      const yearlyParam = period === "yearly" ? 1 : 0;
      
      const results = await Promise.all(
        types.map(type =>
          fetch(`/api/finance?ticker=${ticker}&type=${type}&yearly=${yearlyParam}&size=10`)
            .then(res => res.json())
        )
      );

      setAllData(prev => ({
        ...prev,
        [`${ticker}-${period}`]: {
          balancesheet: results[0],
          incomestatement: results[1],
          cashflow: results[2],
          ratio: results[3]
        }
      }));
    } catch (e) {
      console.error("Lỗi fetch:", e);
    }
    setLoading(false);
  }

  const { rows, headers } = useMemo(() => {
    const dataObj = allData[`${ticker}-${period}`];
    if (!dataObj) return { rows: [], headers: [] };

    const typeKey = TYPE_MAP[activeTab];
    const rawData = dataObj[typeKey];

    // FIX: Bọc ngoặc đơn để Vercel build không lỗi logic
    if (!rawData || (!rawData.listFinancialRatio && !rawData.listBalanceSheet && !rawData.listIncomeStatement && !rawData.listCashFlow)) {
      return { rows: [], headers: [] };
    }

    const listKey = {
      balancesheet: "listBalanceSheet",
      incomestatement: "listIncomeStatement",
      cashflow: "listCashFlow",
      ratio: "listFinancialRatio",
    }[typeKey];

    const list = rawData[listKey] || [];
    if (list.length === 0) return { rows: [], headers: [] };

    // Lấy 5 kỳ gần nhất
    const displayList = [...list].reverse().slice(-5);
    const head = displayList.map(item => (period === "yearly" ? (item.year || item.fiscalYear) : `Q${item.quarter}-${item.year}`));

    // Định nghĩa các hàng hiển thị tùy theo Tab
    let rowConfigs = [];
    if (typeKey === "incomestatement") {
      rowConfigs = [
        { label: "Doanh thu thuần", key: "revenue" },
        { label: "Lợi nhuận gộp", key: "grossProfit" },
        { label: "LN sau thuế", key: "postTaxProfit" }
      ];
    } else if (typeKey === "balancesheet") {
      rowConfigs = [
        { label: "Tổng tài sản", key: "asset" },
        { label: "Nợ phải trả", key: "debt" },
        { label: "Vốn chủ sở hữu", key: "equity" }
      ];
    } else {
      rowConfigs = [{ label: "Giá trị", key: Object.keys(displayList[0])[0] }]; // Dự phòng
    }

    const builtRows = rowConfigs.map(cfg => ({
      label: cfg.label,
      vals: displayList.map(item => fmt(item[cfg.key]))
    }));

    return { rows: builtRows, headers: head };
  }, [allData, activeTab, ticker, period]);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", color: "#fff", padding: "20px", fontFamily: "Arial" }}>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input 
          value={ticker} 
          onChange={e => setTicker(e.target.value.toUpperCase())} 
          style={{ background: "#1a2035", color: "#fff", border: "1px solid #2a3550", padding: "8px" }} 
        />
        <button onClick={loadData} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 15px", cursor: "pointer" }}>
          {loading ? "Đang tải..." : "Tải dữ liệu"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? "#2563eb" : "#1e293b", color: "#fff", border: "1px solid #334155", padding: "8px 12px", cursor: "pointer" }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ background: "#161b2d", padding: "15px", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #2d3748", textAlign: "right" }}>
              <th style={{ textAlign: "left", padding: "10px" }}>Chỉ tiêu</th>
              {headers.map(h => <th key={h} style={{ padding: "10px" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #2d3748", textAlign: "right" }}>
                <td style={{ textAlign: "left", padding: "10px" }}>{r.label}</td>
                {r.vals.map((v, j) => <td key={j} style={{ padding: "10px" }}>{v}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px" }}>Chưa có dữ liệu cho mã này.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
