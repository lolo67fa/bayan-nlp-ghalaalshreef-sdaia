# DATA CARD — Bayan

## Dataset identity

- **Name/version:** Bayan synthetic course dataset, Student Edition v1.0
- **Source/creator:** أُنشئت للدورة وقُدّمت مع حزمة الطالب. المصدر العام: `almiyead-rgb/bayan-applied-nlp-course`، ومُستنسخة في `data/sample/` في هذا المستودع.
- **License/permission:** بيانات دورة اصطناعية، مصرّح باستخدامها للأغراض التعليمية داخل برنامج SDA-AIE-211. **لم تُستبدل ببيانات أخرى**، فلم تلزم موافقة إضافية من المدربة.
- **Data hash (SHA-256):**

| ملف | SHA-256 | سجلات | حجم |
|---|---|---:|---:|
| `bayan_day1_sample.csv` | `904a5e1e860f23ac447307ecb2007e6f0cec253daa844c1e3395298d31b98a9a` | 12 | 869 B |
| `bayan_day2_classification.csv` | `c50de92fdab1aa36b19cf4c0f6e31c0bc521f70d6690635e839d7ba9ec7e9a77` | 40 | 3497 B |
| `bayan_day2_ner.jsonl` | `ab413f0941656abf6f31ac16122abcb437d4c8c56b7cf820624e6a367bd4336e` | 12 | 1860 B |
| `bayan_day2_qa.json` | `4e894757b74d09df9e91140dd78ba6e0fcf8cffd052e2ab5702a7487a3e46f2f` | 10 | 3161 B |
| `bayan_day3_arabic.csv` | `0a3346b6177d0c0b9b4e9734845579325f852ef7953e9e536fb1494ca9678889` | 20 | 1724 B |
| `bayan_day3_cases.csv` | `322867b54d1f6f358346197728452ca278b12dfd8ee9795c0a37cb674f3ebadd` | 24 | 3750 B |
| `bayan_day3_predictions.csv` | `63b4df9dab076880b64ae0054009c5b136938e7df9ba0ff656656212b5817c8d` | 36 | 4206 B |
| `bayan_day3_queries.jsonl` | `f80ebd8b25c37b3317cba1a985b6cd40a8f0e7ad242c7584402795d73abcbe6b` | 18 | 3053 B |

- **تاريخ النسخ إلى المستودع:** 2026-08-30، commit `05147e0`
- **Intended educational task:** تصنيف الموضوع والمشاعر · استخراج الكيانات · الإجابة الاستخراجية · البحث الدلالي · تعليم منهج التقييم

## Composition

**ملف التصنيف** `bayan_day2_classification.csv` — الأساس لكل المهام التالية:

| Split | Rows | Arabic | English | Groups | Notes |
|---|---:|---:|---:|---:|---|
| train | 24 | 12 | 12 | 12 | كل الفئات الأربع حاضرة |
| validation | 8 | 4 | 4 | 4 | يُستخدم لاختيار الـ epoch وضبط العتبات وحمل القياس |
| frozen test | 8 | 4 | 4 | 4 | لم يُستخدم لأي ضبط |
| **المجموع** | **40** | **20** | **20** | **20** | `group_overlap == 0` |

**الملفات الأخرى:**

| ملف | Rows | التوزيع |
|---|---:|---|
| NER | 12 | train 8 · validation 2 · test 2 |
| QA | 10 | train 6 · validation 2 · test 2 — منها **2 بلا إجابة** |
| Arabic variants | 20 | Gulf 9 · MSA 9 · Arabizi 2 |
| Search cases | 24 | corpus البحث |
| Search queries | 18 | validation 10 · test 8 — القابلة للإجابة 6 في كل قسم |
| Evaluation predictions | 36 | validation فقط · ar 24 / en 12 · Gulf 12 / MSA 12 / English 12 · long 18 / short 18 |

## Fields and labels

| Field/label | Meaning | Allowed values | Missing-value rule |
|---|---|---|---|
| `example_id` / `case_id` / `record_id` / `query_id` | معرّف اصطناعي فريد | نص | لا يُسمح بالفراغ ولا بالتكرار |
| `group_id` | مفتاح تجميع الصياغات المتشابهة | نص | إلزامي — بدونه يستحيل منع التسرب |
| `split` | القسم | `train` · `validation` · `test` | إلزامي |
| `language` | اللغة | `ar` · `en` | إلزامي |
| `variant` | التنويع | `MSA` · `Gulf` · `Arabizi` · `English` | إلزامي في ملفات اليوم الثالث |
| `text` | نص الملاحظة الاصطناعية | نص حر | لا يُسمح بالفراغ |
| `topic` | فئة الموضوع | `digital_service` · `health` · `permit` · `transport` | إلزامي |
| `sentiment` | المشاعر | `negative` · `neutral` · `positive` | إلزامي في ملف التصنيف |
| `tokens` / `ner_tags` | كلمات ووسوم BIO متوازية | 8 وسوم: `O` · `B/I-SERVICE` · `B/I-ORG` · `B-LOCATION` · `B-DATE` · `B-REF_NUM` | الطولان متساويان إلزامًا |
| `context` / `question` | نص السؤال وسياقه | نص | إلزامي |
| `answer_text` / `answer_start` | الجواب وإزاحته | نص + عدد، **أو `null`** | `null` يعني حالة لا-إجابة مقصودة، لا قيمة مفقودة |
| `relevant_case_ids` | الحالات الصحيحة للاستعلام | قائمة معرّفات، قد تكون **فارغة** | القائمة الفارغة تعني استعلامًا بلا إجابة |
| `retrieval_mode` | نمط الاسترجاع | `monolingual` · `cross_lingual` · `no_answer` | إلزامي |
| `length_bucket` | شريحة الطول | `short` · `long` | إلزامي في ملف التقييم |
| `prediction_a` / `prediction_b` | تنبؤات نظامين افتراضيين | إحدى فئات الموضوع | `COURSE_FIXTURE` — ليست مخرجات نماذج هذا المشروع |

⚠️ **`answer_text = null` و `relevant_case_ids = []` ليستا قيمًا مفقودة.** هما الحالة الصحيحة الوحيدة حين لا يحتوي السياق على إجابة، ومعاملتهما كنقص بيانات يفسد سياسة الـ null كليًا.

## Collection/generation

الأمثلة **مُولَّدة اصطناعيًا** للدورة. لا تحوي نصوص مستخدمين حقيقيين ولا شكاوى فعلية ولا تغريدات ولا محادثات منسوخة. صيغت لتغطي أربعة مواضيع خدمية بلغتين وثلاثة تنويعات عربية، مع أمثلة PII مصطنعة (`test@example.com`، `0551234567`) موضوعة عمدًا لاختبار الإخفاء.

راجعتها المدربة قبل التوزيع. لم تُستبدل ولم تُضَف إليها بيانات من المتدربة.

## Cleaning and preprocessing

- **Display copy rule:** يُحتفظ بنسختين لكل مدخل. `display_text` هو ما يُعرض، و`model_text` هو ما يدخل النموذج. الدفاتر تُثبت ببيان `assert` أن النسخة المعروضة تنجو من كل تحويل.
- **PII masking rule:** البريد ← `<EMAIL>`، أنماط الجوال السعودي ← `<PHONE>`. الإخفاء يُطبَّق **قبل** ضبط المسافات، وإلا تغيّر شكل النمط قبل التقاطه.
- **Arabic profile/version:** ملفان معلنان بالنسخة `1.0.0`، backend `camel-tools==1.6.0`:
  - `conservative` — NFC · إزالة التطويل · ضبط المسافات · إخفاء PII
  - `search` — ما سبق + إزالة التشكيل + توحيد الألف + `ى → ي`
  - **التاء المربوطة `ة` لا تتحول إلى `ه` في أيٍّ منهما** — تحويل يدمج فروقًا ذات معنى وقد يفسد حدود الكيان في NER.
  - أربعة اختبارات ذهبية تعمل **قبل** معالجة أي corpus.
- **Deduplication/grouping:** `group_id` يربط الصياغات المتشابهة. الأزواج المترجمة تحمل نفس المجموعة.
- **Filtering/exclusions:** لا حذف ولا ترشيح. البيانات تُستخدم كما وصلت.

## Split and leakage controls

- **Split method/seed:** التقسيم مُعلَن مسبقًا داخل عمود `split`، ولم يُعد توليده. البذرة 42 للتدريب والتقييم.
- **Group isolation evidence:** `validate_splits` تُرجع `group_overlap == 0` وتتحقق أن كل قسم يحوي كل الفئات. مُثبت في `notebooks/03_text_classification.ipynb` وفي `tests/test_day2_splits.py`.
- **Near-duplicate audit:** المخاطرة الأساسية أن تظهر شكوى واحدة بصياغتين، واحدة في التدريب وأخرى في الاختبار — فيتذكّر النموذج بدل أن يعمّم، وترتفع الدرجة وهي كذبة. `group_id` هو الضابط، وفحص التداخل هو الدليل.
- **Frozen-test access date and commit:** قسم `test` لم يُستخدم لأي ضبط ولا لاختيار epoch ولا لمعايرة عتبة. ضبط عتبة البحث جرى على validation **فقط** ثم جُمّدت عند 0.4592 وطُبّقت دون تغيير على test — `notebooks/06_semantic_search.ipynb`، commit `3c22f9d`.

## Known gaps and risks

- **Dialects/Arabizi:** Gulf 9 · MSA 9 · Arabizi **2 فقط**. حالتا Arabizi لا تكفيان لأي ادعاء. وتحليل الشرائح يُظهر Gulf أضعف من MSA بنحو 18 نقطة، بفترات ثقة واسعة.
- **Class balance:** فئات الموضوع متوازنة (10 لكل فئة). لكن التنويعات والأطوال ليست متوازنة عبر الفئات، فلا يمكن فصل أثر التنويع عن أثر الفئة.
- **Synthetic-to-real gap:** النصوص مكتوبة نظيفة ومتسقة. اللغة الحقيقية أكثر فوضى — أخطاء إملائية، خلط لغات داخل الجملة، رموز، تكرار. أي رقم هنا لا يتنبأ بالسلوك على نص حقيقي.
- **Annotation ambiguity:** بعض الملاحظات قد تنتمي لفئتين — تأخر موعد عيادة يُحجز عبر بوابة رقمية يقبل `health` و`digital_service`. تصنيف الأخطاء يحوي وسم `annotation_ambiguity` لهذا السبب.
- **Small slices/uncertainty:** حجم العينة 8 إلى 40 صفًا. تحليل فترات الثقة في `EVALUATION_REPORT.md` يبيّن أن فارقًا قدره 0.0012 بين نظامين تبتلعه فترتان متداخلتان بالكامل. أي شريحة أصغر من 15 صفًا تُوسم `SMALL_SLICE` ولا تُحذف.
- **Misuse/privacy risk:** الخطر الرئيسي هو **الادعاء**، لا التسريب. البيانات اصطناعية بالكامل، لكن تقديم أرقامها كأداء إنتاجي يُضلّل. لهذا كل رقم في هذا المشروع يحمل وسمًا صريحًا.

## Permitted and prohibited use

**مسموح:**
- التعلّم والتجريب والتقييم داخل برنامج SDA-AIE-211
- التوضيح والعرض مع الإفصاح عن الطبيعة الاصطناعية وحجم العينة

**ممنوع:**
- أي قرار يمسّ فردًا — توجيه شكوى حقيقية، تحديد أولوية، أو تقييم خدمة
- تقديم أي رقم منها كأداء إنتاجي أو حكومي
- خلطها ببيانات حقيقية أو استخدامها كبديل عن بيانات حقيقية
- إعادة توزيعها بوصفها بيانات واقعية

**Human review:** كل الأمثلة من إعداد الدورة ومراجعتها. لم تُضف المتدربة أي بيانات، ولم تُعدَّل الملفات الأصلية.

## Maintenance

- **Owner/contact:** عبر GitHub — `lolo67fa/bayan-nlp-ghalaalshreef-sdaia`، Issues
- **Change/version policy:** الملفات مجمّدة عند التجزئات أعلاه. أي تغيير يستلزم نسخة جديدة، وتجزئة جديدة، وإعادة قياس كل رقم يعتمد عليها، وقرارًا ناسخًا في `DECISIONS.md`.
- **Index/model rebuild triggers:** يُعاد بناء الفهرس ويُعاد ضبط العتبة إذا تغيّر أي من: ملفات الحالات أو الاستعلامات · نسخة الـ profile العربية (حاليًا `1.0.0`) · نموذج التمثيل · قيمة `K`.
