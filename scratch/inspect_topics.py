with open('scratch/chat_dialogue.txt', 'r', encoding='utf-8') as f:
    text = f.read()

chunks = text.split('--- [Index ')
out_lines = []
for c in chunks:
    lines = [l.strip() for l in c.split('\n') if l.strip()]
    if lines:
        header = lines[0]
        content_preview = ' '.join(lines[1:4])
        out_lines.append(f"{header}: {content_preview}")

with open('scratch/chat_summary_topics.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(out_lines))

print(f"Wrote {len(out_lines)} topic summaries")
