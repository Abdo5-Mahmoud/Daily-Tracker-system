import json
import re

path = r'C:\Users\A5\.gemini\antigravity-ide\brain\949364bf-cb2e-441d-baf4-dafc2801d9ea\.system_generated\steps\33\content.md'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
out_lines = []

for idx, s in enumerate(scripts):
    if len(s) > 10000:
        out_lines.append(f"--- Script {idx} (length {len(s)}) ---")
        # Let's search for conversation, messages, mapping, or text in this script
        # Check if there's window.__remixContext or similar
        # Or look for "message": { ... }
        # Let's search for JSON-like strings
        for match in re.finditer(r'"text":\s*"([^"\\]*(?:\\.[^"\\]*)*)"', s):
            text_val = match.group(1).encode().decode('unicode_escape', errors='ignore')
            if len(text_val) > 20:
                out_lines.append(f"[TEXT]: {text_val}\n")
        for match in re.finditer(r'"parts":\s*\["([^"\\]*(?:\\.[^"\\]*)*)"\]', s):
            part_val = match.group(1).encode().decode('unicode_escape', errors='ignore')
            out_lines.append(f"[PART]: {part_val}\n")

with open('scratch/chat_extracted.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out_lines))

print(f"Extracted {len(out_lines)} lines to scratch/chat_extracted.txt")
