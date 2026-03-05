import { useState, useMemo } from "react";

const TABS = ["Cân đối kế toán", "Kết quả kinh doanh", "LCTT trực tiếp", "Chỉ số tài chính"];

// ── Helpers: Định dạng số liệu chuyên nghiệp ────────────────────────────────
const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = parseFloat(v);
  if (isNaN(n)) return "-";
  // Định dạng số có dấu phẩy, số âm để trong ngoặc đỏ
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

// ── Cấu trúc bảng dữ liệu ──────────────────────────────────────────────────
function buildBalanceSheet(items, headers) {
  const g = (field) => headers.map(h => fmt(items[h]?.[field]));
  return [
    { id:"ts",     pid:null,   label:"A. TÀI SẢN NGẮN HẠN",            lv:0, bold:1, hl:0, sec:0, vals:g("shortAsset") },
    { id:"ts-1",   pid:"ts",   label:"I. Tiền và các khoản tương đương tiền",  lv:1, bold:1, hl:0, sec:0, vals:g("cash") },
    { id:"ts-4",   pid:"ts",   label:"IV. Hàng tồn kho",                        lv:1, bold:1, hl:0, sec:0, vals:g("inventory") },
    { id:"tsdh",   pid:null,   label:"B. TÀI SẢN DÀI HẠN",                     lv:0, bold:1, hl:0, sec:0, vals:g("longAsset") },
    { id:"tsdh-2", pid:"tsdh", label:"II. Tài sản cố định",                    lv:1, bold:1, hl:0, sec:0, vals:g("fixedAsset") },
    { id:"total-ts",pid:null,   label:"TỔNG TÀI SẢN",                          lv:0, bold:1, hl:1, sec:0, vals:g("asset") },
    { id:"no",     pid:null,   label:"A. NỢ PHẢI TRẢ",                         lv:0, bold:1, hl:0, sec:0, vals:g("debt") },
    { id:"no-1",   pid:"no",   label:"I. Nợ ngắn hạn",                         lv:1, bold:1, hl:0, sec:0, vals:g("shortDebt") },
    { id:"vcsh",   pid:null,   label:"B. VỐN CHỦ SỞ HỮU",                      lv:0, bold:1, hl:0, sec:0, vals:g("equity") },
    { id:"total-nv",pid:null,   label:"TỔNG NGUỒN VỐN",                        lv:0, bold:1, hl:1, sec:0, vals:g("asset") },
  ];
}

function buildIncomeStatement(items, headers) {
  const g = (field) => headers.map(h => fmt(items[h]?.[field]));
  return [
    { id:"dt",      pid:null,    label:"1. Doanh thu thuần",                   lv:0, bold:1, hl:0, sec:0, vals:g("revenue") },
    { id:"gvhb",    pid:null,    label:"2. Giá vốn hàng bán",                  lv:0, bold:0, hl:0, sec:0, vals:g("costOfGoodSold") },
    { id:"ln-gop",  pid:null,    label:"3. Lợi nhuận gộp",                     lv:0, bold:1, hl:1, sec:0, vals:g("grossProfit") },
    { id:"ln-hd",   pid:null,    label:"8. Lợi nhuận thuần HĐKD",              lv:0, bold:1, hl:0, sec:0, vals:g("operationProfit") },
    { id:"lntt",    pid:null,    label:"9. Lợi nhuận trước thuế",              lv:0, bold:1, hl:1, sec:0, vals:g("preTaxProfit") },
    { id:"lnst",    pid:null,    label:"10. Lợi nhuận sau thuế",               lv:0, bold:1, hl:1, sec:0, vals:g("postTaxProfit") },
    { id:"eps",     pid:null,    label:"11. EPS (đồng)",                        lv:0, bold:1, hl:0, sec:0, vals:g("earningPerShare") },
  ];
}

function buildCashFlow(items, headers) {
  const g = (field) => headers.map(h => fmt(items[h]?.[field]));
  return [
    { id:"hd1",    pid:null,  label:"I. LCTT TỪ HĐKD",                        lv:0, bold:1, hl:1, sec:0, vals:g("operationCashFlow") },
    { id:"hd2",    pid:null,  label:"II. LCTT TỪ HĐ ĐẦU TƯ",                  lv:0, bold:1, hl:1, sec:0, vals:g("investCashFlow") },
    { id:"hd3",    pid:null,  label:"III. LCTT TỪ HĐ TÀI CHÍNH",               lv:0, bold:1, hl:1, sec:0, vals:g("financeCashFlow") },
    { id:"lctt",   pid:null,  label:"LCTT THUẦN TRONG KỲ",                     lv:0, bold:1, hl:0, sec:0, vals:g("netCashFlow") },
  ];
}

function buildRatios(items, headers) {
  const g = (field, fn) => headers.map(h => (fn || fmt)(items[h]?.[field]));
  return [
    { id:"s1",   pid:null, label:"TĂNG TRƯỞNG",                   lv:0, bold:1, hl:0, sec:1, vals:headers.map(()=>"") },
    { id:"s1-1", pid:"s1", label:"Tăng trưởng doanh thu",         lv:1, bold:0, hl:0, sec:0, vals:g("revenueGrowth", fmtPct) },
    { id:"s1-2", pid:"s1", label:"Tăng trưởng LNST",              lv:1, bold:0, hl:0, sec:0, vals:g("postTaxProfitGrowth", fmtPct) },
    { id:"s2",   pid:null, label:"SINH LỜI",                       lv:0, bold:1, hl:0, sec
