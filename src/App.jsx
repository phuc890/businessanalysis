import { useState, useMemo, useEffect } from "react";

const TABS = ["Cân đối kế toán", "Kết quả kinh doanh", "LCTT trực tiếp", "Chỉ số tài chính"];

// Helpers định dạng số
const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = parseFloat(v);
  if (isNaN(n)) return "-";
  return n.toLocaleString("en-US");
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
  const [period, setPeriod] = useState("yearly");
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(false);

  // Tự động tải dữ liệu khi vừa mở Web
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const types = ["balancesheet", "incomestatement", "cashflow", "ratio"];
      const isYearlyParam = period === "yearly" ? 1 : 0;
      
      const results = await Promise.all(
        types.map(type =>
          fetch(`/api/finance?ticker=${ticker}&type=${type}&yearly=${isYearlyParam}&size=10`)
            .then(r => r.json())
        )
      );

      const newCache = {
        balancesheet: results[0],
        incomestatement: results[1],
        cashflow: results[2],
        ratio: results[3]
      };

      setAllData(prev => ({ ...prev, [`${ticker}-${period}`]: newCache }));
    } catch (e) {
      console.error("Lỗi tải dữ liệu:", e);
    }
    setLoading(false);
  }

  const { rows, headers } = useMemo(() => {
    const cached = allData[`${ticker}-${period}`];
    if (!cached) return { rows: [], headers: [] };

    const typeKey = TYPE_MAP[activeTab];
    const raw = cached[typeKey];

    // Sửa lỗi logic mix || và && bằng cách dùng ngoặc đơn rõ ràng
    if (!raw || (!raw.listFinancialRatio && !raw.listBalanceSheet && !raw.listIncomeStatement && !raw.listCashFlow)) {
      return { rows: [], headers: [] };
    }

    const listKey = {
      balancesheet: "listBalanceSheet",
      incomestatement: "listIncomeStatement",
      cashflow: "listCashFlow",
      ratio: "listFinancialRatio",
    }[typeKey];

    const list = raw[listKey] || [];
    if (list.length === 0) return { rows: [], headers: [] };

    // Lấy danh sách các năm/quý làm tiêu đề cột
    const sortedHeaders = list
      .map(item => (period === "yearly" ? (item.year || item.fiscalYear) : `Q${item.quarter}-${item.year}`))
      .reverse()
      .slice(-5);

    // Tạo dữ liệu mẫu cho bảng (Bạn có thể thêm các chỉ tiêu khác vào đây)
    const labels = typeKey === "incomestatement" 
      ? [{ lab: "Doanh thu thuần", key: "revenue" }, { lab: "Lợi nhuận gộp", key: "grossProfit" }, { lab: "LN sau thuế", key: "postTaxProfit" }]
      : [{ lab: "Tổng tài sản", key: "asset" }, { lab: "Vốn chủ sở hữu", key: "equity" }];

    const builtRows = labels.map(rowDef => ({
      label: rowDef.lab,
      vals: list.slice(0, 5).reverse().map(item => fmt(item[rowDef.key]))
    }));

    return { rows: builtRows, headers: sortedHeaders };
  }, [allData, activeTab, ticker, period]);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f14", color: "#fff", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <input 
          value={ticker} 
          onChange={e => setTicker(e.target.value.toUpperCase())} 
          style={{ background: "#1a2035", color: "#fff", border: "1px solid #2a3550", padding: "8px", borderRadius: "4px" }} 
        />
        <button 
          onClick={loadData} 
          style={{ background: "#2563eb", border: "none", color: "#fff", padding: "8px 16px", cursor: "pointer", borderRadius: "4px" }}
        >
          {loading ? "Đang tải..." : "Tải dữ liệu"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {TABS.map(t => (
          <button 
            key={t} 
            onClick={() => setActiveTab(t)} 
            style={{ 
              background: activeTab === t ? "#2563eb" : "transparent", 
              border: "1px solid #2563eb", 
              color: "#fff", 
              padding: "8px 12px", 
              cursor: "pointer",
              borderRadius: "4px"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto", background: "#161b2d", borderRadius: "8px", padding: "10px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#94a3b8", borderBottom: "2px solid #2d3748" }}>
              <th style={{ padding: "12px" }}>Chỉ tiêu</th>
              {headers.map(h => <th key={h} style={{ textAlign: "right", padding: "12px" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #2d3748" }}>
                <td style={{ padding: "12px" }}>{r.label}</td>
                {r.vals.map((v, j) => <td key={j} style={{ textAlign: "right", padding: "12px" }}>{v}</td>)}
              </tr>
            )) : (
              <tr>
                <td colSpan={headers.length + 1} style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                  Chưa có dữ liệu. Hãy nhấn "Tải dữ liệu".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
