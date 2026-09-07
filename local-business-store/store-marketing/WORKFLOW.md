# Store Marketing Workflow (`/store-marketing`) 🛍️📸

> **Trigger**: Run whenever Abdo photographs new decoration items in the store during evening shop hours (4:00 PM - 12:00 AM).

---

## 1. Pipeline Folder Structure
- `basic/`: Drop original, raw photos taken via phone here.
- `edited/`: Enhanced, background-removed, or framed product graphics are outputted here.
- `copy/`: Egyptian Arabic marketing captions with pricing, dimensions, and call-to-actions.
- `catalog.md`: Master table tracking product IDs, paths, prices, and publishing status.

---

## 2. Execution Steps
1. **Input Detection**:
   - Inspect `basic/` for newly added image files.
   - Prompt Abdo for item details: Price (EGP), dimensions/material, and target audience (e.g. bride gifts, salon decor).
2. **Visual Processing**:
   - Advise on Photoroom cutout specifications or produce enhanced asset guidance into `edited/`.
3. **Copywriting Generation**:
   - Generate engaging, conversational Egyptian Arabic social media captions into `copy/[product-id].md`.
   - Include: Hook, product highlights, dimensions, price, store location in Elwraq, and WhatsApp ordering link.
4. **Database Ledger Update**:
   - Automatically append the entry into `catalog.md` with status `Ready to Post`.

---

## 3. Visual Styling & Placement Rules (قواعد التنسيق البصري ومحاكاة البيوت الواقعية)

> **المبدأ الذهبي**: الصورة لا تُباع إذا شعر الزبون أنها "خيالية بزيادة" أو غير قابلة للتطبيق في بيته. الواقعية الأنيقة تبيع، والمبالغة المعقمة تنفر.

1. **منطق توظيف القطع (المكان المحمي vs المكان المَلْطَش)**:
   - التحف الصغيرة، الكريستالات، والأشياء القابلة للكسر مكانها الطبيعي في **أماكن محمية ومخصصة للعرض**:
     - خانات وأرفف وحدة التلفزيون (`TV Unit Cubbies & Cells`).
     - الأرفف الجدارية الصغيرة المعلقة (`Floating Shelves / Wall Niches`).
     - مكتبة الكتب أو وحدات النيش المودرن (`Bookshelves & Display Cabinets`).
   - ممنوع وضع القطع الكريستالية الصغيرة في منتصف ترابيزة صالون عريضة ومفتوحة لأنها في الواقع "مكان مَلْطَش" معرض للحركة والخبط وأكواب الشاي ولا أحد يضع تحفاً صغيرة زجاجية هناك.
2. **محاكاة البيوت المصرية الدافئة بدل الستايل الإسكندنافي البارد**:
   - تجنب الديكورات المعقمة المستوردة التي تشبه رندرات الثري دي الخالية من الروح.
   - استخدم إضاءات دافئة، دهانات حائط واقعية، ولمسات تشبه بيوتنا الأنيقة لكي يتخيل الزبون القطعة في منزله فوراً ويقرر الشراء.

---

## 4. Home Decor Placement Taxonomy (دليل توظيف وتوزيع الديكور في البيوت)

| تصنيف المنتج | الحجم / النوع | أنسب الأماكن في الشقة | سبب التوظيف المنطقي |
| :--- | :--- | :--- | :--- |
| **الكريستال والأنتيكات الصغيرة** | قطع 15 - 25 سم قابلة للكسر | خانات شاشة التلفزيون، الأرفف الجدارية المعلقة، أرفف النيش والمكتبة | مكان محمي من الخبط وحركة الأيدي والأطفال، ومسلط عليه إضاءة مركزة |
| **البوكيهات والفازات الصغيرة** | فازات ترابيزة صغيرة وشموع | ترابيزة القهوة، صينية الضيافة الخشبية، تسريحة غرفة النوم | لمسة رقيقة قريبة من العين، لا تحجب الرؤية، وتتحمل الحركة اليومية |
| **الفازات والبوكيهات الكبيرة** | فازات ضخمة وتنسيقات فخمة | كونسول مدخل الريسيبشن، منتصف ترابيزة السفرة الكبيرة | أول ما تقع عليه عين الضيف ليعطي انطباعاً بالفخامة والترحاب |
| **أشجار الزينة والنباتات الطويلة** | أشجار 120 - 180 سم | الزوايا والأركان الميتة، خلف كراسي الصالون، بجوار الستائر والحائط | كسر جمود الحوائط، ملء الفراغات الميتة، وإعطاء إحساس بالراحة الطبيعية |
| **المفارش والرانرات** | مفارش دانتيل وكتان مطرز | ترابيزات السفرة، البوفيه، ترابيزات الركنة والصالون | حماية الأسطح الخشبية من الخدش وإبراز ألوان الديكور فوقها |

