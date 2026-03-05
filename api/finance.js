export default async function handler(req, res) {
  // Lấy các thông tin người dùng gửi lên (mã cổ phiếu, loại báo cáo...)
  const { ticker, type, yearly, size } = req.query;
  
  // Các đường dẫn bí mật để lấy dữ liệu từ TCBS
  const urls = {
    balancesheet: `https://apipublichv.tcbs.com.vn/tcanalysis/v1/finance/balancesheet?ticker=${ticker}&isYearly=${yearly}&size=${size}`,
    incomestatement: `https://apipublichv.tcbs.com.vn/tcanalysis/v1/finance/incomestatement?ticker=${ticker}&isYearly=${yearly}&size=${size}`,
    cashflow: `https://apipublichv.tcbs.com.vn/tcanalysis/v1/finance/cashflow?ticker=${ticker}&isYearly=${yearly}&size=${size}`,
    ratio: `https://apipublichv.tcbs.com.vn/tcanalysis/v1/finance/financialratio?ticker=${ticker}&isYearly=${yearly}&size=${size}`
  };

  try {
    const response = await fetch(urls[type]);
    const data = await response.json();
    // Trả dữ liệu về cho trình duyệt của bạn
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Lỗi không lấy được dữ liệu từ TCBS" });
  }
}
