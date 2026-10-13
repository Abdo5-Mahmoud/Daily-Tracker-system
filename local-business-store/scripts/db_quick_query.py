#!/usr/bin/env python3
"""
Amazon Egypt Market Database Quick Query Utility
Allows instant CLI queries against amazon_market.db for fast decision-making.
"""

import sys
import os
import sqlite3
import argparse
from pathlib import Path

# Fix Windows console UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DB_PATH = Path(__file__).resolve().parent.parent / "market-intelligence" / "amazon_market.db"

def get_connection():
    if not DB_PATH.exists():
        print(f"[!] Database file not found at: {DB_PATH}")
        sys.exit(1)
    return sqlite3.connect(DB_PATH)

def show_summary():
    conn = get_connection()
    cur = conn.cursor()
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

    print("\n" + "="*85)
    print("               AMAZON EGYPT MARKET INTELLIGENCE SUMMARY (amazon_market.db)")
    print("="*85)
    header = f"{'KEYWORD':<22} | {'SNAPSHOTS':<9} | {'UNIQUE':<7} | {'AVG EGP':<8} | {'MIN-MAX EGP':<15} | {'SPONSORED'}"
    print(header)
    print("-" * 85)
    for r in rows:
        kw = r[0]
        price_range = f"{r[4]} - {r[5]}"
        spons_str = f"{r[6]} ({r[7]}%)"
        print(f"{kw:<22} | {r[1]:<9} | {r[2]:<7} | {r[3]:<8} | {price_range:<15} | {spons_str}")
    print("="*85 + "\n")

def show_sponsored():
    conn = get_connection()
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
    """)
    rows = cur.fetchall()
    conn.close()

    print("\n" + "="*85)
    print(f"             ACTIVE SPONSORED ADS DETECTED ON AMAZON EG ({len(rows)} items)")
    print("="*85)
    for r in rows:
        title = (r[2] or "Unknown")[:45]
        print(f"[{r[0]}] ASIN: {r[1]} | Price: {r[3]} EGP | Rank: #{r[4]} | Time: {r[5]}")
        print(f"   Title: {title}...")
        print("-" * 85)
    print("="*85 + "\n")

def execute_raw_sql(query):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(query)
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description] if cur.description else []
        print("\n" + " | ".join(cols))
        print("-" * 60)
        for r in rows:
            print(" | ".join(str(c) for c in r))
        print(f"\n[✓] Total rows returned: {len(rows)}\n")
    except Exception as e:
        print(f"[!] SQL Execution Error: {e}")
    finally:
        conn.close()

def main():
    parser = argparse.ArgumentParser(description="Quick SQLite queries for Amazon Market DB")
    parser.add_argument("--summary", action="store_true", help="Display full market summary by keyword")
    parser.add_argument("--sponsored", action="store_true", help="List all detected sponsored ads")
    parser.add_argument("--sql", type=str, help="Execute raw SQL query")

    args = parser.parse_args()

    if args.summary or len(sys.argv) == 1:
        show_summary()
    elif args.sponsored:
        show_sponsored()
    elif args.sql:
        execute_raw_sql(args.sql)

if __name__ == "__main__":
    main()
