#!/usr/bin/env python3
"""
TDD Test Suite for Rebuilt Flora_Home Tools:
1. Unified FBA Unit Economics (marketing_calculator.py)
2. Seller Central Ads CSV Analyzer (ads_csv_analyzer.py)
3. Workspace MCP Server upgrades (staleness banners, pure-white image audit, CSV/HTML tools)
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))


class TestRebuiltEconomics(unittest.TestCase):
    def test_fba_economics_includes_13pct_vat_coupon_inbound_and_breakeven_cpc(self):
        from marketing_calculator import calculate_amazon_fba_economics

        res = calculate_amazon_fba_economics(
            cost=55.34,
            price=259.0,
            referral_rate=0.13,
            fba_fee=32.0,
            closing_fee=5.0,
            inbound_shipping=6.86,
            packaging=25.78,
            return_rate=0.03,
            coupon_egp=0.0,
            estimated_cvr=0.10,
            placement_modifier_pct=150.0,
        )
        # Referral 33.67 + FBA 32 + Closing 5 = 70.67; *1.14 = 80.5638 Amazon take
        self.assertAlmostEqual(res["referral_fee"], 33.67, places=2)
        self.assertAlmostEqual(res["net_payout"], 178.44, places=1)
        self.assertIn("break_even_cpc", res)
        self.assertIn("safe_max_base_bid", res)
        self.assertGreater(res["break_even_cpc"], 5.0)
        self.assertAlmostEqual(
            res["safe_max_base_bid"],
            round(res["break_even_cpc"] / 2.5, 2),
            places=2,
        )

    def test_coupon_reduces_net_profit_accurately(self):
        from marketing_calculator import calculate_amazon_fba_economics

        no_coupon = calculate_amazon_fba_economics(cost=55.34, price=259.0, packaging=25.78, coupon_egp=0.0)
        with_coupon = calculate_amazon_fba_economics(cost=55.34, price=259.0, packaging=25.78, coupon_egp=21.0)
        self.assertLess(with_coupon["net_profit"], no_coupon["net_profit"])
        self.assertEqual(with_coupon["effective_price"], 238.0)


class TestAdsCsvAnalyzer(unittest.TestCase):
    def test_parses_arabic_search_terms_and_flags_nlp_mismatch_and_waste(self):
        from ads_csv_analyzer import analyze_ads_csv_content

        csv_text = "\ufeffمصطلح البحث لدى العميل,الكلمات الرئيسية,مرات الظهور,النقرات,إجمالي التكلفة,المشتريات,المبيعات\n"
        csv_text += "vase,المطابقة القريبة,1710,4,5.06 ج.م.,0,0\n"
        csv_text += "فازة,المطابقة غير المحددة,300,2,4.07 ج.م.,1,259.00 ج.م.\n"
        csv_text += "ورد صناعى كانه طبيعى مع فازه,المطابقة غير المحددة,112,1,1.15 ج.م.,0,0\n"

        report = analyze_ads_csv_content(csv_text)
        self.assertEqual(report["total_terms"], 3)
        self.assertAlmostEqual(report["total_spend"], 10.28, places=2)
        self.assertAlmostEqual(report["total_sales"], 259.0, places=2)
        self.assertIn("فازة", [t["search_term"] for t in report["winners"]])
        self.assertIn("vase", [t["search_term"] for t in report["waste_candidates"]])
        self.assertTrue(report["nlp_mismatch_detected"], "Should detect Arabic queries landing in Loose-match while English landed in Close-match")


class TestWorkspaceMcpUpgrades(unittest.TestCase):
    def test_market_summary_warns_loudly_on_stale_october_data(self):
        import sqlite3
        import workspace_mcp_server as mcp

        with tempfile.TemporaryDirectory() as tmp:
            stale_db = Path(tmp) / "stale.db"
            conn = sqlite3.connect(stale_db)
            conn.execute("CREATE TABLE products (asin TEXT PRIMARY KEY, title TEXT)")
            conn.execute(
                "CREATE TABLE snapshots (asin TEXT, keyword TEXT, price REAL, is_sponsored INTEGER, captured_at TEXT)"
            )
            conn.execute("INSERT INTO products VALUES ('B0OLD12345', 'Old Vase')")
            conn.execute(
                "INSERT INTO snapshots VALUES ('B0OLD12345', 'فازات', 199.0, 0, '2026-10-02T10:00:00.000Z')"
            )
            conn.commit()
            conn.close()

            orig_db = mcp.DB_PATH
            try:
                mcp.DB_PATH = stale_db
                out = mcp.tool_market_summary("فازات")
            finally:
                mcp.DB_PATH = orig_db
        self.assertIn("STALE", out.upper())

    def test_image_compliance_catches_non_white_gray_background(self):
        from workspace_mcp_server import tool_audit_image_compliance

        with tempfile.TemporaryDirectory() as tmp:
            pure_white = Path(tmp) / "pure.jpg"
            gray_bg = Path(tmp) / "gray.jpg"
            Image.new("RGB", (1200, 1200), (255, 255, 255)).save(pure_white)
            Image.new("RGB", (1200, 1200), (235, 235, 235)).save(gray_bg)

            res_white = tool_audit_image_compliance(str(pure_white))
            res_gray = tool_audit_image_compliance(str(gray_bg))
            self.assertIn("PASS", res_white)
            self.assertIn("NON-COMPLIANT", res_gray.upper())

    def test_mcp_exposes_new_tools_via_jsonrpc(self):
        server = SCRIPTS_DIR / "workspace_mcp_server.py"
        proc = subprocess.Popen(
            [sys.executable, str(server)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
        )
        try:
            proc.stdin.write(json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/list"}) + "\n")
            proc.stdin.flush()
            res = json.loads(proc.stdout.readline())
            names = [t["name"] for t in res["result"]["tools"]]
            self.assertIn("analyze_ads_csv", names)
            self.assertIn("ingest_amazon_html", names)
        finally:
            proc.terminate()
            proc.wait(timeout=5)
            for pipe in (proc.stdin, proc.stdout, proc.stderr):
                if pipe:
                    pipe.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
