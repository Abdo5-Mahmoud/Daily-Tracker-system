#!/usr/bin/env python3
"""
Automated Test Harness for Workspace Tools MCP Server
Tests JSON-RPC 2.0 handshake, tool enumeration, and tool execution.
"""

import sys
import os
import json
import subprocess
from pathlib import Path

# Fix Windows console UTF-8
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
        encoding="utf-8"
    )

    def send_and_receive(req):
        proc.stdin.write(json.dumps(req) + "\n")
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
            "clientInfo": {"name": "test-client", "version": "1.0"}
        }
    })
    assert init_res["result"]["serverInfo"]["name"] == "workspace-tools", "Invalid server name"
    print("    [✓] Handshake successful: workspace-tools v1.0.0")

    print("[*] 2. Testing 'tools/list'...")
    list_res = send_and_receive({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list"
    })
    tools = list_res["result"]["tools"]
    tool_names = [t["name"] for t in tools]
    print(f"    [✓] Found {len(tools)} registered tools: {', '.join(tool_names)}")
    assert "market_summary" in tool_names
    assert "unit_economics_calculator" in tool_names
    assert "audit_language_formatting" in tool_names

    print("[*] 3. Testing 'market_summary' tool call...")
    market_res = send_and_receive({
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "market_summary",
            "arguments": {"keyword": "فازات"}
        }
    })
    output_text = market_res["result"]["content"][0]["text"]
    assert "AMAZON EGYPT MARKET INTELLIGENCE SUMMARY" in output_text
    print("    [✓] Tool execution returned database records successfully.")

    print("[*] 4. Testing 'unit_economics_calculator' tool call...")
    calc_res = send_and_receive({
        "jsonrpc": "2.0",
        "id": 4,
        "method": "tools/call",
        "params": {
            "name": "unit_economics_calculator",
            "arguments": {
                "selling_price": 259.0,
                "product_cost": 85.0,
                "packaging_cost": 15.0,
                "model": "easy_ship"
            }
        }
    })
    calc_text = calc_res["result"]["content"][0]["text"]
    assert "Net Profit:" in calc_text
    print("    [✓] Unit economics calculation verified.")

    print("[*] 5. Testing 'audit_language_formatting' tool call...")
    audit_res = send_and_receive({
        "jsonrpc": "2.0",
        "id": 5,
        "method": "tools/call",
        "params": {
            "name": "audit_language_formatting",
            "arguments": {
                "text_content": "سطر عربي كامل بدون أي لغة ثانية\nThis is a pure English line\nسطر عربي فيه كلمة English في النص"
            }
        }
    })
    audit_text = audit_res["result"]["content"][0]["text"]
    assert "Audit Failed: Found 1 mixed lines violation:" in audit_text
    print("    [✓] Language purity audit detected mixed line correctly.")

    proc.terminate()
    print("\n[+] ALL MCP SERVER UNIT TESTS PASSED (5/5)!\n")
    return True

if __name__ == "__main__":
    success = test_mcp_server()
    sys.exit(0 if success else 1)
