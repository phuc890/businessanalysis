export default async function handler(req, res) {
  const { ticker, type, yearly, size } = req.query;
  
  const urls = {
    balancesheet: `https://apipublichv.tcbs.com.vn/tcanalysis/v1/finance/balancesheet?ticker=${ticker}&isYearly=${yearly}&size=${size}`,
    incomestatement: `https://apipublichv.tcbs.com.vn/tcanalysis/v1/finance/incomestatement?ticker=${ticker}&isYearly=${yearly}&size=${size}`,
    cashflow: `https://apipublichv.tcbs.com.vn/tcanalysis/v1/finance/cashflow?ticker=${ticker}&isYearly=${yearly}&size=${size}`,
    ratio: `https://apipublichv.tcbs.com.vn/tcanalysis/v1/finance/financialratio?ticker=${ticker}&isYearly=${yearly}&size=${size}`
  };

  try {
    const apiRes = await fetch(urls[type]);
    const data = await apiRes.json();
    
    // Gửi dữ liệu về trình duyệt
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Lỗi hệ thống" });
  }
}
