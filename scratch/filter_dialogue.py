import json

with open(r'C:\Users\A5\.gemini\antigravity-ide\brain\949364bf-cb2e-441d-baf4-dafc2801d9ea\.system_generated\steps\33\content.md', 'r', encoding='utf-8') as f:
    html = f.read()

target = 'streamController.enqueue('
pos = html.find(target)
start = pos + len(target)
i = start + 1
while i < len(html):
    if html[i] == '\\':
        i += 2
    elif html[i] == '"':
        break
    else:
        i += 1
raw_json_str = html[start:i+1]
unquoted = json.loads(raw_json_str)
parsed = json.loads(unquoted)

# In Remix/Turbo-stream, parsed is a flattened array: [root_obj, val1, val2, ...]
# Let's find mapping or messages
# Search for objects that have 'message' or 'author' or 'role' or 'content'
messages = []
# Let's inspect objects in parsed
for idx, item in enumerate(parsed):
    if isinstance(item, dict):
        # check if it's a message dict or has author / content
        keys = list(item.keys())
        # check if contains 'role'
        for k, v in item.items():
            if v == 'user' or v == 'assistant':
                messages.append((idx, item))

print(f"Found {len(messages)} role items")

# Let's also look for text containing Arabic or code
dialogue = []
for idx, item in enumerate(parsed):
    if isinstance(item, str) and len(item) > 40:
        # Check if it has arabic characters
        if any('\u0600' <= c <= '\u06FF' for c in item):
            dialogue.append((idx, item))

print(f"Found {len(dialogue)} Arabic text chunks")

with open('scratch/chat_dialogue.txt', 'w', encoding='utf-8') as f:
    for idx, text in dialogue:
        f.write(f"--- [Index {idx}] ---\n{text}\n\n")

print("Saved to scratch/chat_dialogue.txt")
