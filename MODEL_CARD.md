# بطاقة نموذج بيان | Bayan Model Card

هذا الملف يغطي خمس مصنوعات مدرَّبة أو مستخدَمة في المشروع. مقاييس كل artefact في قسمها الخاص — لا تُدمج مقاييس checkpoints مختلفة في صف واحد.

**قاعدة القراءة:** كل رقم يحمل وسمًا. `MEASURED_SMOKE` مقاس على عينة الدورة الصغيرة ويثبت سلامة المسار لا الجاهزية. `MEASURED` مقاس على مصنوعة المشروع الفعلية. `COURSE_FIXTURE` تنبؤات تقدمها الدورة لتعليم منهج التقييم.

**Repository:** https://github.com/lolo67fa/bayan-nlp-ghalaalshreef-sdaia
**Programme:** SDA-AIE-211 · SDAIA Academy · Instructor: Meaad Al-Marri
**Owner role:** Trainee, SDA-AIE-211

---

# A) Topic classifier — the served artefact

## Model details

- **Name/version:** `bayan-topic-classifier` / `project-v1`
- **Base checkpoint:** `distilbert/distilbert-base-multilingual-cased`
- **Task:** single-label topic classification over 4 classes — digital_service, health, permit, transport
- **License/source:** Apache-2.0, Hugging Face Hub
- **Model state SHA-256:** `e3f69650dcf31b0e04c23e4c1a8cbecd22b384e282081c76fd99db14bd3a76ae`
- **Served runtime:** ONNX FP32, SHA-256 `13dccd6bbb6326ec4325fae93e6c650b5e3b7e2b517aaee64d736ec64fae9125`
- **Commit SHA:** `dc95a52`
- **Owner/contact role:** Trainee, SDA-AIE-211

## Intended use

- **الاستخدام المقصود:** تصنيف موضوع ملاحظات المستفيدين القصيرة بالعربية والإنجليزية داخل بيئة تعليمية.
- **المستخدمون المقصودون:** المتدربة والمدربة والمقيّمون في البرنامج.
- **خارج النطاق:**
  - أي قرار يمسّ فردًا — لا توجيه شكاوى حقيقية ولا تحديد أولوية خدمة
  - أي استخدام حكومي أو تشغيلي؛ المشروع لا يمثل نظامًا حكوميًا حقيقيًا
  - نصوص خارج ar/en، أو نصوص طويلة تتجاوز 96 token
  - أي استنتاج عن جودة الإنتاج من الأرقام أدناه

## Data and preprocessing

- **Dataset ID/version:** `bayan_day2_classification.csv` — بيانات الدورة الاصطناعية
- **Languages/variants:** ar (20 صفًا) · en (20 صفًا) · MSA و Gulf
- **Split strategy:** train 24 / validation 8 / test 8، بمفتاح `group_id` يمنع تفرّق الصياغات المتشابهة. `group_overlap == 0` مُثبت باختبار، وكل قسم يحوي كل الفئات.
- **PII policy:** إخفاء البريد وأنماط الجوال السعودي قبل ضبط المسافات. النسخة الأصلية محفوظة ولا تُرسل للنموذج.
- **Preprocessing profile/version/backend:** `conservative` v`1.0.0`، backend `camel-tools==1.6.0`. لا إزالة تشكيل ولا توحيد ألف. التاء المربوطة `ة` لا تتحول إلى `ه`.
- **Tokenizer:** `distilbert/distilbert-base-multilingual-cased`، fast، `max_length=96`

## Evaluation

| metric / slice | n | result | uncertainty | evidence |
|---|---:|---:|---|---|
| macro-F1 validation — TF-IDF baseline `[MEASURED_SMOKE]` | 8 | 0.6667 | لم تُحسب | `notebooks/03_text_classification.ipynb` |
| macro-F1 validation — transformer, epoch 2 `[MEASURED_SMOKE]` | 8 | 0.5500 | لم تُحسب | نفسه |
| delta مقابل خط الأساس | 8 | −0.1167 | لا يدعم ادعاءً اتجاهيًا | نفسه |
| macro-F1 على حمل الخدمة `[MEASURED]` | 8 | 0.5500 | — | `reports/benchmark_results.json` |
| `group_overlap` | 40 | 0 | — | نفسه |

⚠️ **قراءة الفرق:** خط الأساس تفوّق على المحوّل بـ 11.67 نقطة. هذا متوقع على 24 صفًا تدريبيًا: نموذج بملايين المعاملات لا يتعلّم من هذا الحجم، بينما TF-IDF على مستوى الحروف يستغل أنماطًا سطحية بكفاءة. **ولا يُستنتج اتجاه من هذا الرقم في أي من الجهتين** — تحليل فترات الثقة في `EVALUATION_REPORT.md` يبيّن أن الفروق على هذا الحجم تبتلعها الفترات.

## Behavioural checks

| capability | pass rate | known failure |
|---|---:|---|
| عقد النسختين — النسخة الأصلية سليمة | 100% | لا شيء |
| إخفاء PII قبل الطباعة والتسجيل | 100% | يغطي البريد والجوال السعودي فقط |
| الاختبارات الذهبية للـ profile | 4/4 | لا شيء |
| عقد الخدمة: مدخل صالح → 200 | 100% | لا شيء |
| عقد الخدمة: مدخل فارغ أو طويل → 422 | 100% | لا شيء |
| canaries عند الإقلاع | 2/2 | لا شيء |
| تقسيم الجمل | فشل موثّق | يكسر عند `د.` فيعيد ثلاث جمل بدل اثنتين |

## Limitations and risks

1. **حجم العينة 40 صفًا اصطناعيًا.** لا يدعم أي ادعاء عن الأداء خارج بيانات الدورة.
2. **بذرة واحدة.** تباين البذور غير مقاس، فلم يُفصل أي فرق عن تقلب التشغيل.
3. **فجوة اللهجة.** شريحة Gulf أضعف من MSA بنحو 18 نقطة في تحليل الشرائح، ومقارنة مستقلة أعطت المشفّر المتعدد اللغات 0.0 مقابل CAMeLBERT 0.6667 على اختبار Gulf مجمّد.
4. **فجوة الطول.** النصوص الطويلة أضعف من القصيرة بنحو 30 نقطة.
5. **لا معايرة احتمالية.** `confidence` المُعاد من الخدمة هو softmax خام وليس احتمالًا معايَرًا.
6. **`max_length=96`** كافٍ لهذه العينة (صفر قص) لكنه غير مُختبر على نصوص أطول.

## Ethical and privacy notes

بيانات اصطناعية من الدورة حصرًا؛ لا نصوص مستخدمين حقيقيين ولا شكاوى فعلية. الإخفاء تعليمي يغطي البريد وأنماط الجوال السعودي، وليس كاشف PII إنتاجيًا ولم يُراجع قانونيًا. **المشروع لا يمثل نظامًا حكوميًا حقيقيًا ولا يُقدَّم أي ادعاء إنتاجي.** لا أوزان ولا cache ولا أسرار في المستودع.

## Reproduction

1. افتحي `notebooks/03_text_classification.ipynb` في Google Colab
2. Runtime: T4 GPU (أو CPU — الوضع يتغير تلقائيًا إلى `partial_finetune_cpu` ويُسجَّل)
3. النسخ: transformers 5.15.1 · tokenizers 0.22.2 · scikit-learn 1.9.0
4. `Runtime → Restart session and run all` من commit `44aabf7`
5. قارني مع: `DAY2_NOTEBOOK3_CORE=PASS` وأرقام قسم Evaluation أعلاه

---

# B) NER tagger

## Model details

- **Name/version:** `bayan-ner` / `smoke-v1`
- **Base checkpoint:** `distilbert/distilbert-base-multilingual-cased`
- **Task:** token classification، BIO، 8 وسوم — O · B/I-SERVICE · B/I-ORG · B-LOCATION · B-DATE · B-REF_NUM
- **License/source:** Apache-2.0
- **Commit SHA:** `1b4c212`
- **الحالة:** مصنوعة تعليمية. **لا تُخدَم.**

## Intended use

- **المقصود:** إثبات صحة محاذاة الـ labels مع الـ subwords وصرامة القياس على مستوى الكيان.
- **خارج النطاق:** أي استخراج كيانات فعلي. النموذج لم يتعلّم المهمة (انظر Evaluation).

## Data and preprocessing

- **Dataset:** `bayan_day2_ner.jsonl` — 12 صفًا (train 8 / validation 2 / test 2)
- **سياسة المحاذاة:** الرموز الخاصة `-100` · أول subword يحمل label الكلمة · بقية الـ subwords `-100`. القيمة `-100` تتجاهلها دالة الخسارة، فتُسهم الكلمة المكسورة بموضع مُشرَف واحد بدل أن تعلّم النموذج أن نصف الكيان ليس كيانًا. المسألة أشد في العربية لأن اللصائق تكسر الكلمات أكثر.

## Evaluation

| metric / slice | n | result | uncertainty | evidence |
|---|---:|---:|---|---|
| entity-level precision `[MEASURED_SMOKE]` | 4 كيانات | 0.0 | — | `notebooks/04_ner_and_qa.ipynb` |
| entity-level recall `[MEASURED_SMOKE]` | 4 | 0.0 | — | نفسه |
| entity-level F1 `[MEASURED_SMOKE]` | 4 | 0.0 | — | نفسه |
| كيانات متوقَّعة | — | 0 من 4 | — | نفسه |
| خسارة التدريب | 8 خطوات | 2.3076 → 1.9365 | — | نفسه |
| اختبار الحدود الصارم | 1 | F1 = 0.0 | — | نفسه |

⚠️ **F1 = 0.0 لأن النموذج لم يتوقّع أي كيان.** بعد 8 خطوات، الرأس المهيّأ عشوائيًا لا يزال يجد الفئة الأغلبية `O` أسرع طريق لخفض الخسارة. انخفاض الخسارة يثبت أن المسار يعمل، لا أن المهمة تُعلِّمت.

**اختبار الحدود الصارم:** `[B-ORG, I-ORG, O]` مقابل `[B-ORG, O, O]` يعطي F1 = **صفر** بالضبط. على مستوى الـ tokens كان سيعطي 67%. كيان نصفه صحيح ليس كيانًا.

## Behavioural checks

| capability | pass rate | known failure |
|---|---:|---|
| محاذاة `-100` للرموز الخاصة | 100% | لا شيء |
| موضع مُشرَف واحد لكل كلمة | 100% | لا شيء |
| رفض المطابقة الجزئية | 100% | لا شيء |

## Limitations and risks

1. **صفر كيانات متوقَّعة.** لا استخدام تنبؤي على الإطلاق.
2. **12 صفًا** — لا تكفي لتعلّم 8 وسوم.
3. **هدف `entity F1 ≥ 0.80`** يُقاس على حزمة البيانات المجمّدة، لا هنا.

## Reproduction

`notebooks/04_ner_and_qa.ipynb` · T4 GPU · commit `1b4c212` · قارني مع `NER_ALIGNMENT_CONTRACT=PASS` و `Strict entity-boundary test=PASS`

---

# C) Extractive QA

## Model details

- **Name/version:** `bayan-qa` / `smoke-v1`
- **Base checkpoint:** `distilbert/distilbert-base-multilingual-cased`
- **Task:** استخراج span مع دعم اللا-إجابة
- **Commit SHA:** `1b4c212`
- **الحالة:** مصنوعة تعليمية. **لا تُخدَم.**

## Intended use

- **المقصود:** إثبات صحة معالجة ما بعد التنبؤ وسياسة الـ null.
- **خارج النطاق:** أي إجابة على سؤال حقيقي.

## Data and preprocessing

- **Dataset:** `bayan_day2_qa.json` — 10 أمثلة (train 6 / validation 2 / test 2)، منها **2 بلا إجابة**
- **قيود الـ span:** `start ≤ end` · `max_answer_length=48` · `top_k=20` · مقارنة بدرجة الـ null

## Evaluation

| metric / slice | n | result | uncertainty | evidence |
|---|---:|---:|---|---|
| span صحيح `[MEASURED_SMOKE]` | 1 | `الرياض` — score 8.5، null_margin −8.5 | — | `notebooks/04_ner_and_qa.ipynb` |
| حالة لا-إجابة `[MEASURED_SMOKE]` | 1 | `None`، السبب `no_answer_in_context`، margin 6.0 | — | نفسه |
| حالات لا-إجابة في البيانات | 10 | 2 | — | نفسه |

**سياسة الـ null:** نظام يستخرج جوابًا دائمًا هو نظام يهلوس. حين يغلب هامش الـ null، تُعاد `None` مع سبب صريح بدل فرض span. الهامش الموجب 6.0 يبيّن أن الـ null فاز فعلًا ولم يُلجأ إليه افتراضيًا.

## Limitations and risks

1. **4 خطوات تدريب فقط.** لا قدرة تنبؤية.
2. **10 أمثلة بحالتَي لا-إجابة**، بينما الشرط الرسمي `17/20` يُقاس على البيانات المجمّدة.
3. **العتبة `null_threshold=0.0` غير مضبوطة** على بيانات validation.

## Reproduction

`notebooks/04_ner_and_qa.ipynb` · commit `1b4c212` · قارني مع `QA post-processing tests=PASS`

---

# D) Sentence encoder — semantic search

## Model details

- **Name/version:** `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- **Task:** تمثيل الجمل للبحث الدلالي ثنائي اللغة
- **License/source:** Apache-2.0, Hugging Face Hub
- **الاستخدام:** بلا ضبط — يُستخدم كما هو
- **Index:** FAISS `IndexFlatIP`، 24 حالة، `ntotal == 24` مُثبت
- **Commit SHA:** `3c22f9d`

## Data and preprocessing

- **Dataset:** `bayan_day3_cases.csv` (24 حالة) · `bayan_day3_queries.jsonl` (18 استعلامًا)
- **Preprocessing profile:** `search` v`1.0.0` — **متماثل على الجانبين**
- ⚠️ الضرب الداخلي يساوي cosine **فقط** إذا كان الجانبان مطبَّعين إلى طول 1. تطبيع جانب واحد ينتج ترتيبًا يبدو معقولًا لكنه لم يعد يعني cosine — عطل لا يُكتشف بالنظر. الدفتر يفحص المعيار على الجانبين بـ assert.

## Evaluation

| metric / slice | n | result | uncertainty | evidence |
|---|---:|---:|---|---|
| recall@3 إجمالي `[MEASURED_SMOKE]` | 6 | 1.0 | — | `notebooks/06_semantic_search.ipynb` |
| mrr@3 إجمالي `[MEASURED_SMOKE]` | 6 | 0.6667 | — | نفسه |
| mrr@3 · `language=ar` | 3 | **0.5** | SMALL_SLICE | `reports/retrieval_metrics.json` |
| mrr@3 · `language=en` | 3 | 0.833 | SMALL_SLICE | نفسه |
| mrr@3 · `cross_lingual` | 2 | **0.5** | SMALL_SLICE | نفسه |
| mrr@3 · `monolingual` | 4 | 0.75 | SMALL_SLICE | نفسه |
| دقة اللا-إجابة على validation | 10 | 1.0 عند العتبة 0.4592 | — | نفسه |
| دقة اللا-إجابة على test بالعتبة المجمّدة | 8 | 1.0 | — | نفسه |

**العتبة `FROZEN_THRESHOLD = 0.4592`** ضُبطت على validation **فقط** ثم جُمّدت وطُبّقت دون تغيير على test. ضبط العتبة على البيانات التي تُقاس عليها ينتج رقمًا بلا معنى.

**recall@3 = 1.0 مع mrr@3 = 0.6667** يعني أن الحالة الصحيحة حاضرة دائمًا ضمن الثلاثة الأولى لكنها ليست دائمًا في المركز الأول. recall يسأل «هل وجدناها»، وMRR يسأل «في أي مرتبة». الفجوة كلفة حقيقية في تجربة المستخدم يخفيها تقرير يذكر recall وحده.

## Behavioural checks

| capability | pass rate | known failure |
|---|---:|---|
| تطبيع L2 على الجانبين | 100% | لا شيء |
| تطابق الفهرس مع الـ manifest | 100% | لا شيء |
| العتبة لم ترَ بيانات الاختبار | 100% | لا شيء |

## Limitations and risks

1. **6 استعلامات قابلة للإجابة** في الاختبار؛ كل الشرائح موسومة `SMALL_SLICE`.
2. **الترتيب العربي أضعف من الإنجليزي بالثلث**، والاستعلام عبر اللغات يطابق الأضعف.
3. **العتبة مضبوطة على 10 استعلامات** — تعميمها غير مُختبر.

## Reproduction

`notebooks/06_semantic_search.ipynb` · commit `3c22f9d` · قارني مع `DAY3_NOTEBOOK6_CORE=PASS` و `reports/search_manifest.json`

---

# E) Cross-encoder re-ranker — مرفوض بالقياس

## Model details

- **Name/version:** `cross-encoder/mmarco-mMiniLMv2-L12-H384-v1`
- **الحالة:** **`REJECT_NO_MEASURED_LIFT`** — لا يُخدَم
- **Commit SHA:** `3c22f9d`

## Evaluation

| metric | result | evidence |
|---|---|---|
| mrr@3 قبل إعادة الترتيب `[MEASURED_SMOKE]` | 0.6667 | `reports/retrieval_metrics.json` |
| mrr@3 بعد إعادة الترتيب `[MEASURED_SMOKE]` | لا تحسّن مقاس | نفسه |
| زمن الإحماء | مستبعد | نفسه |
| القرار | `REJECT_NO_MEASURED_LIFT` | نفسه |

**سبب الرفض:** لم ينتج تحسّنًا مقاسًا في `mrr@3` على هذه البيانات. مكوّن يُضاف لأنه «يُفترض أن يحسّن» بلا دليل يشتري زمنًا ومصدر عطل مقابل لا شيء. قاعدة الدورة صريحة: امتداد يعمل بلا baseline أو بلا قياس لا يمنح تميّزًا.

**شرط إعادة الفتح:** تحسّن مقاس في `mrr@3` على البيانات المجمّدة يتجاوز كلفة p95 المضافة.

## Limitations

6 استعلامات فقط · التوقيت على CPU يعتمد على البيئة · `MEASURED_SMOKE`.

## Reproduction

`notebooks/06_semantic_search.ipynb`، قسم إعادة الترتيب · commit `3c22f9d`

---

# ملاحظة عامة على كل المصنوعات

الحدود الرسمية — macro-F1 ≥ +8 نقاط فوق خط الأساس · entity-level F1 ≥ 0.80 · Recall@10 ≥ 0.80 · MRR@10 ≥ 0.70 · 17/20 لا-إجابة · p99 ≤ 40 ms عند 16 concurrent — **تُقاس على حزمة البيانات المجمّدة وبيئة القياس التي تعلنها المدربة والأكاديمية.** لا شيء في هذه البطاقة يُقدَّم مقابلها.
