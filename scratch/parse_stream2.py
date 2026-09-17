import json

with open(r'C:\Users\A5\.gemini\antigravity-ide\brain\949364bf-cb2e-441d-baf4-dafc2801d9ea\.system_generated\steps\33\content.md', 'r', encoding='utf-8') as f:
    html = f.read()

target = 'streamController.enqueue('
idx = 0
items = []

while True:
    pos = html.find(target, idx)
    if pos == -1:
        break
    start = pos + len(target)
    # The argument is a json string literal starting with "
    if html[start] == '"':
        # find matching end quote considering escapes
        i = start + 1
        while i < len(html):
            if html[i] == '\\':
                i += 2
            elif html[i] == '"':
                break
            else:
                i += 1
        raw_json_str = html[start:i+1]
        try:
            unquoted = json.loads(raw_json_str)
            parsed = json.loads(unquoted)
            if isinstance(parsed, list):
                items.extend(parsed)
            elif isinstance(parsed, dict):
                items.append(parsed)
            print(f"Successfully parsed chunk at {pos}, items count: {len(parsed)}")
        except Exception as e:
            print(f"Error parsing at {pos}: {e}")
        idx = i + 1
    else:
        idx = start + 1

# Let's see what items were extracted
texts = []
for it in items:
    if isinstance(it, str) and len(it) > 30 and not it.startswith("http") and not it.startswith("chunk-") and not it.startswith("sha256"):
        # filter out css or asset names
        if "{" not in it and "<" not in it:
            texts.append(it)
        elif "class" in it or "interface" in it or "function" in it or any('\u0600' <= c <= '\u06FF' for c in it):
            texts.append(it)

print(f"Total extracted text pieces: {len(texts)}")
with open('scratch/chat_readable.txt', 'w', encoding='utf-8') as f:
    for i, t in enumerate(texts):
        f.write(f"--- [Piece {i}] ---\n{t}\n\n")
