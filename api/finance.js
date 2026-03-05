export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { ticker, type, yearly, size } = req.query;

  if (!ticker || !type) {
    return res.status(400).json({ error: "Missing ticker or type" });
  }

  const isYearly = yearly === "0" ? 0 : 1;
  const numSize = size || 10;

  const endpoints = {
    balancesheet:    `https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/${ticker}/balancesheet?yearly=${isYearly}&size=${numSize}`,
    incomestatement: `https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/${ticker}/incomestatement?yearly=${isYearly}&size=${numSize}`,
    cashflow:        `https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/${ticker}/cashflow?yearly=${isYearly}&size=${numSize}`,
    ratio:           `https://apipubaws.tcbs.com.vn/tcanalysis/v1/finance/${ticker}/financialratio?yearly=${isYearly}&size=${numSize}`,
  };

  const url = endpoints[type];
  if (!url) {
    return res.status(400).json({ error: "Invalid type" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "TCBS API error" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Fetch failed", detail: err.message });
  }
}
