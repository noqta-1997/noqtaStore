# جرد قاعدة بيانات Noqta Store — 00: الجرد الأولي

> **الغرض:** لقطة وصفية لقاعدة بيانات Supabase الخاصة بالمشروع كما هي فعلياً في لحظة الالتقاط: المخططات، الجداول، عدد الأعمدة والصفوف، المجموعات المنطقية، والمفاتيح الأجنبية. هذا الملف **جرد فقط**: لا يحتوي تحليل أمان أو أداء ولا توصيات؛ تلك موضوع الملفات التالية في `docs/db-audit/`.
>
> **تاريخ الالتقاط:** 2026-09-16 15:42:28 UTC (16/09/2026, 18:42:28 بتوقيت بغداد)  
> **المشروع:** Supabase `aws-0-eu-central-1.pooler.supabase.com` — قاعدة `postgres`، الدور `postgres`، عبر مجمّع الجلسات (منفذ 5432، أي `DIRECT_URL` في `.env.local`)  
> **الخادم:** PostgreSQL 17.6 on x86_64-pc-linux-gnu  
> **حجم القاعدة الكلي:** 13 MB  
> **حالة المستودع وقت الالتقاط:** الالتزام `53dd191` (في الشجرة 4 ملف غير ملتزم).  
> **مولَّد بـ** `npm run db:inventory` (`scripts/db-audit-inventory.ts`) — أعد تشغيله لتحديث هذا الملف.

## كيف تقرأ هذا الملف

- الأسماء بين علامات الاقتباس البرمجية هي أسماء فعلية في القاعدة (`schema.table`). أعمدة جداول `public` بصيغة camelCase لأن Prisma أنشأها هكذا.
- **رموز المجموعات** (مثل `CATALOG` و`AUTH_CORE`) هي الأسماء النهائية المعتمدة؛ استعملها كما هي في الطلبات القادمة. القائمة الكاملة في القسم 4.
- «الصفوف» = `count(*)` الفعلي وقت الالتقاط. «التقدير» = `n_live_tup` من إحصاءات PostgreSQL، أُدرج للمقارنة فقط (قد يتأخر عن الواقع).
- «الحجم» = `pg_total_relation_size` (البيانات + الفهارس + TOAST).
- عدد الأعمدة يُحسب من `pg_attribute` (بدون الأعمدة المحذوفة ولا أعمدة النظام).
- المصدر الوحيد لكل رقم هنا هو كتالوج PostgreSQL (`pg_catalog`) نفسه، لا `schema.prisma`. الفرق بينهما مذكور صراحةً في القسم 6.

## 1. الملخص

| البند | العدد |
|---|---:|
| مخططات (schemas) غير نظامية | 9 (منها 3 فارغة) |
| جداول | 62 |
| views | 3 |
| جداول التطبيق (`public`) | 23 (منها 22 جدول بيانات + `_prisma_migrations`) |
| جداول منصّة Supabase (`auth` + `storage` + `realtime` + `vault`) | 39 |
| مفاتيح أجنبية | 57 (`public` 28، `auth` 24، `storage` 5) |
| أنواع معدودة (enums) | 21 (`public` 9) |
| إضافات (extensions) | 5 |
| إجمالي الصفوف في كل الجداول | 786 |
| إجمالي صفوف جداول التطبيق (`public` بدون سجل الترحيل) | 152 |

**حقائق تستحق الانتباه قبل أي شيء آخر** (تفصيلها في القسم 6):

1. الربط بين `public.customers` و`auth.users` منطقي فقط (`customers.userId` نص يحمل `auth.users.id`) بلا مفتاح أجنبي.

## 2. المخططات (Schemas)

| المخطط | المالك | جداول | views | ما هو |
|---|---|---:|---:|---|
| `auth` | `supabase_admin` | 27 | 0 | Supabase Auth (GoTrue): المستخدمون، الجلسات، الهويات، MFA، OAuth، SSO |
| `extensions` | `postgres` | 0 | 2 | موطن الإضافات؛ لا جداول، فقط views الإحصاء `pg_stat_statements` |
| `graphql` | `supabase_admin` | 0 | 0 | داخلي لـ pg_graphql — فارغ |
| `graphql_public` | `supabase_admin` | 0 | 0 | واجهة pg_graphql العامة — فارغ |
| `pgbouncer` | `pgbouncer` | 0 | 0 | داخلي لمجمّع الاتصالات — فارغ |
| `public` | `pg_database_owner` | 23 | 0 | **مخطط التطبيق** — كل ما تديره Prisma (`prisma/schema.prisma`) |
| `realtime` | `supabase_admin` | 3 | 0 | Supabase Realtime: قناة الرسائل والاشتراكات |
| `storage` | `supabase_admin` | 8 | 0 | Supabase Storage: الحاويات (buckets) والملفات |
| `vault` | `supabase_admin` | 1 | 1 | Supabase Vault: الأسرار المشفّرة |

المخططات النظامية (`pg_catalog`، `information_schema`، `pg_toast`) مستثناة من كل ما يلي.

## 3. الجداول حسب المخطط

### 3.1 `public` — جداول التطبيق (23)

كلها من إنشاء Prisma Migrate. المفاتيح الأساسية نصّية (`cuid`) إلا ما ذُكر في الملحق ب. تعريف الأعمدة الكامل في الملحق أ.

| # | الجدول | المجموعة | أعمدة | صفوف | تقدير | الحجم | ملاحظة |
|--:|---|---|--:|--:|--:|--:|---|
| 1 | `_prisma_migrations` | `MIGRATIONS` | 8 | 14 | 14 | 32 kB | سجل ترحيلات Prisma |
| 2 | `addresses` | `CUSTOMERS` | 11 | 1 | 1 | 48 kB |  |
| 3 | `authors` | `CATALOG` | 8 | 26 | 26 | 112 kB |  |
| 4 | `books` | `CATALOG` | 19 | 25 | 25 | 184 kB |  |
| 5 | `cart_items` | `CART_WISHLIST` | 4 | 0 | 0 | 32 kB |  |
| 6 | `categories` | `CATALOG` | 9 | 30 | 30 | 120 kB |  |
| 7 | `contact_messages` | `MARKETING` | 7 | 0 | 0 | 64 kB |  |
| 8 | `coupons` | `MARKETING` | 10 | 2 | 2 | 48 kB |  |
| 9 | `customers` | `CUSTOMERS` | 13 | 2 | 2 | 96 kB |  |
| 10 | `handout_cart_items` | `CART_WISHLIST` | 4 | 0 | 0 | 32 kB |  |
| 11 | `handout_categories` | `CATALOG` | 9 | 24 | 24 | 80 kB |  |
| 12 | `handout_order_items` | `ORDERS` | 5 | 0 | 0 | 64 kB |  |
| 13 | `handout_reviews` | `REVIEWS` | 9 | 0 | 0 | 64 kB |  |
| 14 | `handout_wishlist_items` | `CART_WISHLIST` | 3 | 0 | 1 | 32 kB |  |
| 15 | `handouts` | `CATALOG` | 19 | 3 | 3 | 112 kB |  |
| 16 | `newsletter_subscribers` | `MARKETING` | 3 | 0 | 0 | 32 kB |  |
| 17 | `order_events` | `ORDERS` | 4 | 3 | 3 | 144 kB |  |
| 18 | `order_items` | `ORDERS` | 5 | 5 | 5 | 136 kB |  |
| 19 | `orders` | `ORDERS` | 18 | 1 | 1 | 112 kB |  |
| 20 | `publishers` | `CATALOG` | 6 | 19 | 19 | 96 kB |  |
| 21 | `reviews` | `REVIEWS` | 9 | 0 | 0 | 72 kB |  |
| 22 | `store_settings` | `SETTINGS` | 3 | 11 | 11 | 64 kB |  |
| 23 | `wishlist_items` | `CART_WISHLIST` | 3 | 0 | 0 | 32 kB |  |

### 3.2 `auth` — Supabase Auth (27)

جداول GoTrue القياسية؛ يديرها Supabase ولا يلمسها التطبيق مباشرة (يقرأها عبر `@supabase/ssr`). المستخدمون الحاليون: 2، هوياتهم: `google` (2) (`auth.identities`).

| # | الجدول | المجموعة | أعمدة | صفوف | تقدير | الحجم | ملاحظة |
|--:|---|---|--:|--:|--:|--:|---|
| 1 | `audit_log_entries` | `AUTH_CORE` | 5 | 0 | 0 | 24 kB |  |
| 2 | `custom_oauth_providers` | `AUTH_OAUTH` | 25 | 0 | 0 | 56 kB |  |
| 3 | `flow_state` | `AUTH_CORE` | 17 | 6 | 6 | 112 kB |  |
| 4 | `identities` | `AUTH_CORE` | 9 | 2 | 2 | 80 kB |  |
| 5 | `instances` | `AUTH_CORE` | 5 | 0 | 0 | 16 kB |  |
| 6 | `mfa_amr_claims` | `AUTH_CORE` | 5 | 121 | 121 | 88 kB |  |
| 7 | `mfa_challenges` | `AUTH_MFA` | 7 | 0 | 0 | 24 kB |  |
| 8 | `mfa_factors` | `AUTH_MFA` | 13 | 0 | 0 | 56 kB |  |
| 9 | `mfa_recovery_code_sets` | `AUTH_MFA` | 7 | 0 | 0 | 24 kB |  |
| 10 | `mfa_recovery_codes` | `AUTH_MFA` | 5 | 0 | 0 | 24 kB |  |
| 11 | `oauth_authorizations` | `AUTH_OAUTH` | 17 | 0 | 0 | 40 kB |  |
| 12 | `oauth_client_states` | `AUTH_OAUTH` | 4 | 0 | 0 | 24 kB |  |
| 13 | `oauth_clients` | `AUTH_OAUTH` | 13 | 0 | 0 | 24 kB |  |
| 14 | `oauth_consents` | `AUTH_OAUTH` | 6 | 0 | 0 | 48 kB |  |
| 15 | `one_time_tokens` | `AUTH_CORE` | 8 | 0 | 0 | 128 kB |  |
| 16 | `refresh_tokens` | `AUTH_CORE` | 9 | 134 | 134 | 168 kB |  |
| 17 | `saml_providers` | `AUTH_SSO` | 9 | 0 | 0 | 32 kB |  |
| 18 | `saml_relay_states` | `AUTH_SSO` | 8 | 0 | 0 | 40 kB |  |
| 19 | `schema_migrations` | `MIGRATIONS` | 1 | 82 | 82 | 24 kB |  |
| 20 | `scim_tokens` | `AUTH_SSO` | 8 | 0 | 0 | 48 kB |  |
| 21 | `scim_users` | `AUTH_SSO` | 10 | 0 | 0 | 88 kB |  |
| 22 | `sessions` | `AUTH_CORE` | 15 | 121 | 121 | 128 kB |  |
| 23 | `sso_domains` | `AUTH_SSO` | 5 | 0 | 0 | 32 kB |  |
| 24 | `sso_providers` | `AUTH_SSO` | 5 | 0 | 0 | 32 kB |  |
| 25 | `users` | `AUTH_CORE` | 35 | 2 | 2 | 256 kB |  |
| 26 | `webauthn_challenges` | `AUTH_MFA` | 6 | 0 | 0 | 32 kB |  |
| 27 | `webauthn_credentials` | `AUTH_MFA` | 14 | 0 | 0 | 32 kB |  |

### 3.3 `storage` — Supabase Storage (8)

الحاويات الفعلية: `Books Covers` (عامة، النوع `STANDARD`، أُنشئت 2026-09-14، 1 ملف). أغلفة الكتب يرفعها `src/lib/cover-storage.ts` بمفتاح service-role.

| # | الجدول | المجموعة | أعمدة | صفوف | تقدير | الحجم | ملاحظة |
|--:|---|---|--:|--:|--:|--:|---|
| 1 | `buckets` | `STORAGE` | 12 | 1 | 1 | 48 kB |  |
| 2 | `buckets_analytics` | `STORAGE` | 7 | 0 | 0 | 24 kB |  |
| 3 | `buckets_vectors` | `STORAGE` | 4 | 0 | 0 | 16 kB |  |
| 4 | `migrations` | `MIGRATIONS` | 4 | 68 | 68 | 40 kB |  |
| 5 | `objects` | `STORAGE` | 15 | 1 | 1 | 144 kB |  |
| 6 | `s3_multipart_uploads` | `STORAGE` | 10 | 0 | 0 | 24 kB |  |
| 7 | `s3_multipart_uploads_parts` | `STORAGE` | 10 | 0 | 0 | 16 kB |  |
| 8 | `vector_indexes` | `STORAGE` | 9 | 0 | 0 | 24 kB |  |

### 3.4 `realtime` — Supabase Realtime (3)

لا يستخدمه التطبيق؛ الجداول فارغة. `messages` جدول مقسَّم (Supabase ينشئ أقسامه اليومية عند الحاجة).

| # | الجدول | المجموعة | أعمدة | صفوف | تقدير | الحجم | ملاحظة |
|--:|---|---|--:|--:|--:|--:|---|
| 1 | `messages` | `REALTIME` | 10 | 0 | 0 | 0 bytes | مقسَّم (partitioned) |
| 2 | `schema_migrations` | `MIGRATIONS` | 2 | 82 | 82 | 24 kB |  |
| 3 | `subscription` | `REALTIME` | 9 | 0 | 0 | 32 kB |  |

### 3.5 `vault` — Supabase Vault (2)

لا أسرار مخزّنة. `decrypted_secrets` view يفكّ تشفير `secrets` عند القراءة.

| # | الجدول | المجموعة | أعمدة | صفوف | تقدير | الحجم | ملاحظة |
|--:|---|---|--:|--:|--:|--:|---|
| 1 | `decrypted_secrets` | `VAULT` | 9 | — | — | 0 bytes | view |
| 2 | `secrets` | `VAULT` | 8 | 0 | 0 | 24 kB |  |

### 3.6 `extensions` — views الإحصاء (2)

ليست جداول؛ واجهتا الإضافة `pg_stat_statements` التي يفعّلها Supabase افتراضياً.

| # | الجدول | المجموعة | أعمدة | صفوف | تقدير | الحجم | ملاحظة |
|--:|---|---|--:|--:|--:|--:|---|
| 1 | `pg_stat_statements` | `STATS_VIEWS` | 49 | — | — | 0 bytes | view |
| 2 | `pg_stat_statements_info` | `STATS_VIEWS` | 2 | — | — | 0 bytes | view |

### 3.7 مخططات أخرى

`graphql`، `graphql_public`، `pgbouncer` — موجودة بلا أي جدول أو view.

## 4. المجموعات المنطقية — الأسماء النهائية

التصنيف حسب **الغرض** لا حسب المخطط، لذا مجموعة واحدة (`MIGRATIONS`) تعبر أربعة مخططات. كل جدول ينتمي إلى مجموعة واحدة بالضبط. الرموز الإنكليزية هي المرجع؛ العربية للقراءة.

### 4.1 القائمة

| الرمز | الاسم | المخطط | الجداول | العدد | الصفوف |
|---|---|---|---|--:|--:|
| `CATALOG` | الكتالوج | `public` | `categories`، `handout_categories`، `publishers`، `authors`، `books`، `handouts` | 6 | 127 |
| `CUSTOMERS` | العملاء والعناوين | `public` | `customers`، `addresses` | 2 | 3 |
| `ORDERS` | الطلبات | `public` | `orders`، `order_items`، `handout_order_items`، `order_events` | 4 | 9 |
| `REVIEWS` | المراجعات | `public` | `reviews`، `handout_reviews` | 2 | 0 |
| `CART_WISHLIST` | السلة والمفضلة | `public` | `cart_items`، `handout_cart_items`، `wishlist_items`، `handout_wishlist_items` | 4 | 0 |
| `MARKETING` | التسويق والتواصل | `public` | `coupons`، `newsletter_subscribers`، `contact_messages` | 3 | 2 |
| `SETTINGS` | الإعدادات | `public` | `store_settings` | 1 | 11 |
| `AUTH_CORE` | الهوية والجلسات | `auth` | `users`، `identities`، `sessions`، `refresh_tokens`، `mfa_amr_claims`، `one_time_tokens`، `flow_state`، `audit_log_entries`، `instances` | 9 | 386 |
| `AUTH_MFA` | التحقق متعدد العوامل | `auth` | `mfa_factors`، `mfa_challenges`، `mfa_recovery_code_sets`، `mfa_recovery_codes`، `webauthn_challenges`، `webauthn_credentials` | 6 | 0 |
| `AUTH_OAUTH` | خادم OAuth ومزوّدوه | `auth` | `oauth_clients`، `oauth_authorizations`، `oauth_consents`، `oauth_client_states`، `custom_oauth_providers` | 5 | 0 |
| `AUTH_SSO` | SSO / SAML / SCIM | `auth` | `sso_providers`، `sso_domains`، `saml_providers`، `saml_relay_states`، `scim_tokens`، `scim_users` | 6 | 0 |
| `STORAGE` | تخزين الملفات | `storage` | `buckets`، `buckets_analytics`، `buckets_vectors`، `objects`، `s3_multipart_uploads`، `s3_multipart_uploads_parts`، `vector_indexes` | 7 | 2 |
| `REALTIME` | البث اللحظي | `realtime` | `messages`، `subscription` | 2 | 0 |
| `VAULT` | الأسرار | `vault` | `secrets` | 1 | 0 |
| `MIGRATIONS` | سجلات الترحيل | متعدد | `auth.schema_migrations`، `public._prisma_migrations`، `realtime.schema_migrations`، `storage.migrations` | 4 | 246 |
| `STATS_VIEWS` | views الإحصاء | `extensions` | `pg_stat_statements`، `pg_stat_statements_info` | 2 views | — |

المجموع: 62 جدولاً = كل جداول القاعدة (62). `AUTH` وحدها اسم جامع للمجموعات الأربع `AUTH_*` (26 جدولاً)؛ و`APP` اسم جامع لمجموعات `public` السبع (22 جدولاً بدون سجل الترحيل).

### 4.2 وصف كل مجموعة

#### `CATALOG` — الكتالوج
كتالوجان متوازيان بشجرتي تصنيف مستقلتين: **الكتب المدرسية** (`categories` ← `books`) و**الملازم** (`handout_categories` ← `handouts`)، يتشاركان جدولي البحث `authors` و`publishers`. الشجرتان ذاتيتا الإحالة (`parentId` → نفس الجدول). `authors.subjectId` يشير إلى `categories` (مادة المدرّس). `books` و`handouts` نسختان متطابقتان بنية.

#### `CUSTOMERS` — العملاء والعناوين
`customers` هو الملف الشخصي داخل التطبيق (اسم، بريد، هاتف، دور `customer|admin`، حالة `active|blocked`، تفضيلات النشرة)؛ `customers.userId` يحمل معرّف `auth.users` كنص — الربط الوحيد بين التطبيق و`AUTH_CORE`، وهو بلا FK. حالياً 2 عميل، منهم 2 مربوط بحساب `auth.users` (`userId` غير فارغ). `addresses` دفتر عناوين متعدد لكل عميل، يُحذف معه (`CASCADE`).

#### `ORDERS` — الطلبات
`orders` رأس الطلب مع لقطة عنوان الشحن ومبالغ بالدينار الصحيح (`subtotal/shippingCost/discount/total`) وطريقة الدفع (`cod|card|wallet`) كعمود، **لا جدول مدفوعات مستقل**. سطور الطلب في جدولين حسب نوع المنتج: `order_items` (كتب) و`handout_order_items` (ملازم)، وكلاهما يخزّن `unitPrice` وقت الطلب. `order_events` الخط الزمني لحالة الطلب. حذف الطلب يحذف سطوره وأحداثه؛ حذف العميل ممنوع ما دام له طلب (`RESTRICT`).

#### `REVIEWS` — المراجعات
`reviews` للكتب و`handout_reviews` للملازم، بنية واحدة: تقييم + عنوان + نص + حالة اعتدال (`pending|published|rejected`)، وقيد فريد (منتج، عميل). `rating` و`reviewsCount` على المنتج قيمتان مشتقّتان (denormalised) يعيد التطبيق حسابهما.

#### `CART_WISHLIST` — السلة والمفضلة
أربعة جداول ربط بمفتاح مركّب (عميل، منتج): `cart_items`/`wishlist_items` للكتب و`handout_cart_items`/`handout_wishlist_items` للملازم. تُحذف مع العميل أو المنتج (`CASCADE` من الجهتين). كلها فارغة حالياً.

#### `MARKETING` — التسويق والتواصل
`coupons` (رمز، نوع `percentage|fixed`، قيمة، حد أدنى، حد استخدام)، `newsletter_subscribers` (البريد هو المفتاح الأساسي)، و`contact_messages` (صندوق وارد نموذج «اتصل بنا» بحالة `new|read`). لا مفاتيح أجنبية داخل هذه المجموعة ولا منها.

#### `SETTINGS` — الإعدادات
`store_settings` مخزن مفتاح/قيمة نصّي. المفاتيح الحالية (11): `home.authors`، `home.bestsellers`، `home.categories`، `home.features`، `home.hero`، `home.newArrivals`، `home.newsletter`، `home.promo`، `notifyOrders`، `notifyReviews`، `notifyStock` — 8 منها محتوى أقسام الصفحة الرئيسية (`home.*`، JSON مسلسل) و3 تفضيلات إشعارات الإدارة (`notify*`).

#### `AUTH_CORE` — الهوية والجلسات (Supabase)
`users` الحساب نفسه (35 عموداً، بينها البريد والهاتف وبياناتهما الوصفية)، `identities` ربط الحساب بمزوّد (الحالي: `google`)، `sessions` + `refresh_tokens` + `mfa_amr_claims` ثلاثية الجلسة، `one_time_tokens` رموز التأكيد/الاستعادة، `flow_state` حالة تدفّق PKCE، `audit_log_entries` سجل تدقيق Auth (فارغ)، `instances` بقايا تعدد المستأجرين. لا يوجد جدول سجلّات (logs) خاص بالتطبيق؛ الأقرب إلى ذلك `audit_log_entries` هنا و`order_events` في `ORDERS`.

#### `AUTH_MFA` — التحقق متعدد العوامل (Supabase)
عوامل TOTP/هاتف/WebAuthn وتحدياتها ورموز الاستعادة. كلها فارغة: لم يفعَّل MFA.

#### `AUTH_OAUTH` — خادم OAuth ومزوّدوه (Supabase)
جداول Supabase Auth كـ**خادم** OAuth (عملاء، تفويضات، موافقات) و`custom_oauth_providers` لمزوّدين مخصّصين. كلها فارغة؛ تسجيل الدخول بمزوّد خارجي (Google) لا يمرّ من هنا بل من `identities`.

#### `AUTH_SSO` — SSO / SAML / SCIM (Supabase)
تسجيل الدخول المؤسسي. كلها فارغة.

#### `STORAGE` — تخزين الملفات (Supabase)
`buckets` + `objects` هما المستخدمان (حاوية `Books Covers`: 1 ملف). `buckets_analytics`/`buckets_vectors`/`vector_indexes` أنواع حاويات أحدث، و`s3_multipart_uploads(_parts)` لرفع S3 المجزّأ — كلها فارغة. FKs المخطط داخلية فقط؛ `objects.owner` لا يشير بـFK إلى `auth.users`.

#### `REALTIME` / `VAULT` / `STATS_VIEWS`
بنية Supabase الافتراضية، غير مستخدمة من التطبيق، وفارغة.

#### `MIGRATIONS` — سجلات الترحيل
أربعة دفاتر مستقلة: `public._prisma_migrations` (14 صفاً — يخصّ التطبيق، الملحق هـ)، و`auth.schema_migrations` (82)، `realtime.schema_migrations` (82)، `storage.migrations` (68) تخصّ خدمات Supabase.

## 5. المفاتيح الأجنبية (كما هي في القاعدة الآن)

57 قيداً من `pg_constraint` (`contype = 'f'`)، كلها **مُتحقَّق منها** (`validated`) وغير مؤجَّلة. لا يوجد أي FK يعبر بين مخططين.

### 5.1 `public` (28)

| # | من | إلى | عند الحذف | عند التحديث | اسم القيد |
|--:|---|---|---|---|---|
| 1 | `addresses(customerId)` | `customers(id)` | CASCADE | CASCADE | `addresses_customerId_fkey` |
| 2 | `authors(subjectId)` | `categories(id)` | SET NULL | CASCADE | `authors_subjectId_fkey` |
| 3 | `books(authorId)` | `authors(id)` | RESTRICT | CASCADE | `books_authorId_fkey` |
| 4 | `books(categoryId)` | `categories(id)` | RESTRICT | CASCADE | `books_categoryId_fkey` |
| 5 | `books(publisherId)` | `publishers(id)` | RESTRICT | CASCADE | `books_publisherId_fkey` |
| 6 | `cart_items(bookId)` | `books(id)` | CASCADE | CASCADE | `cart_items_bookId_fkey` |
| 7 | `cart_items(customerId)` | `customers(id)` | CASCADE | CASCADE | `cart_items_customerId_fkey` |
| 8 | `categories(parentId)` | `categories(id)` | NO ACTION | CASCADE | `categories_parentId_fkey` |
| 9 | `handout_cart_items(customerId)` | `customers(id)` | CASCADE | CASCADE | `handout_cart_items_customerId_fkey` |
| 10 | `handout_cart_items(handoutId)` | `handouts(id)` | CASCADE | CASCADE | `handout_cart_items_handoutId_fkey` |
| 11 | `handout_categories(parentId)` | `handout_categories(id)` | NO ACTION | CASCADE | `handout_categories_parentId_fkey` |
| 12 | `handout_order_items(handoutId)` | `handouts(id)` | RESTRICT | CASCADE | `handout_order_items_handoutId_fkey` |
| 13 | `handout_order_items(orderId)` | `orders(id)` | CASCADE | CASCADE | `handout_order_items_orderId_fkey` |
| 14 | `handout_reviews(customerId)` | `customers(id)` | CASCADE | CASCADE | `handout_reviews_customerId_fkey` |
| 15 | `handout_reviews(handoutId)` | `handouts(id)` | CASCADE | CASCADE | `handout_reviews_handoutId_fkey` |
| 16 | `handout_wishlist_items(customerId)` | `customers(id)` | CASCADE | CASCADE | `handout_wishlist_items_customerId_fkey` |
| 17 | `handout_wishlist_items(handoutId)` | `handouts(id)` | CASCADE | CASCADE | `handout_wishlist_items_handoutId_fkey` |
| 18 | `handouts(authorId)` | `authors(id)` | RESTRICT | CASCADE | `handouts_authorId_fkey` |
| 19 | `handouts(categoryId)` | `handout_categories(id)` | RESTRICT | CASCADE | `handouts_categoryId_fkey` |
| 20 | `handouts(publisherId)` | `publishers(id)` | RESTRICT | CASCADE | `handouts_publisherId_fkey` |
| 21 | `order_events(orderId)` | `orders(id)` | CASCADE | CASCADE | `order_events_orderId_fkey` |
| 22 | `order_items(bookId)` | `books(id)` | RESTRICT | CASCADE | `order_items_bookId_fkey` |
| 23 | `order_items(orderId)` | `orders(id)` | CASCADE | CASCADE | `order_items_orderId_fkey` |
| 24 | `orders(customerId)` | `customers(id)` | RESTRICT | CASCADE | `orders_customerId_fkey` |
| 25 | `reviews(bookId)` | `books(id)` | CASCADE | CASCADE | `reviews_bookId_fkey` |
| 26 | `reviews(customerId)` | `customers(id)` | CASCADE | CASCADE | `reviews_customerId_fkey` |
| 27 | `wishlist_items(bookId)` | `books(id)` | CASCADE | CASCADE | `wishlist_items_bookId_fkey` |
| 28 | `wishlist_items(customerId)` | `customers(id)` | CASCADE | CASCADE | `wishlist_items_customerId_fkey` |

ملخّص سلوك الحذف في `public`: `CASCADE` 16، `RESTRICT` 9، `SET NULL` 1، `NO ACTION` 2. كل FKs `public` تحدّث بـ`CASCADE` — هذا افتراض Prisma.

### 5.2 `auth` (24)

| # | من | إلى | عند الحذف | عند التحديث | اسم القيد |
|--:|---|---|---|---|---|
| 1 | `identities(user_id)` | `users(id)` | CASCADE | NO ACTION | `identities_user_id_fkey` |
| 2 | `mfa_amr_claims(session_id)` | `sessions(id)` | CASCADE | NO ACTION | `mfa_amr_claims_session_id_fkey` |
| 3 | `mfa_challenges(factor_id)` | `mfa_factors(id)` | CASCADE | NO ACTION | `mfa_challenges_auth_factor_id_fkey` |
| 4 | `mfa_factors(user_id)` | `users(id)` | CASCADE | NO ACTION | `mfa_factors_user_id_fkey` |
| 5 | `mfa_recovery_code_sets(mfa_factor_id)` | `mfa_factors(id)` | CASCADE | NO ACTION | `mfa_recovery_code_sets_mfa_factor_id_fkey` |
| 6 | `mfa_recovery_code_sets(user_id)` | `users(id)` | CASCADE | NO ACTION | `mfa_recovery_code_sets_user_id_fkey` |
| 7 | `mfa_recovery_codes(mfa_recovery_code_set_id)` | `mfa_recovery_code_sets(id)` | CASCADE | NO ACTION | `mfa_recovery_codes_mfa_recovery_code_set_id_fkey` |
| 8 | `oauth_authorizations(client_id)` | `oauth_clients(id)` | CASCADE | NO ACTION | `oauth_authorizations_client_id_fkey` |
| 9 | `oauth_authorizations(user_id)` | `users(id)` | CASCADE | NO ACTION | `oauth_authorizations_user_id_fkey` |
| 10 | `oauth_consents(client_id)` | `oauth_clients(id)` | CASCADE | NO ACTION | `oauth_consents_client_id_fkey` |
| 11 | `oauth_consents(user_id)` | `users(id)` | CASCADE | NO ACTION | `oauth_consents_user_id_fkey` |
| 12 | `one_time_tokens(user_id)` | `users(id)` | CASCADE | NO ACTION | `one_time_tokens_user_id_fkey` |
| 13 | `refresh_tokens(session_id)` | `sessions(id)` | CASCADE | NO ACTION | `refresh_tokens_session_id_fkey` |
| 14 | `saml_providers(sso_provider_id)` | `sso_providers(id)` | CASCADE | NO ACTION | `saml_providers_sso_provider_id_fkey` |
| 15 | `saml_relay_states(flow_state_id)` | `flow_state(id)` | CASCADE | NO ACTION | `saml_relay_states_flow_state_id_fkey` |
| 16 | `saml_relay_states(sso_provider_id)` | `sso_providers(id)` | CASCADE | NO ACTION | `saml_relay_states_sso_provider_id_fkey` |
| 17 | `scim_tokens(sso_provider_id)` | `sso_providers(id)` | CASCADE | NO ACTION | `scim_tokens_sso_provider_id_fkey` |
| 18 | `scim_users(sso_provider_id)` | `sso_providers(id)` | CASCADE | NO ACTION | `scim_users_sso_provider_id_fkey` |
| 19 | `scim_users(user_id)` | `users(id)` | SET NULL | NO ACTION | `scim_users_user_id_fkey` |
| 20 | `sessions(oauth_client_id)` | `oauth_clients(id)` | CASCADE | NO ACTION | `sessions_oauth_client_id_fkey` |
| 21 | `sessions(user_id)` | `users(id)` | CASCADE | NO ACTION | `sessions_user_id_fkey` |
| 22 | `sso_domains(sso_provider_id)` | `sso_providers(id)` | CASCADE | NO ACTION | `sso_domains_sso_provider_id_fkey` |
| 23 | `webauthn_challenges(user_id)` | `users(id)` | CASCADE | NO ACTION | `webauthn_challenges_user_id_fkey` |
| 24 | `webauthn_credentials(user_id)` | `users(id)` | CASCADE | NO ACTION | `webauthn_credentials_user_id_fkey` |

### 5.3 `storage` (5)

| # | من | إلى | عند الحذف | عند التحديث | اسم القيد |
|--:|---|---|---|---|---|
| 1 | `objects(bucket_id)` | `buckets(id)` | NO ACTION | NO ACTION | `objects_bucketId_fkey` |
| 2 | `s3_multipart_uploads(bucket_id)` | `buckets(id)` | NO ACTION | NO ACTION | `s3_multipart_uploads_bucket_id_fkey` |
| 3 | `s3_multipart_uploads_parts(bucket_id)` | `buckets(id)` | NO ACTION | NO ACTION | `s3_multipart_uploads_parts_bucket_id_fkey` |
| 4 | `s3_multipart_uploads_parts(upload_id)` | `s3_multipart_uploads(id)` | CASCADE | NO ACTION | `s3_multipart_uploads_parts_upload_id_fkey` |
| 5 | `vector_indexes(bucket_id)` | `buckets_vectors(id)` | NO ACTION | NO ACTION | `vector_indexes_bucket_id_fkey` |

### 5.4 روابط منطقية بلا مفتاح أجنبي

مذكورة هنا لأنها ستُقرأ لاحقاً كعلاقات رغم غياب القيد:

| من | إلى | الحقيقة |
|---|---|---|
| `public.customers.userId` (text، nullable، unique) | `auth.users.id` (uuid) | الربط الوحيد بين التطبيق وAuth؛ نوعا العمودين مختلفان (نص مقابل uuid) |
| `public.books.coverUrl` / `public.handouts.coverUrl` | `storage.objects` | رابط URL عام نصّي، لا مرجع لصفّ الملف |
| `storage.objects.owner` / `owner_id` | `auth.users.id` | تصميم Supabase القياسي بلا FK |

## 6. الفرق بين القاعدة والمستودع (حقائق فقط)

### 6.1 الترحيلات

| | المستودع (`prisma/migrations/`) | القاعدة (`public._prisma_migrations`) |
|---|---|---|
| عدد الترحيلات | 14 | 14 |
| آخر ترحيل | `20260916160000_unique_catalogue_names` | `20260916160000_unique_catalogue_names` (اكتمل 2026-09-16 15:38:36 UTC) |

كل الترحيلات مطبَّقة والسجل يطابق المجلد.

### 6.2 الأعمدة والأنواع

أعمدة جداول `public` وأنواعها المعدودة تطابق `schema.prisma` تماماً.

### 6.3 ما لا يُعدّ فرقاً

- الأعمدة من نوع مصفوفة (`tags "BookTag"[]`) nullable في القاعدة رغم أنها `BookTag[] @default([])` في Prisma — سلوك Prisma المعتاد مع المصفوفات.
- ترتيب `attnum` في الملحق أ فيه فجوات — آثار أعمدة حُذفت في ترحيلات سابقة، طبيعي في PostgreSQL.

## الملحق أ — أعمدة جداول `public` (التعريف الحي)

مأخوذ من `pg_attribute` وقت الالتقاط. 🔑 = مفتاح أساسي. `timestamp(3)` = بلا منطقة زمنية.

### `_prisma_migrations` — 8 عموداً، 14 صف، مجموعة `MIGRATIONS`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `character varying(36)` | لا |  |
| 2 | `checksum` | `character varying(64)` | لا |  |
| 3 | `finished_at` | `timestamp with time zone` | نعم |  |
| 4 | `migration_name` | `character varying(255)` | لا |  |
| 5 | `logs` | `text` | نعم |  |
| 6 | `rolled_back_at` | `timestamp with time zone` | نعم |  |
| 7 | `started_at` | `timestamp with time zone` | لا | `now()` |
| 8 | `applied_steps_count` | `integer` | لا | `0` |

### `addresses` — 11 عموداً، 1 صف، مجموعة `CUSTOMERS`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `customerId` | `text` | لا |  |
| 3 | `label` | `text` | لا |  |
| 4 | `fullName` | `text` | لا |  |
| 5 | `phone` | `text` | لا |  |
| 6 | `governorate` | `text` | لا |  |
| 7 | `city` | `text` | لا |  |
| 8 | `line` | `text` | لا |  |
| 9 | `isDefault` | `boolean` | لا | `false` |
| 10 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 11 | `updatedAt` | `timestamp(3)` | لا |  |

### `authors` — 8 عموداً، 26 صف، مجموعة `CATALOG`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `slug` | `text` | لا |  |
| 3 | `nameAr` | `text` | لا |  |
| 7 | `bioAr` | `text` | لا |  |
| 9 | `avatarUrl` | `text` | نعم |  |
| 10 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 11 | `updatedAt` | `timestamp(3)` | لا |  |
| 13 | `subjectId` | `text` | نعم |  |

### `books` — 19 عموداً، 25 صف، مجموعة `CATALOG`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `slug` | `text` | لا |  |
| 3 | `titleAr` | `text` | لا |  |
| 5 | `descriptionAr` | `text` | لا |  |
| 7 | `price` | `integer` | لا |  |
| 8 | `compareAtPrice` | `integer` | نعم |  |
| 9 | `stock` | `integer` | لا | `0` |
| 10 | `pages` | `integer` | لا |  |
| 13 | `publishedYear` | `integer` | لا |  |
| 15 | `languageAr` | `text` | لا | `'العربية'` |
| 19 | `coverUrl` | `text` | نعم |  |
| 20 | `tags` | `"BookTag"[]` | نعم | `ARRAY[]` |
| 21 | `rating` | `double precision` | لا | `0` |
| 22 | `reviewsCount` | `integer` | لا | `0` |
| 23 | `authorId` | `text` | لا |  |
| 24 | `categoryId` | `text` | لا |  |
| 25 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 26 | `updatedAt` | `timestamp(3)` | لا |  |
| 27 | `publisherId` | `text` | لا |  |

### `cart_items` — 4 عموداً، 0 صف، مجموعة `CART_WISHLIST`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `customerId` 🔑 | `text` | لا |  |
| 2 | `bookId` 🔑 | `text` | لا |  |
| 3 | `quantity` | `integer` | لا | `1` |
| 4 | `updatedAt` | `timestamp(3)` | لا |  |

### `categories` — 9 عموداً، 30 صف، مجموعة `CATALOG`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `slug` | `text` | لا |  |
| 3 | `nameAr` | `text` | لا |  |
| 5 | `descriptionAr` | `text` | لا |  |
| 7 | `icon` | `text` | لا |  |
| 8 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 9 | `updatedAt` | `timestamp(3)` | لا |  |
| 12 | `parentId` | `text` | نعم |  |
| 13 | `sortOrder` | `integer` | لا | `0` |

### `contact_messages` — 7 عموداً، 0 صف، مجموعة `MARKETING`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `name` | `text` | لا |  |
| 3 | `email` | `text` | لا |  |
| 4 | `subject` | `text` | لا |  |
| 5 | `message` | `text` | لا |  |
| 6 | `status` | `"ContactStatus"` | لا | `'new'` |
| 7 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |

### `coupons` — 10 عموداً، 2 صف، مجموعة `MARKETING`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `code` | `text` | لا |  |
| 3 | `type` | `"CouponType"` | لا | `'percentage'` |
| 4 | `value` | `integer` | لا |  |
| 5 | `minSubtotal` | `integer` | لا | `0` |
| 6 | `active` | `boolean` | لا | `true` |
| 7 | `expiresAt` | `timestamp(3)` | نعم |  |
| 8 | `usageLimit` | `integer` | نعم |  |
| 9 | `usedCount` | `integer` | لا | `0` |
| 10 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |

### `customers` — 13 عموداً، 2 صف، مجموعة `CUSTOMERS`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `userId` | `text` | نعم |  |
| 3 | `name` | `text` | لا |  |
| 4 | `email` | `text` | لا |  |
| 5 | `phone` | `text` | لا |  |
| 6 | `birthDate` | `timestamp(3)` | نعم |  |
| 7 | `status` | `"CustomerStatus"` | لا | `'active'` |
| 8 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 9 | `updatedAt` | `timestamp(3)` | لا |  |
| 10 | `city` | `text` | نعم |  |
| 11 | `role` | `"CustomerRole"` | لا | `'customer'` |
| 12 | `newsletterOptIn` | `boolean` | لا | `true` |
| 13 | `offersOptIn` | `boolean` | لا | `false` |

### `handout_cart_items` — 4 عموداً، 0 صف، مجموعة `CART_WISHLIST`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `customerId` 🔑 | `text` | لا |  |
| 2 | `handoutId` 🔑 | `text` | لا |  |
| 3 | `quantity` | `integer` | لا | `1` |
| 4 | `updatedAt` | `timestamp(3)` | لا |  |

### `handout_categories` — 9 عموداً، 24 صف، مجموعة `CATALOG`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `slug` | `text` | لا |  |
| 3 | `nameAr` | `text` | لا |  |
| 4 | `descriptionAr` | `text` | لا |  |
| 5 | `icon` | `text` | لا |  |
| 6 | `parentId` | `text` | نعم |  |
| 7 | `sortOrder` | `integer` | لا | `0` |
| 8 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 9 | `updatedAt` | `timestamp(3)` | لا |  |

### `handout_order_items` — 5 عموداً، 0 صف، مجموعة `ORDERS`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `orderId` | `text` | لا |  |
| 3 | `handoutId` | `text` | لا |  |
| 4 | `quantity` | `integer` | لا | `1` |
| 5 | `unitPrice` | `integer` | لا |  |

### `handout_reviews` — 9 عموداً، 0 صف، مجموعة `REVIEWS`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `handoutId` | `text` | لا |  |
| 3 | `customerId` | `text` | لا |  |
| 4 | `rating` | `integer` | لا |  |
| 5 | `title` | `text` | لا |  |
| 6 | `body` | `text` | لا |  |
| 7 | `status` | `"ReviewStatus"` | لا | `'pending'` |
| 8 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 9 | `updatedAt` | `timestamp(3)` | لا |  |

### `handout_wishlist_items` — 3 عموداً، 0 صف، مجموعة `CART_WISHLIST`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `customerId` 🔑 | `text` | لا |  |
| 2 | `handoutId` 🔑 | `text` | لا |  |
| 3 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |

### `handouts` — 19 عموداً، 3 صف، مجموعة `CATALOG`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `slug` | `text` | لا |  |
| 3 | `titleAr` | `text` | لا |  |
| 4 | `descriptionAr` | `text` | لا |  |
| 5 | `price` | `integer` | لا |  |
| 6 | `compareAtPrice` | `integer` | نعم |  |
| 7 | `stock` | `integer` | لا | `0` |
| 8 | `pages` | `integer` | لا |  |
| 9 | `publishedYear` | `integer` | لا |  |
| 11 | `languageAr` | `text` | لا | `'العربية'` |
| 14 | `coverUrl` | `text` | نعم |  |
| 15 | `tags` | `"BookTag"[]` | نعم | `ARRAY[]` |
| 16 | `rating` | `double precision` | لا | `0` |
| 17 | `reviewsCount` | `integer` | لا | `0` |
| 18 | `authorId` | `text` | لا |  |
| 19 | `categoryId` | `text` | لا |  |
| 20 | `publisherId` | `text` | لا |  |
| 21 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 22 | `updatedAt` | `timestamp(3)` | لا |  |

### `newsletter_subscribers` — 3 عموداً، 0 صف، مجموعة `MARKETING`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `email` 🔑 | `text` | لا |  |
| 2 | `locale` | `text` | لا | `'ar'` |
| 3 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |

### `order_events` — 4 عموداً، 3 صف، مجموعة `ORDERS`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `orderId` | `text` | لا |  |
| 3 | `status` | `"OrderStatus"` | لا |  |
| 4 | `occurredAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |

### `order_items` — 5 عموداً، 5 صف، مجموعة `ORDERS`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `orderId` | `text` | لا |  |
| 3 | `bookId` | `text` | لا |  |
| 4 | `quantity` | `integer` | لا | `1` |
| 5 | `unitPrice` | `integer` | لا |  |

### `orders` — 18 عموداً، 1 صف، مجموعة `ORDERS`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `reference` | `text` | لا |  |
| 3 | `customerId` | `text` | لا |  |
| 4 | `status` | `"OrderStatus"` | لا | `'pending'` |
| 5 | `subtotal` | `integer` | لا |  |
| 6 | `shippingCost` | `integer` | لا | `0` |
| 7 | `discount` | `integer` | لا | `0` |
| 8 | `total` | `integer` | لا |  |
| 9 | `paymentMethod` | `"PaymentMethod"` | لا |  |
| 10 | `shippingMethod` | `"ShippingMethod"` | لا |  |
| 11 | `shippingName` | `text` | لا |  |
| 12 | `shippingPhone` | `text` | لا |  |
| 13 | `shippingGovernorate` | `text` | لا |  |
| 14 | `shippingCity` | `text` | لا |  |
| 15 | `shippingLine` | `text` | لا |  |
| 16 | `notes` | `text` | نعم |  |
| 17 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 18 | `updatedAt` | `timestamp(3)` | لا |  |

### `publishers` — 6 عموداً، 19 صف، مجموعة `CATALOG`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `slug` | `text` | لا |  |
| 3 | `nameAr` | `text` | لا |  |
| 7 | `descriptionAr` | `text` | لا | `''` |
| 11 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 12 | `updatedAt` | `timestamp(3)` | لا |  |

### `reviews` — 9 عموداً، 0 صف، مجموعة `REVIEWS`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `id` 🔑 | `text` | لا |  |
| 2 | `bookId` | `text` | لا |  |
| 3 | `customerId` | `text` | لا |  |
| 4 | `rating` | `integer` | لا |  |
| 5 | `title` | `text` | لا |  |
| 6 | `body` | `text` | لا |  |
| 7 | `status` | `"ReviewStatus"` | لا | `'pending'` |
| 8 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |
| 9 | `updatedAt` | `timestamp(3)` | لا |  |

### `store_settings` — 3 عموداً، 11 صف، مجموعة `SETTINGS`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `key` 🔑 | `text` | لا |  |
| 2 | `value` | `text` | لا |  |
| 3 | `updatedAt` | `timestamp(3)` | لا |  |

### `wishlist_items` — 3 عموداً، 0 صف، مجموعة `CART_WISHLIST`

| # | العمود | النوع | null | الافتراضي |
|--:|---|---|---|---|
| 1 | `customerId` 🔑 | `text` | لا |  |
| 2 | `bookId` 🔑 | `text` | لا |  |
| 3 | `createdAt` | `timestamp(3)` | لا | `CURRENT_TIMESTAMP` |

## الملحق ب — المفاتيح الأساسية في `public`

| الجدول | الأعمدة | النوع |
|---|---|---|
| `_prisma_migrations` | `id` | `varchar(36)` |
| `addresses` | `id` | `cuid` نصّي |
| `authors` | `id` | `cuid` نصّي |
| `books` | `id` | `cuid` نصّي |
| `cart_items` | `customerId`، `bookId` | مركّب (جدول ربط) |
| `categories` | `id` | `cuid` نصّي |
| `contact_messages` | `id` | `cuid` نصّي |
| `coupons` | `id` | `cuid` نصّي |
| `customers` | `id` | `cuid` نصّي |
| `handout_cart_items` | `customerId`، `handoutId` | مركّب (جدول ربط) |
| `handout_categories` | `id` | `cuid` نصّي |
| `handout_order_items` | `id` | `cuid` نصّي |
| `handout_reviews` | `id` | `cuid` نصّي |
| `handout_wishlist_items` | `customerId`، `handoutId` | مركّب (جدول ربط) |
| `handouts` | `id` | `cuid` نصّي |
| `newsletter_subscribers` | `email` | طبيعي (`email`) |
| `order_events` | `id` | `cuid` نصّي |
| `order_items` | `id` | `cuid` نصّي |
| `orders` | `id` | `cuid` نصّي |
| `publishers` | `id` | `cuid` نصّي |
| `reviews` | `id` | `cuid` نصّي |
| `store_settings` | `key` | طبيعي (`key`) |
| `wishlist_items` | `customerId`، `bookId` | مركّب (جدول ربط) |

## الملحق ج — الأنواع المعدودة (Enums)

| المخطط | النوع | القيم | ملاحظة |
|---|---|---|---|
| `auth` | `aal_level` | `aal1`، `aal2`، `aal3` |  |
| `auth` | `code_challenge_method` | `s256`، `plain` |  |
| `auth` | `factor_status` | `unverified`، `verified` |  |
| `auth` | `factor_type` | `totp`، `webauthn`، `phone`، `recovery_code` |  |
| `auth` | `oauth_authorization_status` | `pending`، `approved`، `denied`، `expired` |  |
| `auth` | `oauth_client_type` | `public`، `confidential` |  |
| `auth` | `oauth_registration_type` | `dynamic`، `manual` |  |
| `auth` | `oauth_response_type` | `code` |  |
| `auth` | `one_time_token_type` | `confirmation_token`، `reauthentication_token`، `recovery_token`، `email_change_token_new`، `email_change_token_current`، `phone_change_token` |  |
| `public` | `BookTag` | `bestseller`، `new`، `featured`، `award` |  |
| `public` | `ContactStatus` | `new`، `read` |  |
| `public` | `CouponType` | `percentage`، `fixed` |  |
| `public` | `CustomerRole` | `customer`، `admin` |  |
| `public` | `CustomerStatus` | `active`، `blocked` |  |
| `public` | `OrderStatus` | `pending`، `processing`، `shipped`، `delivered`، `cancelled` |  |
| `public` | `PaymentMethod` | `cod`، `card`، `wallet` |  |
| `public` | `ReviewStatus` | `pending`، `published`، `rejected` |  |
| `public` | `ShippingMethod` | `standard`، `express`، `pickup` |  |
| `realtime` | `action` | `INSERT`، `UPDATE`، `DELETE`، `TRUNCATE`، `ERROR` |  |
| `realtime` | `equality_op` | `eq`، `neq`، `lt`، `lte`، `gt`، `gte`، `in`، `like`، `ilike`، `is`، `match`، `imatch`، `isdistinct` |  |
| `storage` | `buckettype` | `STANDARD`، `ANALYTICS`، `VECTOR` |  |

## الملحق د — الإضافات (Extensions)

| الإضافة | الإصدار | المخطط |
|---|---|---|
| `pg_stat_statements` | 1.11 | `extensions` |
| `pgcrypto` | 1.3 | `extensions` |
| `plpgsql` | 1.0 | `pg_catalog` |
| `supabase_vault` | 0.3.1 | `vault` |
| `uuid-ossp` | 1.1 | `extensions` |

## الملحق هـ — سجل ترحيلات Prisma كما في القاعدة

| # | الترحيل | اكتمل (UTC) | خطوات | تراجُع |
|--:|---|---|--:|---|
| 1 | `20260830070905_init` | 2026-08-30 07:09:09 | 1 | — |
| 2 | `20260830072833_add_customer_city` | 2026-08-30 07:28:34 | 1 | — |
| 3 | `20260830084706_add_customer_role` | 2026-08-30 08:47:07 | 1 | — |
| 4 | `20260830141224_marketing_and_settings` | 2026-08-30 14:12:26 | 1 | — |
| 5 | `20260901090000_publishers` | 2026-08-31 21:38:49 | 1 | — |
| 6 | `20260901120000_drop_publisher_website` | 2026-09-01 13:41:55 | 1 | — |
| 7 | `20260905000000_drop_english_columns` | 2026-09-04 22:10:59 | 1 | — |
| 8 | `20260912000000_handouts` | 2026-09-12 20:54:19 | 1 | — |
| 9 | `20260913000000_handout_commerce` | 2026-09-13 04:16:08 | 1 | — |
| 10 | `20260915000000_category_trees` | 2026-09-15 06:00:14 | 1 | — |
| 11 | `20260915120000_author_subject` | 2026-09-15 12:37:13 | 1 | — |
| 12 | `20260915140000_author_subject_category` | 2026-09-15 13:35:28 | 1 | — |
| 13 | `20260915200000_drop_catalogue_fields` | 2026-09-16 08:14:49 | 1 | — |
| 14 | `20260916160000_unique_catalogue_names` | 2026-09-16 15:38:36 | 1 | — |

## الملحق و — طريقة الالتقاط (لإعادة الجرد لاحقاً)

- `npm run db:inventory` يعيد كتابة هذا الملف كاملاً؛ `-- --json <ملف>` يحفظ الالتقاط الخام أيضاً. السكربت: `scripts/db-audit-inventory.ts`.
- الاتصال: حزمة `pg` الموجودة في المشروع مع `DIRECT_URL` من `.env.local` (مجمّع الجلسات، منفذ 5432، SSL). لا يحتاج `psql`.
- كل الاستعلامات قراءة فقط على `pg_catalog`:
  - المخططات: `pg_namespace` مع استثناء `pg_catalog`/`information_schema`/`pg_toast` و`pg_temp_*`.
  - الجداول: `pg_class` (`relkind in ('r','p','v','m','f')`) + `pg_stat_all_tables.n_live_tup` + `pg_total_relation_size` + `has_table_privilege`.
  - الصفوف الفعلية: `select count(*)` لكل جدول مقروء يقدَّر بأقل من مليونَي صف.
  - الأعمدة: `pg_attribute` (`attnum > 0 and not attisdropped`) + `format_type` + `pg_attrdef`؛ الفهارس: `pg_indexes`.
  - المفاتيح: `pg_constraint` (`contype = 'f'` و`'p'`) مع `confdeltype`/`confupdtype`.
  - الأنواع: `pg_type` + `pg_enum`؛ الإضافات: `pg_extension`.
- الفرق في القسم 6: مجلدات `prisma/migrations/` مقابل `_prisma_migrations`، وأعمدة/أنواع `public` مقابل قراءة مبسّطة لـ`schema.prisma` (models و`@@map` و`@map`؛ حقول العلاقات ليست أعمدة).
- المجموعات معرَّفة في أعلى السكربت؛ جدول جديد لا يُعيَّن هناك يظهر تحت `UNGROUPED` مع تحذير على الطرفية.
- **السكربت لا يغيّر شيئاً في القاعدة.**

