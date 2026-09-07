# Store Marketing Automation via n8n 🤖📱

> **Docker Status**: The `n8n` container is running locally on port `5678`.  
> **UI Access**: `http://localhost:5678`

---

## 🎯 How The Pipeline Works

```text
[Xiaomi Phone in Store]
   │
   │ 1. Take photo & send to Telegram Bot with details (e.g. "سعر 265 ج ارتفاع 20 سم")
   ▼
[n8n Docker Container (localhost:5678)]
   │
   │ 2. Telegram Trigger intercepts photo & caption
   │ 3. Gemini Node generates warm, non-cringe Egyptian Arabic marketing post
   ▼
[Telegram Message back to your Phone]
   │
   │ 4. Tap "Copy" and publish directly to WhatsApp Status / Facebook Page!
```

---

## 🚀 How to Import & Use

1. **Open n8n**:
   - Open your browser to `http://localhost:5678`.
2. **Import Workflow**:
   - Click **Add Workflow** (or open an existing one).
   - Click the **⋮** menu in the top-right corner ➔ **Import from File**.
   - Choose:
     ```text
     local-business-store/store-marketing/automation/store-marketing-pipeline.json
     ```
3. **Configure Credentials**:
   - In the **Telegram Trigger** & **Send Ready Post** nodes: Add your Telegram Bot Token (created via `@BotFather`).
   - In the **Generate Egyptian Arabic Copy** node: Add your `GEMINI_API_KEY`.
4. **Activate**:
   - Toggle the workflow to **Active**.
