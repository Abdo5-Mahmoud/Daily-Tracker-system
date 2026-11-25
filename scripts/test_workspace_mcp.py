#!/usr/bin/env python3
"""
End-to-End JSON-RPC Test Harness for Flora_Home Workspace Tools MCP Server v2.0.
Verifies handshake, all 9 tool schemas, freshness guards, 13% FBA unit economics,
pure-white image validation, Arabic Ads CSV parsing, and CAPTCHA guard in HTML ingestion.
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def test_mcp_server():
    server_script = Path(__file__).resolve().parent / "workspace_mcp_server.py"
    if not server_script.exists():
        print(f"[!] Server script not found at {server_script}")
        return False

    proc = subprocess.Popen(
        [sys.executable, str(server_script)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )

    try:
        def send_and_receive(req):
            proc.stdin.write(json.dumps(req, ensure_ascii=False) + "\n")
            proc.stdin.flush()
            line = proc.stdout.readline()
            return json.loads(line)

        print("[*] 1. Testing 'initialize' handshake...")
        init_res = send_and_receive({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "test-client", "version": "2.0"},
            },
        })
        assert init_res["result"]["serverInfo"]["name"] == "workspace-tools"
        assert init_res["result"]["serverInfo"]["version"] == "2.0.0"
        print("    [OK] Handshake verified: workspace-tools v2.0.0")

        print("[*] 2. Testing 'tools/list' (9 tools)...")
        list_res = send_and_receive({"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
        tool_names = [t["name"] for t in list_res["result"]["tools"]]
        expected_tools = {
            "market_summary",
            "market_sponsored_radar",
            "market_sql_query",
            "unit_economics_calculator",
            "audit_language_formatting",
            "audit_image_compliance",
            "page_one_radar_log",
            "analyze_ads_csv",
            "ingest_amazon_html",
        }
        assert expected_tools.issubset(set(tool_names)), f"Missing tools: {expected_tools - set(tool_names)}"
        print(f"    [OK] Registered {len(tool_names)} tools cleanly")

        print("[*] 3. Testing 'market_summary' freshness & live Nov 25 snapshot check...")
        live_res = send_and_receive({
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {"name": "market_summary", "arguments": {"keyword": "فازة"}},
        })
        live_text = live_res["result"]["content"][0]["text"]
        assert "AMAZON EGYPT MARKET INTELLIGENCE SUMMARY" in live_text
        assert "FRESHNESS CHECK" in live_text

        stale_res = send_and_receive({
            "jsonrpc": "2.0",
            "id": 30,
            "method": "tools/call",
            "params": {"name": "market_summary", "arguments": {"keyword": "ديكور شقق"}},
        })
        stale_text = stale_res["result"]["content"][0]["text"]
        assert "STALE DATA WARNING" in stale_text
        print("    [OK] Market summary distinguishes FRESH live snapshots vs STALE historical baseline")

        print("[*] 4. Testing 'unit_economics_calculator' (13% FBA + Break-Even CPC)...")
        calc_res = send_and_receive({
            "jsonrpc": "2.0",
            "id": 4,
            "method": "tools/call",
            "params": {
                "name": "unit_economics_calculator",
                "arguments": {
                    "selling_price": 259.0,
                    "product_cost": 55.34,
                    "packaging_cost": 25.78,
                    "model": "fba",
                },
            },
        })
        calc_text = calc_res["result"]["content"][0]["text"]
        assert "Referral Fee (13.0%):    33.67 EGP" in calc_text
        assert "Net Profit:" in calc_text
        assert "Break-Even CPC" in calc_text
        print("    [OK] Unified 13% FBA economics verified")

        print("[*] 5. Testing 'audit_language_formatting'...")
        audit_res = send_and_receive({
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call",
            "params": {
                "name": "audit_language_formatting",
                "arguments": {
                    "text_content": "سطر عربي كامل بدون أي لغة ثانية\nPure English line\nسطر عربي فيه كلمة English في النص"
                },
            },
        })
        audit_text = audit_res["result"]["content"][0]["text"]
        assert "Audit Failed: Found 1 mixed lines violation:" in audit_text
        print("    [OK] Language line-purity gate verified")

        print("[*] 6. Testing 'audit_image_compliance' pure-white corner check...")
        with tempfile.TemporaryDirectory() as tmp:
            gray_img = Path(tmp) / "gray_bg.jpg"
            Image.new("RGB", (1200, 1200), (240, 240, 240)).save(gray_img)
            img_res = send_and_receive({
                "jsonrpc": "2.0",
                "id": 6,
                "method": "tools/call",
                "params": {"name": "audit_image_compliance", "arguments": {"image_path": str(gray_img)}},
            })
            img_text = img_res["result"]["content"][0]["text"]
            assert "NON-COMPLIANT" in img_text
        print("    [OK] Pure-white background violation detected cleanly")

        print("[*] 7. Testing 'analyze_ads_csv' via JSON-RPC...")
        csv_payload = (
            "مصطلح البحث لدى العميل,الكلمات الرئيسية,مرات الظهور,النقرات,إجمالي التكلفة,المشتريات,المبيعات\n"
            "vase,المطابقة القريبة,1710,4,5.06 ج.م.,0,0\n"
            "فازة,المطابقة غير المحددة,300,2,4.07 ج.م.,1,259.00 ج.م.\n"
        )
        ads_res = send_and_receive({
            "jsonrpc": "2.0",
            "id": 7,
            "method": "tools/call",
            "params": {"name": "analyze_ads_csv", "arguments": {"csv_content": csv_payload}},
        })
        ads_text = ads_res["result"]["content"][0]["text"]
        assert "WINNERS -> PROMOTE TO MANUAL EXACT" in ads_text
        assert "NLP GROUP ALERT" in ads_text
        print("    [OK] Seller Central Ads CSV analyzer verified")

        print("[*] 8. Testing 'ingest_amazon_html' rejects CAPTCHA pages loudly...")
        with tempfile.TemporaryDirectory() as tmp:
            captcha_html = Path(tmp) / "blocked.html"
            captcha_html.write_text("<html><title>Robot Check</title><form action='/errors/validateCaptcha'></form></html>", encoding="utf-8")
            ingest_res = send_and_receive({
                "jsonrpc": "2.0",
                "id": 8,
                "method": "tools/call",
                "params": {"name": "ingest_amazon_html", "arguments": {"file_path": str(captcha_html), "keyword": "فازة"}},
            })
            ingest_text = ingest_res["result"]["content"][0]["text"]
            assert "Blocked HTML / CAPTCHA" in ingest_text
        print("    [OK] HTML ingestion CAPTCHA guard verified")

        print("[+] ALL MCP SERVER TESTS PASSED (8/8)!")
        return True
    finally:
        proc.terminate()
        proc.wait(timeout=5)
        for pipe in (proc.stdin, proc.stdout, proc.stderr):
            if pipe:
                pipe.close()


if __name__ == "__main__":
    success = test_mcp_server()
    sys.exit(0 if success else 1)
