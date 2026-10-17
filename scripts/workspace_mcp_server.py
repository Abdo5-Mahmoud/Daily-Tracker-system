#!/usr/bin/env python3
"""
Abdo Workspace MCP Server (Stdio Transport)
Exposes local business tools, market intelligence databases, unit economics calculators,
and code/asset quality auditors to Antigravity and AI agents via standard MCP protocol.
"""

import sys
import os
import json
import sqlite3
import re
from pathlib import Path

# Force UTF-8 encoding for stdio in Windows
if hasattr(sys.stdin, "reconfigure"):
    sys.stdin.reconfigure(encoding="utf-8")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = WORKSPACE_ROOT / "local-business-store" / "market-intelligence" / "amazon_market.db"

def log_debug(message: str):
    """Log debug info to stderr so stdout remains purely JSON-RPC messages."""
    sys.stderr.write(f"[workspace-mcp] {message}\n")
    sys.stderr.flush()

# ==========================================
# TOOL IMPLEMENTATIONS
# ==========================================

def tool_market_summary(keyword: str = None) -> str:
    if not DB_PATH.exists():
        return f"Error: Database not found at {DB_PATH}"
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    if keyword:
        cur.execute("""
            SELECT 
                keyword,
                COUNT(*) as total_snapshots,
                COUNT(DISTINCT asin) as unique_products,
                ROUND(AVG(price), 1) as avg_price,
                ROUND(MIN(price), 1) as min_price,
                ROUND(MAX(price), 1) as max_price,
                SUM(is_sponsored) as sponsored_count,
                ROUND(100.0 * SUM(is_sponsored) / COUNT(*), 1) as sponsored_pct
            FROM snapshots
            WHERE keyword LIKE ?
            GROUP BY keyword
        """, (f"%{keyword}%",))
    else:
        cur.execute("""
            SELECT 
                keyword,
                COUNT(*) as total_snapshots,
                COUNT(DISTINCT asin) as unique_products,
                ROUND(AVG(price), 1) as avg_price,
                ROUND(MIN(price), 1) as min_price,
                ROUND(MAX(price), 1) as max_price,
                SUM(is_sponsored) as sponsored_count,
                ROUND(100.0 * SUM(is_sponsored) / COUNT(*), 1) as sponsored_pct
            FROM snapshots
            GROUP BY keyword
            ORDER BY sponsored_pct DESC, total_snapshots DESC
        """)
        
    rows = cur.fetchall()
    conn.close()
    
    if not rows:
        return "No snapshots found matching the specified keyword."
        
    lines = [
        "AMAZON EGYPT MARKET INTELLIGENCE SUMMARY",
        "=" * 80,
        f"{'KEYWORD':<22} | {'SNAPSHOTS':<9} | {'UNIQUE':<7} | {'AVG EGP':<8} | {'MIN-MAX EGP':<15} | {'SPONSORED'}",
        "-" * 80
    ]
    for r in rows:
        price_range = f"{r[4]} - {r[5]}"
        spons_str = f"{r[6]} ({r[7]}%)"
        lines.append(f"{r[0]:<22} | {r[1]:<9} | {r[2]:<7} | {r[3]:<8} | {price_range:<15} | {spons_str}")
    lines.append("=" * 80)
    return "\n".join(lines)

def tool_market_sponsored_radar(limit: int = 15) -> str:
    if not DB_PATH.exists():
        return f"Error: Database not found at {DB_PATH}"
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT
            s.keyword,
            s.asin,
            p.title,
            s.price,
            s.rank_in_search,
            s.captured_at
        FROM snapshots s
        LEFT JOIN products p ON s.asin = p.asin
        WHERE s.is_sponsored = 1
        ORDER BY s.captured_at DESC
        LIMIT ?
    """, (limit,))
    rows = cur.fetchall()
    conn.close()
    
    if not rows:
        return "No active sponsored ads detected in database."
        
    lines = [
        f"ACTIVE SPONSORED ADS ON AMAZON EGYPT (Top {len(rows)} captured)",
        "=" * 85
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
    # Security guard: Read-only SELECT enforcement
    first_word = clean_query.split()[0].upper() if clean_query else ""
    if first_word != "SELECT" and first_word != "WITH" and first_word != "EXPLAIN":
        return "Security Error: Only read-only queries (SELECT / WITH / EXPLAIN) are permitted."
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute(clean_query)
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description] if cur.description else []
        conn.close()
        
        result_lines = [" | ".join(cols), "-" * 60]
        for r in rows[:100]:  # Cap output at 100 rows to prevent context explosion
            result_lines.append(" | ".join(str(c) for c in r))
        result_lines.append(f"\n[Returned {len(rows)} rows, capped at 100]")
        return "\n".join(result_lines)
    except Exception as e:
        conn.close()
        return f"SQL Error: {str(e)}"

def tool_unit_economics_calculator(
    selling_price: float,
    product_cost: float,
    packaging_cost: float = 15.0,
    model: str = "easy_ship",
    weight_kg: float = 0.5,
    referral_fee_pct: float = 10.0
) -> str:
    # Amazon Egypt Standard Unit Economics
    referral_fee = selling_price * (referral_fee_pct / 100.0)
    
    # Easy Ship vs FBA fulfillment fee estimation
    if model.lower() == "fba":
        # Amazon FBA Egypt standard tier (~32 EGP for small/standard)
        fulfillment_fee = 32.0 if weight_kg <= 1.0 else 32.0 + (weight_kg - 1.0) * 8.0
        closing_fee = 5.0
    else:
        # Easy Ship (Merchant Fulfilled with Amazon Courier)
        fulfillment_fee = 36.0 if weight_kg <= 1.0 else 36.0 + (weight_kg - 1.0) * 10.0
        closing_fee = 5.0
        
    amazon_service_fees = referral_fee + fulfillment_fee + closing_fee
    vat_on_fees = amazon_service_fees * 0.14  # 14% Egyptian VAT on digital & logistics services
    total_amazon_deduction = amazon_service_fees + vat_on_fees
    
    net_payout = selling_price - total_amazon_deduction
    cogs = product_cost + packaging_cost
    net_profit = net_payout - cogs
    net_margin_pct = (net_profit / selling_price) * 100.0 if selling_price > 0 else 0.0
    roi_pct = (net_profit / cogs) * 100.0 if cogs > 0 else 0.0
    
    # Calculate minimum price for 20% net margin
    # Formula: Price * (1 - referral_pct*1.14) = (cogs + (fulfillment+closing)*1.14) / (1 - target_margin)
    fee_mult = 1.0 + 0.14
    fixed_overhead = cogs + (fulfillment_fee + closing_fee) * fee_mult
    denom = 1.0 - (referral_fee_pct / 100.0 * fee_mult) - 0.20
    min_price_20pct = fixed_overhead / denom if denom > 0 else 0.0

    return (
        f"UNIT ECONOMICS BREAKDOWN ({model.upper()})\n"
        f"{'='*50}\n"
        f"Selling Price:          {selling_price:.2f} EGP\n"
        f"Product Base Cost:      {product_cost:.2f} EGP\n"
        f"Packaging Cost:         {packaging_cost:.2f} EGP\n"
        f"Total COGS:             {cogs:.2f} EGP\n"
        f"{'-'*50}\n"
        f"Referral Fee ({referral_fee_pct}%):    {referral_fee:.2f} EGP\n"
        f"Fulfillment Fee:        {fulfillment_fee:.2f} EGP\n"
        f"Closing Fee:            {closing_fee:.2f} EGP\n"
        f"VAT on Services (14%):  {vat_on_fees:.2f} EGP\n"
        f"Total Amazon Take:      {total_amazon_deduction:.2f} EGP ({total_amazon_deduction/selling_price*100:.1f}%)\n"
        f"{'-'*50}\n"
        f"Net Amazon Payout:      {net_payout:.2f} EGP\n"
        f"Net Profit:             {net_profit:.2f} EGP\n"
        f"Net Margin:             {net_margin_pct:.1f}%\n"
        f"ROI on Capital:         {roi_pct:.1f}%\n"
        f"{'='*50}\n"
        f"Target 20% Margin Price: >= {min_price_20pct:.2f} EGP\n"
    )

def tool_audit_language_formatting(file_path: str = None, text_content: str = None) -> str:
    content = ""
    if file_path:
        target = Path(file_path)
        if not target.is_absolute():
            target = WORKSPACE_ROOT / file_path
        if not target.exists():
            return f"Error: File not found at {target}"
        with open(target, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    elif text_content:
        content = text_content
    else:
        return "Error: Provide either file_path or text_content."
        
    lines = content.splitlines()
    violations = []
    
    # Regex: Arabic characters vs English alphabet
    arabic_pattern = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]')
    latin_pattern = re.compile(r'[a-zA-Z]')
    
    in_code_block = False
    
    for idx, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue
            
        # Strip markdown links targets like (file:///...) or (http...) to only check prose text
        clean_line = re.sub(r'\]\([^)]+\)', ']', stripped)
        # Strip inline code ticks `...`
        clean_line = re.sub(r'`[^`]+`', '', clean_line)
        
        has_arabic = bool(arabic_pattern.search(clean_line))
        has_latin = bool(latin_pattern.search(clean_line))
        
        if has_arabic and has_latin:
            violations.append((idx, line))
            
    if not violations:
        return f"Audit Passed: All {len(lines)} lines strictly follow 100% Arabic or 100% English formatting rule."
    
    report = [
        f"Audit Failed: Found {len(violations)} mixed lines violation:",
        "=" * 70
    ]
    for line_num, text in violations[:20]:
        report.append(f"Line {line_num}: {text[:75]}")
    if len(violations) > 20:
        report.append(f"... and {len(violations)-20} more violations.")
    return "\n".join(report)

def tool_audit_image_compliance(image_path: str) -> str:
    target = Path(image_path)
    if not target.is_absolute():
        target = WORKSPACE_ROOT / image_path
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
            
            status = "PASS" if (is_zoom_ready and is_square) else "WARN"
            
            return (
                f"IMAGE COMPLIANCE AUDIT ({status})\n"
                f"{'='*40}\n"
                f"File:            {target.name}\n"
                f"Dimensions:      {w} x {h} px\n"
                f"Format:          {fmt} ({mode})\n"
                f"Aspect Ratio:    {aspect_ratio:.2f}:1 ({'1:1 Square Compliant' if is_square else 'Not 1:1 Square'})\n"
                f"Zoom Ready:      {'YES (>=1000px)' if is_zoom_ready else 'NO (Need >= 1000px)'}\n"
                f"Ultra-HD (1600): {'YES (>=1600px)' if is_hi_res else 'NO'}\n"
                f"File Size:       {target.stat().st_size / 1024:.1f} KB\n"
            )
    except ImportError:
        # Fallback without PIL
        size_kb = target.stat().st_size / 1024
        return f"File {target.name} exists ({size_kb:.1f} KB). Install Pillow for pixel dimension audit."
    except Exception as e:
        return f"Error reading image: {str(e)}"

# ==========================================
# TOOL REGISTRY FOR MCP
# ==========================================

AVAILABLE_TOOLS = [
    {
        "name": "market_summary",
        "description": "Get real-time market intelligence summary for Amazon Egypt categories from amazon_market.db (price ranges, averages, snapshot counts, sponsored percentages).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "keyword": {
                    "type": "string",
                    "description": "Optional keyword or category filter (e.g., 'فازات ديكور', 'نباتات صناعية')"
                }
            }
        }
    },
    {
        "name": "market_sponsored_radar",
        "description": "Retrieve active sponsored ads currently running on Amazon Egypt tracked in amazon_market.db, including competitor ASINs, ranks, and captured prices.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of sponsored ads to retrieve (default: 15)"
                }
            }
        }
    },
    {
        "name": "market_sql_query",
        "description": "Execute a safe read-only SQL query against the Amazon Egypt intelligence database (amazon_market.db).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "SQL SELECT query to execute"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "unit_economics_calculator",
        "description": "Calculate unit economics, net profit margins, Amazon Egypt fees (referral, fulfillment, closing, VAT), and minimum selling price.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "selling_price": {"type": "number", "description": "Listing selling price in EGP"},
                "product_cost": {"type": "number", "description": "Raw manufactured product cost in EGP"},
                "packaging_cost": {"type": "number", "description": "Bubble wrap, carton, sticker cost in EGP (default: 15.0)"},
                "model": {"type": "string", "enum": ["easy_ship", "fba"], "description": "Fulfillment model (easy_ship or fba)"},
                "weight_kg": {"type": "number", "description": "Packaged item weight in kg (default: 0.5)"},
                "referral_fee_pct": {"type": "number", "description": "Category referral fee percentage (default: 10.0)"}
            },
            "required": ["selling_price", "product_cost"]
        }
    },
    {
        "name": "audit_language_formatting",
        "description": "Audit text or markdown files against the strict workspace rule: each line must be 100% Arabic or 100% English.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {"type": "string", "description": "Relative or absolute path to markdown/text file"},
                "text_content": {"type": "string", "description": "Raw string text to audit if no file"}
            }
        }
    },
    {
        "name": "audit_image_compliance",
        "description": "Audit e-commerce product image for Amazon listing compliance (square aspect ratio, zoom resolution >= 1000px).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "image_path": {"type": "string", "description": "Path to the product image"}
            },
            "required": ["image_path"]
        }
    }
]

# ==========================================
# MCP PROTOCOL LOOP (JSON-RPC 2.0 OVER STDIO)
# ==========================================

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
                "capabilities": {
                    "tools": {}
                },
                "serverInfo": {
                    "name": "workspace-tools",
                    "version": "1.0.0"
                }
            }
        }
        
    elif method == "notifications/initialized":
        # Client acknowledgement, no response required
        return None
        
    elif method == "ping":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {}
        }
        
    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": AVAILABLE_TOOLS
            }
        }
        
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
                    packaging_cost=float(arguments.get("packaging_cost", 15.0)),
                    model=arguments.get("model", "easy_ship"),
                    weight_kg=float(arguments.get("weight_kg", 0.5)),
                    referral_fee_pct=float(arguments.get("referral_fee_pct", 10.0))
                )
            elif tool_name == "audit_language_formatting":
                output = tool_audit_language_formatting(
                    file_path=arguments.get("file_path"),
                    text_content=arguments.get("text_content")
                )
            elif tool_name == "audit_image_compliance":
                output = tool_audit_image_compliance(image_path=arguments.get("image_path"))
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Tool not found: {tool_name}"
                    }
                }
                
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": output
                        }
                    ],
                    "isError": False
                }
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Error executing {tool_name}: {str(e)}"
                        }
                    ],
                    "isError": True
                }
            }
            
    else:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32601,
                "message": f"Method not supported: {method}"
            }
        }

def main():
    log_debug("Starting Workspace Tools MCP Server...")
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
