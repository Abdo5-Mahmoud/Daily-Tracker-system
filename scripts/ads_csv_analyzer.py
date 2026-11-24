#!/usr/bin/env python3
"""
Seller Central Amazon Ads CSV Export Analyzer.
Parses Arabic & English Search Term, Targeting, and Placement reports to detect
winners for Manual Exact promotion, zero-order click waste, and Arabic/English NLP drift.
"""

import csv
import io
import re
from pathlib import Path

ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩٫،", "0123456789.,")
ARABIC_CHAR_RE = re.compile(r"[\u0600-\u06FF]")
LATIN_CHAR_RE = re.compile(r"[A-Za-z]")

HEADER_ALIASES = {
    "search_term": [
        "مصطلح البحث لدى العميل",
        "Customer Search Term",
        "Search Term",
        "Query",
    ],
    "targeting": [
        "الكلمات الرئيسية",
        "الاستهداف",
        "Targeting",
        "Keyword",
        "Match Type",
    ],
    "placement": [
        "اسم موضع الظهور",
        "Placement",
    ],
    "impressions": [
        "مرات الظهور",
        "Impressions",
    ],
    "clicks": [
        "النقرات",
        "Clicks",
    ],
    "spend": [
        "إجمالي التكلفة",
        "التكلفة",
        "Spend",
    ],
    "orders": [
        "المشتريات",
        "الطلبات",
        "7 Day Total Orders (#)",
        "14 Day Total Orders (#)",
        "Orders",
    ],
    "sales": [
        "المبيعات",
        "7 Day Total Sales",
        "7 Day Total Sales (EGP)",
        "14 Day Total Sales",
        "Sales",
    ],
}


def parse_number(raw: str) -> float:
    """Extracts float from Arabic/English Amazon currency cells like '5.06 ج.م.' or '—'."""
    if not raw:
        return 0.0
    text = str(raw).strip().translate(ARABIC_DIGITS).replace(",", "")
    if text in {"-", "—", "--", "N/A", ""}:
        return 0.0
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    if not match:
        return 0.0
    try:
        return float(match.group(0))
    except ValueError:
        return 0.0


def _build_col_map(fieldnames: list) -> dict:
    normalized_fields = {f.strip(): f for f in fieldnames if f}
    mapping = {}
    for canonical, candidates in HEADER_ALIASES.items():
        for alias in candidates:
            if alias in normalized_fields:
                mapping[canonical] = normalized_fields[alias]
                break
    return mapping


def _get_cell(row: dict, col_map: dict, key: str, default: str = "") -> str:
    col = col_map.get(key)
    if not col:
        return default
    return (row.get(col) or default).strip()


def analyze_ads_csv_content(csv_text: str) -> dict:
    """Analyzes CSV string from Amazon Ads Seller Central and returns structured diagnostics."""
    clean_text = csv_text.lstrip("\ufeff").strip()
    if not clean_text:
        raise ValueError("Empty CSV content supplied.")

    reader = csv.DictReader(io.StringIO(clean_text))
    if not reader.fieldnames:
        raise ValueError("CSV missing header row.")

    col_map = _build_col_map(reader.fieldnames)
    if "spend" not in col_map and "clicks" not in col_map:
        raise ValueError(f"Unrecognized Seller Central CSV headers: {reader.fieldnames}")

    terms = []
    winners = []
    waste_candidates = []
    arabic_in_loose = False
    english_only_in_close = False

    total_impressions = 0
    total_clicks = 0
    total_spend = 0.0
    total_orders = 0
    total_sales = 0.0

    for row in reader:
        search_term = _get_cell(row, col_map, "search_term") or _get_cell(row, col_map, "placement") or "(unknown)"
        targeting = _get_cell(row, col_map, "targeting")
        impr = int(parse_number(_get_cell(row, col_map, "impressions")))
        clicks = int(parse_number(_get_cell(row, col_map, "clicks")))
        spend = round(parse_number(_get_cell(row, col_map, "spend")), 2)
        orders = int(parse_number(_get_cell(row, col_map, "orders")))
        sales = round(parse_number(_get_cell(row, col_map, "sales")), 2)

        # Skip summary footer row if present in export
        if search_term.startswith("الإجمالي") or search_term.lower().startswith("total"):
            continue

        cpc = round(spend / clicks, 2) if clicks > 0 else 0.0
        ctr = round((clicks / impr) * 100.0, 2) if impr > 0 else 0.0
        acos = round((spend / sales) * 100.0, 2) if sales > 0 else None
        roas = round(sales / spend, 2) if (spend > 0 and sales > 0) else 0.0

        status = "MONITOR"
        if orders >= 1 or sales > 0:
            status = "WINNER_PROMOTE_EXACT"
        elif clicks >= 3 and orders == 0:
            status = "HIGH_COST_WASTE_CANDIDATE"

        has_arabic = bool(ARABIC_CHAR_RE.search(search_term))
        has_latin = bool(LATIN_CHAR_RE.search(search_term))
        tgt_lower = targeting.lower()

        if has_arabic and ("غير المحددة" in targeting or "فضفاض" in targeting or "loose" in tgt_lower):
            arabic_in_loose = True
        if has_latin and not has_arabic and ("القريبة" in targeting or "قريب" in targeting or "close" in tgt_lower):
            english_only_in_close = True

        entry = {
            "search_term": search_term,
            "targeting": targeting,
            "impressions": impr,
            "clicks": clicks,
            "spend": spend,
            "cpc": cpc,
            "ctr_pct": ctr,
            "orders": orders,
            "sales": sales,
            "acos_pct": acos,
            "roas": roas,
            "status": status,
        }
        terms.append(entry)
        if status == "WINNER_PROMOTE_EXACT":
            winners.append(entry)
        elif status == "HIGH_COST_WASTE_CANDIDATE":
            waste_candidates.append(entry)

        total_impressions += impr
        total_clicks += clicks
        total_spend = round(total_spend + spend, 2)
        total_orders += orders
        total_sales = round(total_sales + sales, 2)

    overall_acos = round((total_spend / total_sales) * 100.0, 2) if total_sales > 0 else None
    overall_roas = round(total_sales / total_spend, 2) if (total_spend > 0 and total_sales > 0) else 0.0

    return {
        "total_terms": len(terms),
        "total_impressions": total_impressions,
        "total_clicks": total_clicks,
        "total_spend": total_spend,
        "total_orders": total_orders,
        "total_sales": total_sales,
        "overall_acos_pct": overall_acos,
        "overall_roas": overall_roas,
        "winners": winners,
        "waste_candidates": waste_candidates,
        "nlp_mismatch_detected": arabic_in_loose and english_only_in_close,
        "terms": terms,
    }


def analyze_ads_csv_file(file_path: str) -> dict:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"CSV export not found: {file_path}")
    text = path.read_text(encoding="utf-8-sig", errors="replace")
    return analyze_ads_csv_content(text)


def format_ads_report(report: dict) -> str:
    lines = [
        "SELLER CENTRAL ADS INTELLIGENCE AUDIT",
        "=" * 75,
        f"Terms Parsed: {report['total_terms']} | Clicks: {report['total_clicks']} | Spend: {report['total_spend']:.2f} EGP",
        f"Orders: {report['total_orders']} | Sales: {report['total_sales']:.2f} EGP | ACoS: {report['overall_acos_pct']}% | RoAS: {report['overall_roas']}x",
    ]
    if report["nlp_mismatch_detected"]:
        lines.append("[!] NLP GROUP ALERT: Arabic queries converted in Loose-match while Close-match carried Latin-only queries. Do NOT blindly raise Close-match.")
    if report["winners"]:
        lines.append("\n[WINNERS -> PROMOTE TO MANUAL EXACT]:")
        for w in report["winners"]:
            lines.append(f"  - {w['search_term']} ({w['targeting']}) | Clicks: {w['clicks']} | Spend: {w['spend']} EGP | Sales: {w['sales']} EGP | RoAS: {w['roas']}x")
    if report["waste_candidates"]:
        lines.append("\n[HIGH-CLICK / ZERO-ORDER WATCHLIST]:")
        for c in report["waste_candidates"]:
            lines.append(f"  - {c['search_term']} ({c['targeting']}) | Clicks: {c['clicks']} | Spend: {c['spend']} EGP (0 orders attributed)")
    lines.append("=" * 75)
    return "\n".join(lines)
