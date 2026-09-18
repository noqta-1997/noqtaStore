# إصلاح قاعدة بيانات Noqta Store — 01: ما تغيّر ولماذا

> **الغرض:** سجلّ الإصلاحات التي تلت الجرد (`00-inventory.md`)، مرحلةً مرحلة، ليقرأه من يفتح القاعدة لاحقاً بلا سياق: ما كانت العلّة، ما الذي صار في القاعدة أو في الكود، وكيف تحقّقنا. الأرقام والأسماء هنا هي أسماء فعلية في القاعدة والمستودع.
>
> **الفترة:** 2026-09-16 → 2026-09-18. **الالتزامات:** من `6ca656c` إلى `63622bd` (24 التزاماً). **الترحيلات المضافة:** 10 (من `20260916160000_unique_catalogue_names` إلى `20260918110000_lock_public_api`)؛ سجل القاعدة والمجلد متطابقان (23 ترحيلاً).
>
> رموز المجموعات كما في الجرد: `CATALOG`, `CUSTOMERS`, `ORDERS`, `REVIEWS`, `CART_WISHLIST`, `MARKETING`.

## 1. المبدأ الذي حكم السلسلة

القاعدة هي التي تضمن، والكود هو الذي يقرأ جوابها ويترجمه للمستخدم. كل مرحلة كانت من أحد ثلاثة أشكال:

1. **قيدٌ في القاعدة** لم يكن موجوداً (CHECK، مفتاح فريد، مفتاح أجنبي، فهرس جزئي أو تعبيري، RLS) — يُكتب في SQL الترحيل حين لا يعبّر عنه Prisma، ويُترك تعليقٌ في `schema.prisma` يدلّ عليه.
2. **كتابةٌ في الكود تحترم القيد** بدل أن تسبقه بفحص متسابق: `UPDATE … WHERE` هو الفحص (`takeFromShelf`، `spendCoupon`)، أو إعادةُ المعاملة كاملة عند رفض الفهرس (`withOrderReference`، `onceMoreIfSecondDefault`).
3. **ترجمةُ رفض القاعدة إلى رسالة**: `src/lib/prisma-errors.ts` يميّز P2002/P2003/P2025 ورمز CHECK (23514) واسم الفهرس (`violatedConstraint`)، والإجراءات تعيد مفتاحاً في `actionErrors` بدل رمي الخطأ على الواجهة.

## 2. المراحل

| # | الالتزام | المجموعة | العلّة | ما صار |
|---|---|---|---|---|
| 1 | `6ca656c` | إدارة | كل خطأ حفظ كان «قيمة مكرّرة» | `prisma-errors.ts`؛ P2002 → `duplicate`، غيره → `saveFailed` مع تسجيل السبب |
| 2 | `53dd191` | إدارة | حذفٌ مرفوض (FK) يرمي خطأً ويجمّد الحوار | `attemptDelete`: P2025 → `notFound`، P2003 → `inUse`؛ الحوار يلتقط الرمي |
| 3 | `e4e2087` | `CATALOG` | الاسم لم يكن مفتاحاً (الـslug فقط) فتكرّر «دار الشروق» | `nameAr @unique` على المدرسين والدور، `(parentId, nameAr)` على الشجرتين بـ`NULLS NOT DISTINCT` |
| 4 | `8061876` | `CUSTOMERS` | `userId` نصٌّ بلا مفتاح إلى `auth.users` | عمود `uuid` + FK `customers_userId_fkey` … ON DELETE SET NULL (يدوي؛ استبطان Prisma يفشل بعدها بـP4002) |
| 5 | `e4f5b5a` | `CATALOG`/`ORDERS` | المخزون يهبط تحت الصفر في سباق شراءَين | CHECK ≥ 0 على المخزون و> 0 على الكميات؛ `takeFromShelf` |
| 6 | `574bc24` | `ORDERS`/`MARKETING` | لا حدود للأسعار والمبالغ والتقييم | 16 قيد CHECK: أسعار ≥ 0، تقييم 0–5، `total = subtotal + shippingCost − discount`، حدود الكوبون |
| 7 | `2f36b86` | `MARKETING` | آخر استعمال للكوبون يُصرف مرتين | CHECK `usedCount ≤ usageLimit`؛ `spendCoupon` بشرط في WHERE؛ الدفع يرفض كوداً لم يعد صالحاً |
| 8 | `614ca24` | `ORDERS` | مرجع الطلب 4 أرقام/يوم؛ التصادم ينهار على الزبون | 6 أرقام + `withOrderReference` يعيد المعاملة كلها عند P2002 على `orders_reference_key` |
| 9 | `40eab19` | `CUSTOMERS` | `status = blocked` زخرفي | `getCustomerInGoodStanding`: لا طلب ولا مراجعة من حساب محظور؛ إشعار في الدفع والحساب |
| 10 | `2518e88` | `CUSTOMERS` | صف البريد يُسلَّم لحساب آخر | الهوية `userId`، البريد نسخة تُحدَّث كل دخول (`followAuthEmail`)، والصف المربوط بغيره يُزاح لا يُسلَّم (`releaseEmail`) |
| 11 | `cff7228` | `CUSTOMERS` | عنوانان افتراضيان في سباق | فهرس جزئي فريد `(customerId) WHERE isDefault`؛ `src/lib/addresses.ts` يعيد المعاملة عند الرفض |
| 12 | `e798d3c` | كل الصفحات | كل `revalidatePath` لا يطابق شيئاً في الإنتاج (مجموعات المسار) | القاعدة في `src/lib/revalidate.ts`: الحرفي بلا `type`، والنمط بمجموعته `/(storefront)/…`؛ الدفع يحدّث الكتالوج |
| 13 | `ebf0548` | `REVIEWS`/`CART_WISHLIST` | ستة مفاتيح أجنبية بلا فهرس | `@@index` عليها؛ الجرد يفحص تغطية كل FK |
| 14 | `7d972c1` | إدارة | جدولا المدرسين والدور يعدّان الكتب دون الملازم | `handoutsCount` وعمود «عدد الملازم»؛ فاصل تعادل بالاسم |
| 15 | `bfa5309` | `CATALOG` | «أحمد» و«احمد» اسمان | دالة `arabic_key(text)` وفهارس فريدة تعبيرية عليها؛ الاسم المخزّن لا يُمسّ |
| 16 | `9465a9e` | `CUSTOMERS` | حقل البريد يُعرض للتعديل ويُتجاهل | للقراءة فقط مع تلميح |
| 17–18 | `b5b38d1`, `ff36c3d` | بحث | البحث يقارن الحروف | المعرّفات المطابقة عبر `arabic_key()` في SQL ثم `where.id in`؛ `src/lib/arabic.ts` للترشيح في الذاكرة |
| 19 | `c289c12` | `ORDERS` | تاريخ المرجع بتوقيت UTC | `STORE_TIME_ZONE = Asia/Baghdad` |
| 20 | `0526703` | `CATALOG` | ترتيب المدرسين بالكتب فقط | كتب + ملازم، ثم الكتب، ثم الاسم |
| 21 | `65f064d` | `ORDERS`/`MARKETING` | استعمال الكوبون لا يعود عند الإلغاء | `orders.couponCode`؛ الإلغاء يعيده، والعودة من الإلغاء تأخذه أو تُرفض بـ`couponSpent`، والحذف يعيده |
| 22 | (هذا الالتزام) | كل `public` | الجداول كلها مكشوفة للقراءة والكتابة عبر REST بالمفتاح العلني | RLS على الـ23 جدولاً بلا سياسات، سحب صلاحيات `anon`/`authenticated` والصلاحيات الافتراضية |
| 23 | (هذا الالتزام) | إدارة | صفٌ محذوف من تبويب آخر يبقى على الشاشة | `router.refresh()` عند `notFound` في الحوار والنموذج وزر الحظر |

## 3. ما صار في القاعدة ولا يعبّر عنه Prisma

هذه كُتبت يدوياً في ملفات الترحيل، و`schema.prisma` يحمل تعليقاً يدلّ عليها؛ `npx prisma migrate diff --from-schema <نسخة HEAD> --to-schema prisma/schema.prisma` يعطي ترحيلاً فارغاً بعدها لأنها خارج ما يراه.

| البند | الترحيل | أين |
|---|---|---|
| `NULLS NOT DISTINCT` على مفتاحي الشجرتين | `20260916160000_unique_catalogue_names` | `categories`, `handout_categories` |
| FK `customers.userId → auth.users(id)` ON DELETE SET NULL | `20260916170000_customers_user_fk` | `customers` |
| 23 قيد CHECK | `20260917080000_quantity_checks`, `20260917100000_money_and_rating_checks`, `20260917120000_coupon_usage_check` | الملحق ب في الجرد |
| فهرس جزئي فريد `addresses_one_default_per_customer` | `20260917140000_one_default_address` | `addresses` |
| دالة `arabic_key(text)` + 4 فهارس فريدة تعبيرية `*_normalized_key` | `20260917160000_normalized_name_keys` | `authors`, `publishers`, الشجرتان |
| RLS + سحب الصلاحيات + الصلاحيات الافتراضية | `20260918110000_lock_public_api` | كل `public` |

الجرد (`npm run db:inventory`) يعرض كل ذلك من الكتالوج لا من المخطط، ويُسمّي أي مفتاح أجنبي بلا فهرس أو جدولاً بلا RLS.

## 4. قواعد لمن يضيف ترحيلاً بعد هذا

- **ولّد الترحيل من المخطط لا من القاعدة:** `git show HEAD:prisma/schema.prisma > /tmp/head.prisma` ثم `npx prisma migrate diff --from-schema /tmp/head.prisma --to-schema prisma/schema.prisma --script`، ثم `npx prisma migrate deploy` (لا `migrate dev`: تفاعلي، ولا `--from-config-datasource`: يفشل بـP4002 بسبب المفتاح إلى `auth.users`).
- **كل جدول جديد يحتاج `ENABLE ROW LEVEL SECURITY` في ترحيله.** الصلاحيات الافتراضية صارت لا تمنح `anon`/`authenticated` شيئاً، لكن RLS يُفعَّل لكل جدول على حدة؛ الجرد يسمّي ما نُسي.
- **ما لا يعبّر عنه Prisma** (CHECK، الجزئي، التعبيري، `NULLS NOT DISTINCT`، الدوال) يُكتب في SQL الترحيل مع تعليق رأسي يشرح العلّة، وتعليقٌ في المخطط يدلّ عليه.
- **بعد `prisma generate` بموديل أو حقل جديد أعد تشغيل `next dev`:** العميل مخزّن على `globalThis`.
- **اختبر الإدراج بلا أثر** بمعاملة تُرمى في آخرها (`$transaction` + `throw`)؛ واختبر السباقات بمعاملة تُبقي الإدراج مفتوحاً ثم عملية ثانية في الفجوة.
- **الانحراف** يُفحص بالقسم 6 من الجرد، لا بالاستبطان.

## 5. ما لم يُفحص

خارج القاعدة نفسها ولم تلمسه السلسلة: النسخ الاحتياطي واستعادة النقطة الزمنية (خطة Supabase)، إعدادات Auth (تأكيد البريد، مدد الرموز)، حدود مجمّع الاتصالات. وإعداد لوحة Supabase «Exposed schemas» ما زال يشمل `public`؛ الترحيل 22 يغلق الجداول من داخل القاعدة، وحذف `public` من تلك القائمة طبقةٌ ثانية إن أُريدت.
