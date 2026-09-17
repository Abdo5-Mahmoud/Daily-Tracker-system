import json
import re

with open(r'C:\Users\A5\.gemini\antigravity-ide\brain\949364bf-cb2e-441d-baf4-dafc2801d9ea\.system_generated\steps\33\content.md', 'r', encoding='utf-8') as f:
    html = f.read()

# find enqueue call
matches = re.findall(r'streamController\.enqueue\(("[^"]*(?:\\.[^"]*)*")\)', html)
print(f"Found {len(matches)} enqueue matches")

full_data = []
for m in matches:
    try:
        # m is a json-encoded string
        decoded_str = json.loads(m)
        # now parse the inner json
        inner = json.loads(decoded_str)
        if isinstance(inner, list):
            full_data.extend(inner)
        elif isinstance(inner, dict):
            full_data.append(inner)
    except Exception as e:
        print("Error parsing match:", e)

# Filter strings in full_data
conversation_texts = []
for item in full_data:
    if isinstance(item, str):
        # check if it looks like human text or arabic or code
        if len(item) > 30 and not item.startswith("http") and not item.startswith("sha256") and not item.startswith("chunk-"):
            conversation_texts.append(item)

print(f"Found {len(conversation_texts)} long text items")
with open('scratch/chat_readable.txt', 'w', encoding='utf-8') as f:
    for idx, t in enumerate(conversation_texts):
        f.write(f"=== Message Item {idx} ===\n{t}\n\n")

print("Saved to scratch/chat_readable.txt")
