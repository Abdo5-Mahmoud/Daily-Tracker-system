#!/usr/bin/env python3
"""
Flora_Home Workspace MCP Server v2.0 (Stdio JSON-RPC 2.0)
Exposes freshness-guarded market intelligence queries, unified 13% FBA unit economics,
pure-white image auditing, Seller Central Ads CSV analytics, and Chrome-saved HTML ingestion.
"""

import json
import os
import re
import sqlite3
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdin, "reconfigure"):
    sys.stdin.reconfigure(encoding="utf-8")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

SCRIPTS_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = SCRIPTS_DIR.parent
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from ads_csv_analyzer import analyze_ads_csv_content, analyze_ads_csv_file, format_ads_report
from marketing_calculator import calculate_amazon_economics, calculate_amazon_fba_economics

DB_PATH = WORKSPACE_ROOT / "local-business-store" / "market-intelligence" / "amazon_market.db"
INGEST_SCRIPT = SCRIPTS_DIR / "amazon-tracker" / "ingest_search.js"
STALE_HOURS = 24.0


def log_debug(message: str):
    """Log debug info to stderr so stdout stays clean JSON-RPC."""
    sys.stderr.write(f"[workspace-mcp] {message}\n")
    sys.stderr.flush()


def _resolve_workspace_path(raw_path: str) -> Path:
    target = Path(raw_path)
    return target if target.is_absolute() else (WORKSPACE_ROOT / target)


def _get_freshness_banner(cur, keyword_filter: str = None) -> str:
    """Computes latest snapshot age and emits an explicit STALE warning if older than 24h."""
    if keyword_filter:
        cur.execute(
            "SELECT MAX(captured_at), ROUND((julianday('now') - julianday(MAX(captured_at))) * 24.0, 1) FROM snapshots WHERE keyword LIKE ?",
            (f"%{keyword_filter}%",),
        )
    else:
        cur.execute(
            "SELECT MAX(captured_at), ROUND((julianday('now') - julianday(MAX(captured_at))) * 24.0, 1) FROM snapshots"
        )
    latest_ts, age_hours = cur.fetchone()
    if not latest_ts:
        return "[FRESHNESS CHECK]: Empty database (0 snapshots)."
    if age_hours is not None and age_hours > STALE_HOURS:
        days = round(age_hours / 24.0, 1)
        return (
            f"[STALE DATA WARNING]: Latest snapshot is {age_hours}h (~{days} days) old "
            f"(captured {latest_ts}). Do NOT report as live market state; ingest fresh Chrome HTML first."
        )
    return f"[FRESHNESS CHECK]: Fresh snapshot ({age_hours}h old, captured {latest_ts})."


def tool_market_summary(keyword: str = None) -> str:
    if not DB_PATH.exists():
        return f"Error: Database not found at {DB_PATH}"

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    freshness_line = _get_freshness_banner(cur, keyword)

    base_sql = """
        SELECT
            keyword,
            COUNT(*) as total_snapshots,
            COUNT(DISTINCT asin) as unique_products,
            ROUND(AVG(price), 1) as avg_price,
            ROUND(MIN(price), 1) as min_price,
            ROUND(MAX(price), 1) as max_price,
            SUM(is_sponsored) as sponsored_count,
            ROUND(100.0 * SUM(is_sponsored) / COUNT(*), 1) as sponsored_pct,
            MAX(captured_at) as latest_ts
        FROM snapshots
    """
    if keyword:
        cur.execute(f"{base_sql} WHERE keyword LIKE ? GROUP BY keyword", (f"%{keyword}%",))
    else:
        cur.execute(f"{base_sql} GROUP BY keyword ORDER BY latest_ts DESC, sponsored_pct DESC")

    rows = cur.fetchall()
    conn.close()

    if not rows:
        return f"{freshness_line}\nNo snapshots found matching the specified keyword."

    lines = [
        "AMAZON EGYPT MARKET INTELLIGENCE SUMMARY",
        freshness_line,
        "=" * 88,
        f"{'KEYWORD':<22} | {'SNAPS':<6} | {'UNIQ':<5} | {'AVG EGP':<8} | {'MIN-MAX EGP':<15} | {'SPONS':<10} | {'LATEST'}",
        "-" * 88,
    ]
    for r in rows:
        price_range = f"{r[4]} - {r[5]}"
        spons_str = f"{r[6]} ({r[7]}%)"
        date_only = (r[8] or "")[:10]
        lines.append(f"{r[0]:<22} | {r[1]:<6} | {r[2]:<5} | {r[3]:<8} | {price_range:<15} | {spons_str:<10} | {date_only}")
    lines.append("=" * 88)
    return "\n".join(lines)


def tool_market_sponsored_radar(limit: int = 15) -> str:
    if not DB_PATH.exists():
        return f"Error: Database not found at {DB_PATH}"

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    freshness_line = _get_freshness_banner(cur)
    cur.execute(
        """
        SELECT DISTINCT s.keyword, s.asin, p.title, s.price, s.rank_in_search, s.captured_at
        FROM snapshots s
        LEFT JOIN products p ON s.asin = p.asin
        WHERE s.is_sponsored = 1
        ORDER BY s.captured_at DESC
        LIMIT ?
        """,
        (limit,),
    )
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return f"{freshness_line}\nNo active sponsored ads recorded in database."

    lines = [
        f"SPONSORED ADS LOGGED IN DATABASE (Top {len(rows)})",
        freshness_line,
        "=" * 85,
    ]
    for r in rows:
        title = (r[2] or "Unknown")[:48]
        lines.append(f"[{r[0]}] ASIN: {r[1]} | Price: {r[3]} EGP | Rank: #{r[4]} | Captured: {r[5]}")
        lines.append(f"   Title: {title}...")
        lines.append("-" * 85)
    return "\n".join(lines)


def tool_market_sql_query(query: str) -> str:
    if not DB_PATH.exists():
        return f"Error: Database not found at {DB_PATH}"

    clean_query = query.strip()
    first_word = clean_query.split()[0].upper() if clean_query else ""
    if first_word not in {"SELECT", "WITH", "EXPLAIN"}:
        return "Security Error: Only read-only queries (SELECT / WITH / EXPLAIN) are permitted."

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute(clean_query)
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description] if cur.description else []
        conn.close()

        result_lines = [" | ".join(cols), "-" * 60]
        for r in rows[:100]:
            result_lines.append(" | ".join(str(c) for c in r))
        result_lines.append(f"\n[Returned {len(rows)} rows, capped at 100]")
        return "\n".join(result_lines)
    except Exception as e:
        conn.close()
        return f"SQL Error: {str(e)}"


def tool_unit_economics_calculator(
    selling_price: float,
    product_cost: float,
    packaging_cost: float = 25.78,
    model: str = "fba",
    weight_kg: float = 0.75,
    referral_fee_pct: float = 13.0,
    inbound_freight: float = 6.86,
    coupon_egp: float = 0.0,
    estimated_cvr_pct: float = 10.0,
    placement_modifier_pct: float = 150.0,
) -> str:
    """Delegates unit economics computation to canonical marketing_calculator module."""
    common_kwargs = dict(
        cost=product_cost,
        price=selling_price,
        referral_rate=referral_fee_pct / 100.0,
        packaging=packaging_cost,
        weight_kg=weight_kg,
        coupon_egp=coupon_egp,
        estimated_cvr=estimated_cvr_pct / 100.0,
        placement_modifier_pct=placement_modifier_pct,
    )
    if model.lower() == "fba":
        res = calculate_amazon_fba_economics(inbound_shipping=inbound_freight, **common_kwargs)
    else:
        res = calculate_amazon_economics(**common_kwargs)

    return (
        f"UNIT ECONOMICS BREAKDOWN ({model.upper()})\n"
        f"{'=' * 56}\n"
        f"List Price:             {res['price']:.2f} EGP\n"
        f"Coupon Discount:       -{res['coupon_egp']:.2f} EGP (Effective: {res['effective_price']:.2f} EGP)\n"
        f"Product Base Cost:      {res['cost']:.2f} EGP\n"
        f"Packaging + Inbound:    {res['packaging']:.2f} + {res['inbound_shipping']:.2f} EGP\n"
        f"Total Landed COGS:      {res['total_cogs']:.2f} EGP\n"
        f"{'-' * 56}\n"
        f"Referral Fee ({res['referral_rate_pct']}%):    {res['referral_fee']:.2f} EGP\n"
        f"Fulfillment + Closing:  {res['fulfillment_fee']:.2f} + {res['closing_fee']:.2f} EGP\n"
        f"VAT on Services (14%):  {res['vat_on_fees']:.2f} EGP\n"
        f"Total Amazon Take:      {res['total_amazon_take']:.2f} EGP\n"
        f"{'-' * 56}\n"
        f"Net Amazon Payout:      {res['net_payout']:.2f} EGP\n"
        f"Net Profit:             {res['net_profit']:.2f} EGP\n"
        f"Net Margin:             {res['margin_percent']:.1f}%\n"
        f"ROI on Landed Capital:  {res['roi_percent']:.1f}%\n"
        f"Break-Even CPC ({estimated_cvr_pct:.0f}% CVR): {res['break_even_cpc']:.2f} EGP\n"
        f"Safe Base Bid (+{placement_modifier_pct:.0f}%):  {res['safe_max_base_bid']:.2f} EGP\n"
        f"{'=' * 56}\n"
        f"Target 20% Margin Price: >= {res['min_price_20pct_margin']:.2f} EGP\n"
    )


def tool_audit_language_formatting(file_path: str = None, text_content: str = None) -> str:
    content = ""
    if file_path:
        target = _resolve_workspace_path(file_path)
        if not target.exists():
            return f"Error: File not found at {target}"
        content = target.read_text(encoding="utf-8", errors="replace")
    elif text_content:
        content = text_content
    else:
        return "Error: Provide either file_path or text_content."

    lines = content.splitlines()
    violations = []
    arabic_pattern = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]")
    latin_pattern = re.compile(r"[a-zA-Z]")
    in_code_block = False

    for idx, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        clean_line = re.sub(r"\]\([^)]+\)", "]", stripped)
        clean_line = re.sub(r"`[^`]+`", "", clean_line)
        if arabic_pattern.search(clean_line) and latin_pattern.search(clean_line):
            violations.append((idx, line))

    if not violations:
        return f"Audit Passed: All {len(lines)} lines strictly follow 100% Arabic or 100% English formatting rule."

    report = [f"Audit Failed: Found {len(violations)} mixed lines violation:", "=" * 70]
    for line_num, text in violations[:20]:
        report.append(f"Line {line_num}: {text[:75]}")
    return "\n".join(report)


def _compute_white_border_score(img) -> tuple:
    rgb = img.convert("RGB")
    w, h = rgb.size
    edge_points = [
        (5, 5), (max(0, w - 6), 5), (5, max(0, h - 6)), (max(0, w - 6), max(0, h - 6)),
        (w // 2, 5), (w // 2, max(0, h - 6)), (5, h // 2), (max(0, w - 6), h // 2),
    ]
    white_hits = 0
    sample_rgb = []
    for x, y in edge_points:
        r, g, b = rgb.getpixel((x, y))
        sample_rgb.append((r, g, b))
        if r >= 248 and g >= 248 and b >= 248:
            white_hits += 1
    score = round(white_hits / len(edge_points), 2)
    return score, sample_rgb[0]


def tool_audit_image_compliance(image_path: str, require_white_background: bool = True) -> str:
    target = _resolve_workspace_path(image_path)
    if not target.exists():
        return f"Error: Image not found at {target}"

    try:
        from PIL import Image

        with Image.open(target) as img:
            w, h = img.size
            fmt = img.format
            mode = img.mode
            aspect_ratio = w / h if h > 0 else 1.0
            is_square = abs(aspect_ratio - 1.0) < 0.05
            is_zoom_ready = min(w, h) >= 1000
            is_hi_res = max(w, h) >= 1600
            white_score, corner_rgb = _compute_white_border_score(img)
            white_ok = (not require_white_background) or (white_score >= 0.80)

            failures = []
            if not is_square:
                failures.append("Not 1:1 square aspect ratio")
            if not is_zoom_ready:
                failures.append("Resolution below 1000px zoom floor")
            if not white_ok:
                failures.append(f"Border NOT pure white #FFFFFF (score={white_score}, corner RGB={corner_rgb})")

            status = "PASS" if not failures else "NON-COMPLIANT"
            lines = [
                f"IMAGE COMPLIANCE AUDIT ({status})",
                "=" * 48,
                f"File:               {target.name}",
                f"Dimensions:         {w} x {h} px",
                f"Format:             {fmt} ({mode})",
                f"Aspect Ratio:       {aspect_ratio:.2f}:1 ({'1:1 Compliant' if is_square else 'Mismatch'})",
                f"Zoom Ready:         {'YES (>=1000px)' if is_zoom_ready else 'NO (<1000px)'}",
                f"Ultra-HD (1600px):  {'YES' if is_hi_res else 'RECOMMEND UPGRADE'}",
                f"White Border Score: {white_score:.2f} (Corner RGB: {corner_rgb})",
                f"File Size:          {target.stat().st_size / 1024:.1f} KB",
            ]
            if failures:
                lines.append("Violations:         " + "; ".join(failures))
            return "\n".join(lines) + "\n"
    except ImportError:
        size_kb = target.stat().st_size / 1024
        return f"File {target.name} exists ({size_kb:.1f} KB). Install Pillow for pixel compliance audit."
    except Exception as e:
        return f"Error reading image: {str(e)}"


def tool_page_one_radar_log(limit_sessions: int = 2) -> str:
    log_file = WORKSPACE_ROOT / "local-business-store" / "market-intelligence" / "AMAZON_PAGE_ONE_RADAR_LOG.md"
    if not log_file.exists():
        return f"Error: Page One Radar Log not found at {log_file}"
    try:
        mtime = datetime.fromtimestamp(log_file.stat().st_mtime, tz=timezone.utc)
        age_hours = round((datetime.now(timezone.utc) - mtime).total_seconds() / 3600.0, 1)
        freshness_note = (
            f"[STALE LOG WARNING]: Log file last updated {age_hours}h ago ({mtime.strftime('%Y-%m-%d %H:%M UTC')})."
            if age_hours > STALE_HOURS
            else f"[FRESH LOG]: Updated {age_hours}h ago."
        )
        content = log_file.read_text(encoding="utf-8", errors="replace")
        sessions = content.split("## ")
        if len(sessions) <= 1:
            return f"{freshness_note}\n{content}"
        recent = sessions[-limit_sessions:]
        return f"{freshness_note}\n" + sessions[0] + "## " + "## ".join(recent)
    except Exception as e:
        return f"Error reading log file: {str(e)}"


def tool_analyze_ads_csv(file_path: str = None, csv_content: str = None) -> str:
    try:
        if file_path:
            target = _resolve_workspace_path(file_path)
            report = analyze_ads_csv_file(str(target))
        elif csv_content:
            report = analyze_ads_csv_content(csv_content)
        else:
            return "Error: Provide either file_path or csv_content."
        return format_ads_report(report)
    except Exception as e:
        return f"Ads CSV Audit Error: {str(e)}"


def tool_ingest_amazon_html(file_path: str, keyword: str = None) -> str:
    target = _resolve_workspace_path(file_path)
    if target.suffix.lower() not in {".html", ".htm"}:
        return "Error: Input file must be an .html or .htm file saved from browser."
    if not target.exists():
        return f"Error: HTML file not found at {target}"

    cmd = ["node", str(INGEST_SCRIPT.parent / "index.js"), "--file", str(target)]
    if keyword:
        cmd.extend(["--keyword", keyword])

    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        return f"Ingestion Failed:\n{proc.stderr or proc.stdout}"
    return proc.stdout.strip()


AVAILABLE_TOOLS = [
    {
        "name": "market_summary",
        "description": "Get database market summary for Amazon Egypt categories from amazon_market.db with explicit snapshot age and STALE warnings when > 24h old.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "keyword": {"type": "string", "description": "Optional keyword filter (e.g., 'فازة', 'فازات ديكور')"}
            },
        },
    },
    {
        "name": "market_sponsored_radar",
        "description": "Retrieve stored sponsored ads captured in amazon_market.db with explicit staleness audit.",
        "inputSchema": {
            "type": "object",
            "properties": {"limit": {"type": "integer", "description": "Max sponsored rows to return (default: 15)"}},
        },
    },
    {
        "name": "market_sql_query",
        "description": "Execute a safe read-only SQL query against amazon_market.db.",
        "inputSchema": {
            "type": "object",
            "properties": {"query": {"type": "string", "description": "SQL SELECT query to execute"}},
            "required": ["query"],
        },
    },
    {
        "name": "unit_economics_calculator",
        "description": "Calculate Flora_Home unit economics (default 13% Home Decor referral, FBA fees, VAT, ATS inbound freight, coupons, Break-Even CPC, and Safe Base Bid).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "selling_price": {"type": "number"},
                "product_cost": {"type": "number"},
                "packaging_cost": {"type": "number"},
                "model": {"type": "string", "enum": ["easy_ship", "fba"]},
                "weight_kg": {"type": "number"},
                "referral_fee_pct": {"type": "number"},
                "inbound_freight": {"type": "number"},
                "coupon_egp": {"type": "number"},
                "estimated_cvr_pct": {"type": "number"},
                "placement_modifier_pct": {"type": "number"},
            },
            "required": ["selling_price", "product_cost"],
        },
    },
    {
        "name": "audit_language_formatting",
        "description": "Audit text or markdown files against the strict workspace rule: each line must be 100% Arabic or 100% English.",
        "inputSchema": {
            "type": "object",
            "properties": {"file_path": {"type": "string"}, "text_content": {"type": "string"}},
        },
    },
    {
        "name": "audit_image_compliance",
        "description": "Audit product image for Amazon listing compliance (1:1 square, >=1000px zoom, 1600px HD check, and pure-white #FFFFFF corner pixel validation).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "image_path": {"type": "string"},
                "require_white_background": {"type": "boolean"},
            },
            "required": ["image_path"],
        },
    },
    {
        "name": "page_one_radar_log",
        "description": "Read AMAZON_PAGE_ONE_RADAR_LOG.md with explicit staleness check.",
        "inputSchema": {
            "type": "object",
            "properties": {"limit_sessions": {"type": "integer"}},
        },
    },
    {
        "name": "analyze_ads_csv",
        "description": "Parse exported Amazon Egypt Seller Central Ads CSV reports (Arabic or English headers) to compute ACoS/RoAS, flag zero-sale click waste, identify Exact Match winners, and detect Arabic/English NLP group mismatch.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Path to exported Seller Central CSV"},
                "csv_content": {"type": "string", "description": "Raw CSV text content"},
            },
        },
    },
    {
        "name": "ingest_amazon_html",
        "description": "Ingest a Chrome-saved Amazon Egypt search results HTML snapshot into amazon_market.db, extracting prices, coupons, sponsored positions, and Flora_Home ranks.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Path to saved .html/.htm search snapshot"},
                "keyword": {"type": "string", "description": "Search keyword represented by the HTML snapshot"},
            },
            "required": ["file_path"],
        },
    },
]


def handle_request(req: dict) -> dict:
    req_id = req.get("id")
    method = req.get("method")
    params = req.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "workspace-tools", "version": "2.0.0"},
            },
        }
    elif method == "notifications/initialized":
        return None
    elif method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}
    elif method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": AVAILABLE_TOOLS}}
    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        try:
            if tool_name == "market_summary":
                output = tool_market_summary(keyword=arguments.get("keyword"))
            elif tool_name == "market_sponsored_radar":
                output = tool_market_sponsored_radar(limit=int(arguments.get("limit", 15)))
            elif tool_name == "market_sql_query":
                output = tool_market_sql_query(query=arguments.get("query", ""))
            elif tool_name == "unit_economics_calculator":
                output = tool_unit_economics_calculator(
                    selling_price=float(arguments["selling_price"]),
                    product_cost=float(arguments["product_cost"]),
                    packaging_cost=float(arguments.get("packaging_cost", 25.78)),
                    model=arguments.get("model", "fba"),
                    weight_kg=float(arguments.get("weight_kg", 0.75)),
                    referral_fee_pct=float(arguments.get("referral_fee_pct", 13.0)),
                    inbound_freight=float(arguments.get("inbound_freight", 6.86)),
                    coupon_egp=float(arguments.get("coupon_egp", 0.0)),
                    estimated_cvr_pct=float(arguments.get("estimated_cvr_pct", 10.0)),
                    placement_modifier_pct=float(arguments.get("placement_modifier_pct", 150.0)),
                )
            elif tool_name == "audit_language_formatting":
                output = tool_audit_language_formatting(
                    file_path=arguments.get("file_path"),
                    text_content=arguments.get("text_content"),
                )
            elif tool_name == "audit_image_compliance":
                output = tool_audit_image_compliance(
                    image_path=arguments.get("image_path"),
                    require_white_background=bool(arguments.get("require_white_background", True)),
                )
            elif tool_name == "page_one_radar_log":
                output = tool_page_one_radar_log(limit_sessions=int(arguments.get("limit_sessions", 2)))
            elif tool_name == "analyze_ads_csv":
                output = tool_analyze_ads_csv(
                    file_path=arguments.get("file_path"),
                    csv_content=arguments.get("csv_content"),
                )
            elif tool_name == "ingest_amazon_html":
                output = tool_ingest_amazon_html(
                    file_path=arguments.get("file_path"),
                    keyword=arguments.get("keyword"),
                )
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": f"Tool not found: {tool_name}"},
                }

            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"content": [{"type": "text", "text": output}], "isError": False},
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"content": [{"type": "text", "text": f"Error executing {tool_name}: {str(e)}"}], "isError": True},
            }
    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not supported: {method}"},
        }


def main():
    log_debug("Starting Flora_Home Workspace Tools MCP Server v2.0...")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            res = handle_request(req)
            if res is not None:
                sys.stdout.write(json.dumps(res, ensure_ascii=False) + "\n")
                sys.stdout.flush()
        except Exception as e:
            log_debug(f"JSON Parse / Execution Error: {e}")


if __name__ == "__main__":
    main()
