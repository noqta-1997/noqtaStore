/**
 * Read-only inventory of the Supabase Postgres database, rendered as
 * docs/db-audit/00-inventory.md — the first file of the database audit and
 * the one every later audit refers to for table names and group codes.
 *
 * Everything in the document comes from `pg_catalog` at run time; nothing is
 * hand-maintained except the group definitions and the prose describing each
 * group. The drift section is computed by comparing the live database with
 * `prisma/schema.prisma` and `prisma/migrations/`, so re-running after a
 * migration updates it rather than freezing the day it was first written.
 *
 *   npm run db:inventory                    rewrite docs/db-audit/00-inventory.md
 *   npm run db:inventory -- --json <file>   also dump the raw capture as JSON
 *
 * Connects through DIRECT_URL (the session-mode pooler, as migrations do) and
 * never writes to the database.
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { Client } from "pg";

loadEnv({ path: path.join(process.cwd(), ".env.local"), quiet: true });

const ROOT = process.cwd();
const OUT = path.join(ROOT, "docs", "db-audit", "00-inventory.md");
const SCHEMA_FILE = path.join(ROOT, "prisma", "schema.prisma");
const MIGRATIONS_DIR = path.join(ROOT, "prisma", "migrations");

const jsonFlag = process.argv.indexOf("--json");
const JSON_OUT = jsonFlag !== -1 ? process.argv[jsonFlag + 1] : undefined;

// ---------------------------------------------------------------------------
// Groups — the codes later audit files use. A table belongs to exactly one.
// A table the database grows that is listed nowhere lands in UNGROUPED and is
// reported on the console, so the assignment is a deliberate edit here.
// ---------------------------------------------------------------------------

const APP_GROUPS: Record<string, { ar: string; tables: string[] }> = {
  CATALOG: { ar: "الكتالوج", tables: ["categories", "handout_categories", "publishers", "authors", "books", "handouts"] },
  CUSTOMERS: { ar: "العملاء والعناوين", tables: ["customers", "addresses"] },
  ORDERS: { ar: "الطلبات", tables: ["orders", "order_items", "handout_order_items", "order_events"] },
  REVIEWS: { ar: "المراجعات", tables: ["reviews", "handout_reviews"] },
  CART_WISHLIST: { ar: "السلة والمفضلة", tables: ["cart_items", "handout_cart_items", "wishlist_items", "handout_wishlist_items"] },
  MARKETING: { ar: "التسويق والتواصل", tables: ["coupons", "newsletter_subscribers", "contact_messages"] },
  SETTINGS: { ar: "الإعدادات", tables: ["store_settings"] },
};

const AUTH_GROUPS: Record<string, { ar: string; tables: string[] }> = {
  AUTH_CORE: {
    ar: "الهوية والجلسات",
    tables: ["users", "identities", "sessions", "refresh_tokens", "mfa_amr_claims", "one_time_tokens", "flow_state", "audit_log_entries", "instances"],
  },
  AUTH_MFA: {
    ar: "التحقق متعدد العوامل",
    tables: ["mfa_factors", "mfa_challenges", "mfa_recovery_code_sets", "mfa_recovery_codes", "webauthn_challenges", "webauthn_credentials"],
  },
  AUTH_OAUTH: {
    ar: "خادم OAuth ومزوّدوه",
    tables: ["oauth_clients", "oauth_authorizations", "oauth_consents", "oauth_client_states", "custom_oauth_providers"],
  },
  AUTH_SSO: {
    ar: "SSO / SAML / SCIM",
    tables: ["sso_providers", "sso_domains", "saml_providers", "saml_relay_states", "scim_tokens", "scim_users"],
  },
};

const MIGRATION_TABLES = ["public._prisma_migrations", "auth.schema_migrations", "realtime.schema_migrations", "storage.migrations"];

const SCHEMA_GROUPS: Record<string, { code: string; ar: string }> = {
  storage: { code: "STORAGE", ar: "تخزين الملفات" },
  realtime: { code: "REALTIME", ar: "البث اللحظي" },
  vault: { code: "VAULT", ar: "الأسرار" },
};

const SCHEMA_DESC: Record<string, string> = {
  auth: "Supabase Auth (GoTrue): المستخدمون، الجلسات، الهويات، MFA، OAuth، SSO",
  extensions: "موطن الإضافات؛ لا جداول، فقط views الإحصاء §pg_stat_statements§",
  graphql: "داخلي لـ pg_graphql — فارغ",
  graphql_public: "واجهة pg_graphql العامة — فارغ",
  pgbouncer: "داخلي لمجمّع الاتصالات — فارغ",
  public: "**مخطط التطبيق** — كل ما تديره Prisma (§prisma/schema.prisma§)",
  realtime: "Supabase Realtime: قناة الرسائل والاشتراكات",
  storage: "Supabase Storage: الحاويات (buckets) والملفات",
  vault: "Supabase Vault: الأسرار المشفّرة",
};

const SYSTEM_SCHEMAS = "'pg_catalog','information_schema','pg_toast'";

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

type SchemaRow = { schema: string; owner: string; tables: string; views: string };
type RelationRow = {
  schema: string;
  name: string;
  kind: "r" | "p" | "v" | "m" | "f";
  owner: string;
  columns: string;
  reltuples: string;
  n_live_tup: string | null;
  total_size: string;
  can_select: boolean;
  exact_rows: number | null;
  count_note?: string;
};
type ColumnRow = {
  schema: string;
  table: string;
  position: number;
  name: string;
  type: string;
  not_null: boolean;
  default: string | null;
};
type ForeignKeyRow = {
  name: string;
  schema: string;
  table: string;
  columns: string[];
  ref_schema: string;
  ref_table: string;
  ref_columns: string[];
  on_delete: string;
  on_update: string;
  deferrable: boolean;
  validated: boolean;
};
type PrimaryKeyRow = { schema: string; table: string; name: string; columns: string[] };
type CheckRow = { schema: string; table: string; name: string; definition: string };
type EnumRow = { schema: string; name: string; labels: string[] };
type ExtensionRow = { name: string; version: string; schema: string };
type IndexRow = { tablename: string; indexname: string; indexdef: string };
type MigrationRow = { migration_name: string; finished_at: Date | null; applied_steps_count: number; rolled_back_at: Date | null };
type BucketRow = { id: string; public: boolean; type: string; created_at: Date; objects: string };

type Capture = {
  capturedAt: string;
  connection: { host: string; port: string; user: string; database: string };
  server: { version: string; user: string };
  dbSize: string;
  schemas: SchemaRow[];
  relations: RelationRow[];
  columns: ColumnRow[];
  foreignKeys: ForeignKeyRow[];
  primaryKeys: PrimaryKeyRow[];
  checks: CheckRow[];
  enums: EnumRow[];
  extensions: ExtensionRow[];
  publicIndexes: IndexRow[];
  prismaMigrations: MigrationRow[];
  buckets: BucketRow[];
  customers: { total: number; withUserId: number };
  identityProviders: { provider: string; n: number }[];
  settingsKeys: string[];
};

async function capture(): Promise<Capture> {
  const url = process.env.DIRECT_URL;
  if (!url) throw new Error("DIRECT_URL is missing — check .env.local");

  const u = new URL(url);
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 60_000,
    application_name: "noqta-db-inventory",
  });
  await client.connect();
  const q = async <T>(sql: string, params?: unknown[]) => (await client.query(sql, params)).rows as T[];

  try {
    const server = (await q<{ version: string; user: string }>(`select version() as version, current_user as "user"`))[0];
    const dbSize = (await q<{ size: string }>(`select pg_size_pretty(pg_database_size(current_database())) as size`))[0].size;

    const schemas = await q<SchemaRow>(`
      select n.nspname as schema, pg_get_userbyid(n.nspowner) as owner,
             (select count(*) from pg_class c where c.relnamespace = n.oid and c.relkind in ('r','p')) as tables,
             (select count(*) from pg_class c where c.relnamespace = n.oid and c.relkind in ('v','m')) as views
      from pg_namespace n
      where n.nspname not in (${SYSTEM_SCHEMAS})
        and n.nspname not like 'pg_temp_%' and n.nspname not like 'pg_toast_temp_%'
      order by n.nspname`);

    const relations = await q<RelationRow>(`
      select n.nspname as schema, c.relname as name, c.relkind as kind,
             pg_get_userbyid(c.relowner) as owner,
             (select count(*) from pg_attribute a where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as columns,
             c.reltuples::bigint as reltuples,
             s.n_live_tup as n_live_tup,
             pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
             has_table_privilege(c.oid, 'SELECT') as can_select
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_stat_all_tables s on s.relid = c.oid
      where c.relkind in ('r','p','v','m','f')
        and n.nspname not in (${SYSTEM_SCHEMAS})
        and n.nspname not like 'pg_temp_%' and n.nspname not like 'pg_toast_temp_%'
      order by n.nspname, c.relname`);

    // Exact counts where readable and not huge; the estimate stands otherwise.
    for (const r of relations) {
      r.exact_rows = null;
      if (r.kind !== "r" && r.kind !== "p") continue;
      const estimate = Number(r.n_live_tup ?? r.reltuples ?? 0);
      if (!r.can_select) {
        r.count_note = "لا صلاحية SELECT";
        continue;
      }
      if (estimate > 2_000_000) {
        r.count_note = "تُرك العدّ الفعلي (التقدير > 2M)";
        continue;
      }
      try {
        r.exact_rows = Number((await q<{ n: string }>(`select count(*)::bigint as n from "${r.schema}"."${r.name}"`))[0].n);
      } catch (error) {
        r.count_note = (error as Error).message.split("\n")[0];
      }
    }

    const columns = await q<ColumnRow>(`
      select n.nspname as schema, c.relname as table, a.attnum as position, a.attname as name,
             format_type(a.atttypid, a.atttypmod) as type, a.attnotnull as not_null,
             pg_get_expr(d.adbin, d.adrelid) as "default"
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      where c.relkind in ('r','p') and a.attnum > 0 and not a.attisdropped
        and n.nspname not in (${SYSTEM_SCHEMAS}) and n.nspname not like 'pg_temp_%'
      order by n.nspname, c.relname, a.attnum`);

    const action = (col: string) =>
      `case ${col} when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE' when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' end`;
    const foreignKeys = await q<ForeignKeyRow>(`
      select con.conname as name, ns.nspname as schema, cl.relname as "table",
             (select array_agg(a.attname::text order by k.ord) from unnest(con.conkey) with ordinality k(attnum, ord)
                join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum) as columns,
             fns.nspname as ref_schema, fcl.relname as ref_table,
             (select array_agg(a.attname::text order by k.ord) from unnest(con.confkey) with ordinality k(attnum, ord)
                join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k.attnum) as ref_columns,
             ${action("con.confdeltype")} as on_delete,
             ${action("con.confupdtype")} as on_update,
             con.condeferrable as deferrable, con.convalidated as validated
      from pg_constraint con
      join pg_class cl on cl.oid = con.conrelid
      join pg_namespace ns on ns.oid = cl.relnamespace
      join pg_class fcl on fcl.oid = con.confrelid
      join pg_namespace fns on fns.oid = fcl.relnamespace
      where con.contype = 'f' and ns.nspname not in (${SYSTEM_SCHEMAS})
      order by ns.nspname, cl.relname, con.conname`);

    const primaryKeys = await q<PrimaryKeyRow>(`
      select ns.nspname as schema, cl.relname as "table", con.conname as name,
             (select array_agg(a.attname::text order by k.ord) from unnest(con.conkey) with ordinality k(attnum, ord)
                join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum) as columns
      from pg_constraint con
      join pg_class cl on cl.oid = con.conrelid
      join pg_namespace ns on ns.oid = cl.relnamespace
      where con.contype = 'p' and ns.nspname not in (${SYSTEM_SCHEMAS})
      order by 1, 2`);

    const checks = await q<CheckRow>(`
      select ns.nspname as schema, cl.relname as "table", con.conname as name, pg_get_constraintdef(con.oid) as definition
      from pg_constraint con
      join pg_class cl on cl.oid = con.conrelid
      join pg_namespace ns on ns.oid = cl.relnamespace
      where con.contype = 'c' and ns.nspname not in (${SYSTEM_SCHEMAS})
      order by 1, 2, 3`);

    const enums = await q<EnumRow>(`
      select n.nspname as schema, t.typname as name, array_agg(e.enumlabel::text order by e.enumsortorder) as labels
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      join pg_enum e on e.enumtypid = t.oid
      where n.nspname not in (${SYSTEM_SCHEMAS})
      group by 1, 2 order by 1, 2`);

    const extensions = await q<ExtensionRow>(
      `select e.extname as name, e.extversion as version, n.nspname as schema from pg_extension e join pg_namespace n on n.oid = e.extnamespace order by 1`,
    );
    const publicIndexes = await q<IndexRow>(`select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by 1, 2`);

    let prismaMigrations: MigrationRow[] = [];
    try {
      prismaMigrations = await q<MigrationRow>(
        `select migration_name, finished_at, applied_steps_count, rolled_back_at from public._prisma_migrations order by started_at`,
      );
    } catch {
      // No ledger yet: every migration in the folder is pending.
    }

    const buckets = await q<BucketRow>(
      `select id, public, type::text as type, created_at, (select count(*) from storage.objects o where o.bucket_id = b.id) as objects from storage.buckets b order by created_at`,
    ).catch(() => [] as BucketRow[]);
    const customerRow = (await q<{ total: string; with_user_id: string }>(`select count(*) as total, count("userId") as with_user_id from public.customers`))[0];
    const identityProviders = (await q<{ provider: string; n: string }>(`select provider, count(*) as n from auth.identities group by provider order by provider`).catch(() => [])).map(
      (r) => ({ provider: r.provider, n: Number(r.n) }),
    );
    const settingsKeys = (await q<{ key: string }>(`select key from public.store_settings order by key`)).map((r) => r.key);

    return {
      capturedAt: new Date().toISOString(),
      connection: { host: u.hostname, port: u.port, user: decodeURIComponent(u.username), database: u.pathname.slice(1) },
      server,
      dbSize,
      schemas,
      relations,
      columns,
      foreignKeys,
      primaryKeys,
      checks,
      enums,
      extensions,
      publicIndexes,
      prismaMigrations,
      buckets,
      customers: { total: Number(customerRow.total), withUserId: Number(customerRow.with_user_id) },
      identityProviders,
      settingsKeys,
    };
  } finally {
    await client.end();
  }
}

// ---------------------------------------------------------------------------
// The repository side of the drift comparison
// ---------------------------------------------------------------------------

type PrismaSchema = { models: Map<string, { table: string; columns: string[] }>; enums: Set<string> };

/**
 * Just enough of the Prisma schema language to know which columns and enums
 * the client expects: model blocks, `@@map`, `@map`, and which fields are
 * relations (their type is another model) rather than columns.
 */
function parsePrismaSchema(source: string): PrismaSchema {
  const modelNames = new Set([...source.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]));
  const enums = new Set([...source.matchAll(/^enum\s+(\w+)\s*\{/gm)].map((m) => m[1]));
  const models = new Map<string, { table: string; columns: string[] }>();

  for (const block of source.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const [, model, body] = block;
    const columns: string[] = [];
    let table = model;
    for (const raw of body.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("//")) continue;
      const map = line.match(/^@@map\("([^"]+)"\)/);
      if (map) {
        table = map[1];
        continue;
      }
      if (line.startsWith("@@")) continue;
      const field = line.match(/^(\w+)\s+([A-Za-z]\w*)(\[\])?\??\s*(.*)$/);
      if (!field) continue;
      const [, name, type, , attrs] = field;
      if (modelNames.has(type)) continue; // relation field, no column
      const mapped = attrs.match(/@map\("([^"]+)"\)/);
      columns.push(mapped ? mapped[1] : name);
    }
    models.set(model, { table, columns });
  }
  return { models, enums };
}

function migrationFolders(): string[] {
  if (!existsSync(MIGRATIONS_DIR)) return [];
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{14}_/.test(d.name))
    .map((d) => d.name)
    .sort();
}

function git(args: string): string | null {
  try {
    return execSync(`git ${args}`, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

type DriftColumn = ColumnRow & { note: string; blocksInsert: boolean };

const num = (n: number | string | null | undefined) => (n === null || n === undefined ? "—" : Number(n).toLocaleString("en-US"));
const utc = (d: Date | string) => new Date(d).toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
const isTable = (r: RelationRow) => r.kind === "r" || r.kind === "p";

function render(inv: Capture, schema: PrismaSchema, folders: string[]): string {
  const tables = inv.relations.filter(isTable);
  const views = inv.relations.filter((r) => !isTable(r));
  const bySchema = (s: string) => inv.relations.filter((r) => r.schema === s);
  const table = (schemaName: string, name: string) => inv.relations.find((r) => r.schema === schemaName && r.name === name);
  const rows = (list: RelationRow[]) => list.reduce((n, r) => n + (r.exact_rows ?? 0), 0);
  const rowsOf = (schemaName: string, names: string[]) => rows(names.map((n) => table(schemaName, n)).filter((r): r is RelationRow => !!r));

  const groupOf = (r: RelationRow): string => {
    if (MIGRATION_TABLES.includes(`${r.schema}.${r.name}`)) return "MIGRATIONS";
    const pool = r.schema === "public" ? APP_GROUPS : r.schema === "auth" ? AUTH_GROUPS : null;
    if (pool) {
      for (const [code, g] of Object.entries(pool)) if (g.tables.includes(r.name)) return code;
      return "UNGROUPED";
    }
    if (r.schema === "extensions") return "STATS_VIEWS";
    return SCHEMA_GROUPS[r.schema]?.code ?? "UNGROUPED";
  };
  const ungrouped = tables.filter((r) => groupOf(r) === "UNGROUPED");
  for (const r of ungrouped) console.warn(`UNGROUPED table: ${r.schema}.${r.name} — assign it in scripts/db-audit-inventory.ts`);

  // ---- drift ------------------------------------------------------------
  const applied = new Set(inv.prismaMigrations.filter((m) => m.finished_at && !m.rolled_back_at).map((m) => m.migration_name));
  const pending = folders.filter((f) => !applied.has(f));
  const orphanLedger = [...applied].filter((m) => !folders.includes(m));

  const schemaTables = new Map([...schema.models.values()].map((m) => [m.table, m.columns]));
  const publicTables = bySchema("public").filter((r) => isTable(r) && r.name !== "_prisma_migrations");
  const extraColumns: DriftColumn[] = [];
  const missingColumns: { table: string; column: string }[] = [];
  const tablesNotInSchema = publicTables.filter((r) => !schemaTables.has(r.name)).map((r) => r.name);
  const modelsNotInDb = [...schemaTables.keys()].filter((t) => !publicTables.some((r) => r.name === t));
  for (const r of publicTables) {
    const expected = schemaTables.get(r.name);
    if (!expected) continue;
    const live = inv.columns.filter((c) => c.schema === "public" && c.table === r.name);
    for (const c of live) {
      if (expected.includes(c.name)) continue;
      // pg_indexes quotes the column only when it has to: `(isbn)` but `("weightGrams")`.
      const onColumn = new RegExp(`\\(\\s*"?${c.name}"?\\s*\\)`);
      const uniqueIndex = inv.publicIndexes.find((i) => i.tablename === r.name && i.indexdef.includes("UNIQUE") && onColumn.test(i.indexdef));
      const parts = [c.not_null ? "NOT NULL" : "nullable"];
      if (c.default) parts.push(`DEFAULT ${c.default}`);
      else if (c.not_null) parts.push("بلا قيمة افتراضية");
      if (uniqueIndex) parts.push(`فهرس فريد §${uniqueIndex.indexname}§`);
      extraColumns.push({ ...c, note: parts.join("، "), blocksInsert: c.not_null && !c.default });
    }
    for (const name of expected) if (!live.some((c) => c.name === name)) missingColumns.push({ table: r.name, column: name });
  }
  const publicEnums = inv.enums.filter((e) => e.schema === "public");
  const extraEnums = publicEnums.filter((e) => !schema.enums.has(e.name));
  const missingEnums = [...schema.enums].filter((e) => !publicEnums.some((x) => x.name === e));
  const drift = extraColumns.length + missingColumns.length + tablesNotInSchema.length + modelsNotInDb.length + extraEnums.length + missingEnums.length > 0;
  const blockedTables = [...new Set(extraColumns.filter((c) => c.blocksInsert).map((c) => c.table))];

  const customersFk = inv.foreignKeys.find((f) => f.schema === "public" && f.table === "customers" && f.ref_schema === "auth" && f.ref_table === "users");
  const head = git("rev-parse --short HEAD");
  const dirty = git("status --porcelain");
  const baghdad = new Date(inv.capturedAt).toLocaleString("en-GB", { timeZone: "Asia/Baghdad", hour12: false });

  const L: string[] = [];
  const p = (s = "") => L.push(s);

  // ---- header ------------------------------------------------------------
  p(`# جرد قاعدة بيانات Noqta Store — 00: الجرد الأولي`);
  p();
  p(`> **الغرض:** لقطة وصفية لقاعدة بيانات Supabase الخاصة بالمشروع كما هي فعلياً في لحظة الالتقاط: المخططات، الجداول، عدد الأعمدة والصفوف، المجموعات المنطقية، والمفاتيح الأجنبية. هذا الملف **جرد فقط**: لا يحتوي تحليل أمان أو أداء ولا توصيات؛ تلك موضوع الملفات التالية في §docs/db-audit/§.`);
  p(`>`);
  p(`> **تاريخ الالتقاط:** ${utc(inv.capturedAt)} (${baghdad} بتوقيت بغداد)  `);
  p(`> **المشروع:** Supabase §${inv.connection.host}§ — قاعدة §${inv.connection.database}§، الدور §${inv.server.user}§، عبر مجمّع الجلسات (منفذ ${inv.connection.port}، أي §DIRECT_URL§ في §.env.local§)  `);
  p(`> **الخادم:** ${inv.server.version.split(",")[0]}  `);
  p(`> **حجم القاعدة الكلي:** ${inv.dbSize}  `);
  p(`> **حالة المستودع وقت الالتقاط:** ${head ? `الالتزام §${head}§` : "خارج git"}${dirty === null ? "" : dirty ? ` (في الشجرة ${dirty.split("\n").length} ملف غير ملتزم)` : " (شجرة نظيفة)"}.  `);
  p(`> **مولَّد بـ** §npm run db:inventory§ (§scripts/db-audit-inventory.ts§) — أعد تشغيله لتحديث هذا الملف.`);
  p();
  p(`## كيف تقرأ هذا الملف`);
  p();
  p(`- الأسماء بين علامات الاقتباس البرمجية هي أسماء فعلية في القاعدة (§schema.table§). أعمدة جداول §public§ بصيغة camelCase لأن Prisma أنشأها هكذا.`);
  p(`- **رموز المجموعات** (مثل §CATALOG§ و§AUTH_CORE§) هي الأسماء النهائية المعتمدة؛ استعملها كما هي في الطلبات القادمة. القائمة الكاملة في القسم 4.`);
  p(`- «الصفوف» = §count(*)§ الفعلي وقت الالتقاط. «التقدير» = §n_live_tup§ من إحصاءات PostgreSQL، أُدرج للمقارنة فقط (قد يتأخر عن الواقع).`);
  p(`- «الحجم» = §pg_total_relation_size§ (البيانات + الفهارس + TOAST).`);
  p(`- عدد الأعمدة يُحسب من §pg_attribute§ (بدون الأعمدة المحذوفة ولا أعمدة النظام).`);
  p(`- المصدر الوحيد لكل رقم هنا هو كتالوج PostgreSQL (§pg_catalog§) نفسه، لا §schema.prisma§. الفرق بينهما مذكور صراحةً في القسم 6.`);
  p();

  // ---- summary -----------------------------------------------------------
  const appTableCount = Object.values(APP_GROUPS).reduce((n, g) => n + g.tables.length, 0);
  p(`## 1. الملخص`);
  p();
  p(`| البند | العدد |`);
  p(`|---|---:|`);
  p(`| مخططات (schemas) غير نظامية | ${inv.schemas.length} (منها ${inv.schemas.filter((s) => Number(s.tables) + Number(s.views) === 0).length} فارغة) |`);
  p(`| جداول | ${tables.length} |`);
  p(`| views | ${views.length} |`);
  p(`| جداول التطبيق (§public§) | ${bySchema("public").filter(isTable).length} (منها ${publicTables.length} جدول بيانات + §_prisma_migrations§) |`);
  p(`| جداول منصّة Supabase (§auth§ + §storage§ + §realtime§ + §vault§) | ${tables.length - bySchema("public").filter(isTable).length} |`);
  p(`| مفاتيح أجنبية | ${inv.foreignKeys.length} (${["public", "auth", "storage"].map((s) => `§${s}§ ${inv.foreignKeys.filter((f) => f.schema === s).length}`).join("، ")}) |`);
  p(`| قيود CHECK | ${inv.checks.length} (§public§ ${inv.checks.filter((c) => c.schema === "public").length}) |`);
  p(`| أنواع معدودة (enums) | ${inv.enums.length} (§public§ ${publicEnums.length}) |`);
  p(`| إضافات (extensions) | ${inv.extensions.length} |`);
  p(`| إجمالي الصفوف في كل الجداول | ${num(rows(tables))} |`);
  p(`| إجمالي صفوف جداول التطبيق (§public§ بدون سجل الترحيل) | ${num(rows(publicTables))} |`);
  p();
  const facts: string[] = [];
  if (pending.length) facts.push(`${pending.length === 1 ? "ترحيل واحد في المستودع" : `${pending.length} ترحيلات في المستودع`} **غير مطبَّق** على هذه القاعدة (${pending.map((m) => `§${m}§`).join("، ")})؛ السجل §_prisma_migrations§ يتوقف عند ${applied.size} بينما المجلد يحوي ${folders.length}.`);
  if (drift) {
    const parts = [
      extraColumns.length && `${extraColumns.length} أعمدة زائدة في القاعدة (${extraColumns.map((c) => `§${c.table}.${c.name}§`).join("، ")})`,
      missingColumns.length && `${missingColumns.length} أعمدة ناقصة فيها (${missingColumns.map((c) => `§${c.table}.${c.column}§`).join("، ")})`,
      extraEnums.length && `أنواع معدودة زائدة (${extraEnums.map((e) => `§${e.name}§`).join("، ")})`,
      missingEnums.length && `أنواع معدودة ناقصة (${missingEnums.map((e) => `§${e}§`).join("، ")})`,
      tablesNotInSchema.length && `جداول بلا model (${tablesNotInSchema.map((t) => `§${t}§`).join("، ")})`,
      modelsNotInDb.length && `models بلا جدول (${modelsNotInDb.map((t) => `§${t}§`).join("، ")})`,
    ].filter(Boolean);
    facts.push(`القاعدة و§schema.prisma§ مختلفان: ${parts.join("؛ ")}.`);
  }
  if (!customersFk) facts.push(`الربط بين §public.customers§ و§auth.users§ منطقي فقط (§customers.userId§ نص يحمل §auth.users.id§) بلا مفتاح أجنبي.`);
  if (ungrouped.length) facts.push(`${ungrouped.length} جدول بلا مجموعة (§UNGROUPED§): ${ungrouped.map((r) => `§${r.schema}.${r.name}§`).join("، ")} — يحتاج تعييناً في السكربت.`);
  if (facts.length) {
    p(`**حقائق تستحق الانتباه قبل أي شيء آخر** (تفصيلها في القسم 6):`);
    p();
    facts.forEach((f, i) => p(`${i + 1}. ${f}`));
  } else {
    p(`لا فرق بين القاعدة والمستودع، ولا ترحيلات معلّقة.`);
  }
  p();

  // ---- schemas -----------------------------------------------------------
  p(`## 2. المخططات (Schemas)`);
  p();
  p(`| المخطط | المالك | جداول | views | ما هو |`);
  p(`|---|---|---:|---:|---|`);
  for (const s of inv.schemas) p(`| §${s.schema}§ | §${s.owner}§ | ${s.tables} | ${s.views} | ${SCHEMA_DESC[s.schema] ?? ""} |`);
  p();
  p(`المخططات النظامية (§pg_catalog§، §information_schema§، §pg_toast§) مستثناة من كل ما يلي.`);
  p();

  // ---- tables per schema -------------------------------------------------
  const relationTable = (list: RelationRow[]) => {
    p(`| # | الجدول | المجموعة | أعمدة | صفوف | تقدير | الحجم | ملاحظة |`);
    p(`|--:|---|---|--:|--:|--:|--:|---|`);
    list.forEach((r, i) => {
      const note: string[] = [];
      if (r.kind === "p") note.push("مقسَّم (partitioned)");
      if (r.kind === "v") note.push("view");
      if (r.kind === "m") note.push("materialized view");
      if (r.kind === "f") note.push("foreign table");
      if (r.count_note) note.push(r.count_note);
      if (r.name === "_prisma_migrations") note.push("سجل ترحيلات Prisma");
      const counted = isTable(r);
      p(`| ${i + 1} | §${r.name}§ | §${groupOf(r)}§ | ${r.columns} | ${counted ? num(r.exact_rows) : "—"} | ${counted ? num(r.n_live_tup ?? r.reltuples) : "—"} | ${r.total_size} | ${note.join("؛ ")} |`);
    });
    p();
  };
  const emptyOr = (list: RelationRow[], empty: string, notEmpty: string) => (rows(list.filter(isTable)) === 0 ? empty : notEmpty);

  p(`## 3. الجداول حسب المخطط`);
  p();
  p(`### 3.1 §public§ — جداول التطبيق (${bySchema("public").length})`);
  p();
  p(`كلها من إنشاء Prisma Migrate. المفاتيح الأساسية نصّية (§cuid§) إلا ما ذُكر في الملحق ب. تعريف الأعمدة الكامل في الملحق أ.`);
  p();
  relationTable(bySchema("public"));

  const users = table("auth", "users")?.exact_rows ?? 0;
  p(`### 3.2 §auth§ — Supabase Auth (${bySchema("auth").length})`);
  p();
  p(`جداول GoTrue القياسية؛ يديرها Supabase ولا يلمسها التطبيق مباشرة (يقرأها عبر §@supabase/ssr§). المستخدمون الحاليون: ${users}${inv.identityProviders.length ? `، هوياتهم: ${inv.identityProviders.map((x) => `§${x.provider}§ (${x.n})`).join("، ")} (§auth.identities§)` : ""}.`);
  p();
  relationTable(bySchema("auth"));

  p(`### 3.3 §storage§ — Supabase Storage (${bySchema("storage").length})`);
  p();
  p(
    inv.buckets.length
      ? `الحاويات الفعلية: ${inv.buckets.map((b) => `§${b.id}§ (${b.public ? "عامة" : "خاصة"}، النوع §${b.type}§، أُنشئت ${new Date(b.created_at).toISOString().slice(0, 10)}، ${num(b.objects)} ملف)`).join("؛ ")}. أغلفة الكتب يرفعها §src/lib/cover-storage.ts§ بمفتاح service-role.`
      : `لا حاويات بعد.`,
  );
  p();
  relationTable(bySchema("storage"));

  p(`### 3.4 §realtime§ — Supabase Realtime (${bySchema("realtime").length})`);
  p();
  p(`لا يستخدمه التطبيق${emptyOr(bySchema("realtime").filter((r) => r.name !== "schema_migrations"), "؛ الجداول فارغة", "")}. §messages§ جدول مقسَّم (Supabase ينشئ أقسامه اليومية عند الحاجة).`);
  p();
  relationTable(bySchema("realtime"));

  p(`### 3.5 §vault§ — Supabase Vault (${bySchema("vault").length})`);
  p();
  p(`${emptyOr(bySchema("vault"), "لا أسرار مخزّنة.", `${num(table("vault", "secrets")?.exact_rows)} سرّ مخزّن.`)} §decrypted_secrets§ view يفكّ تشفير §secrets§ عند القراءة.`);
  p();
  relationTable(bySchema("vault"));

  p(`### 3.6 §extensions§ — views الإحصاء (${bySchema("extensions").length})`);
  p();
  p(`ليست جداول؛ واجهتا الإضافة §pg_stat_statements§ التي يفعّلها Supabase افتراضياً.`);
  p();
  relationTable(bySchema("extensions"));

  const otherSchemas = inv.schemas.filter((s) => !["public", "auth", "storage", "realtime", "vault", "extensions"].includes(s.schema));
  p(`### 3.7 مخططات أخرى`);
  p();
  for (const s of otherSchemas) {
    if (Number(s.tables) + Number(s.views) === 0) continue;
    p(`#### §${s.schema}§ (${bySchema(s.schema).length})`);
    p();
    relationTable(bySchema(s.schema));
  }
  const emptySchemas = otherSchemas.filter((s) => Number(s.tables) + Number(s.views) === 0);
  if (emptySchemas.length) p(`${emptySchemas.map((s) => `§${s.schema}§`).join("، ")} — موجودة بلا أي جدول أو view.`);
  p();

  // ---- groups ------------------------------------------------------------
  p(`## 4. المجموعات المنطقية — الأسماء النهائية`);
  p();
  p(`التصنيف حسب **الغرض** لا حسب المخطط، لذا مجموعة واحدة (§MIGRATIONS§) تعبر أربعة مخططات. كل جدول ينتمي إلى مجموعة واحدة بالضبط. الرموز الإنكليزية هي المرجع؛ العربية للقراءة.`);
  p();
  p(`### 4.1 القائمة`);
  p();
  p(`| الرمز | الاسم | المخطط | الجداول | العدد | الصفوف |`);
  p(`|---|---|---|---|--:|--:|`);
  let grouped = 0;
  const groupRow = (code: string, ar: string, schemaName: string | null, list: RelationRow[]) => {
    p(`| §${code}§ | ${ar} | ${schemaName ? `§${schemaName}§` : "متعدد"} | ${list.map((t) => `§${schemaName ? "" : t.schema + "."}${t.name}§`).join("، ")} | ${list.length} | ${num(rows(list))} |`);
    grouped += list.length;
  };
  const named = (schemaName: string, names: string[]) => names.map((n) => table(schemaName, n)).filter((r): r is RelationRow => !!r);
  for (const [code, g] of Object.entries(APP_GROUPS)) groupRow(code, g.ar, "public", named("public", g.tables));
  for (const [code, g] of Object.entries(AUTH_GROUPS)) groupRow(code, g.ar, "auth", named("auth", g.tables));
  for (const [schemaName, g] of Object.entries(SCHEMA_GROUPS)) groupRow(g.code, g.ar, schemaName, bySchema(schemaName).filter((r) => isTable(r) && groupOf(r) === g.code));
  groupRow("MIGRATIONS", "سجلات الترحيل", null, tables.filter((r) => groupOf(r) === "MIGRATIONS"));
  if (ungrouped.length) groupRow("UNGROUPED", "بلا مجموعة بعد", null, ungrouped);
  p(`| §STATS_VIEWS§ | views الإحصاء | §extensions§ | ${bySchema("extensions").map((r) => `§${r.name}§`).join("، ")} | ${bySchema("extensions").length} views | — |`);
  p();
  const authCount = Object.values(AUTH_GROUPS).reduce((n, g) => n + g.tables.length, 0);
  p(`المجموع: ${grouped} جدولاً = كل جداول القاعدة (${tables.length}). §AUTH§ وحدها اسم جامع للمجموعات الأربع §AUTH_*§ (${authCount} جدولاً)؛ و§APP§ اسم جامع لمجموعات §public§ السبع (${appTableCount} جدولاً بدون سجل الترحيل).`);
  p();

  const empty = (schemaName: string, names: string[]) => rowsOf(schemaName, names) === 0;
  const settingsHome = inv.settingsKeys.filter((k) => k.startsWith("home.")).length;
  const settingsNotify = inv.settingsKeys.filter((k) => k.startsWith("notify")).length;

  p(`### 4.2 وصف كل مجموعة`);
  p();
  p(`#### §CATALOG§ — الكتالوج`);
  p(`كتالوجان متوازيان بشجرتي تصنيف مستقلتين: **الكتب المدرسية** (§categories§ ← §books§) و**الملازم** (§handout_categories§ ← §handouts§)، يتشاركان جدولي البحث §authors§ و§publishers§. الشجرتان ذاتيتا الإحالة (§parentId§ → نفس الجدول). §authors.subjectId§ يشير إلى §categories§ (مادة المدرّس). §books§ و§handouts§ نسختان متطابقتان بنية${extraColumns.some((c) => c.table === "books" || c.table === "handouts") ? "؛ انظر القسم 6 عن أعمدة زائدة فيهما" : ""}.`);
  p();
  p(`#### §CUSTOMERS§ — العملاء والعناوين`);
  const userIdType = inv.columns.find((c) => c.schema === "public" && c.table === "customers" && c.name === "userId")?.type ?? "?";
  p(`§customers§ هو الملف الشخصي داخل التطبيق (اسم، بريد، هاتف، دور §customer|admin§، حالة §active|blocked§، تفضيلات النشرة)؛ §customers.userId§ (§${userIdType}§) يحمل معرّف §auth.users§ — الربط الوحيد بين التطبيق و§AUTH_CORE§${customersFk ? `، بمفتاح أجنبي §${customersFk.name}§ (عند الحذف ${customersFk.on_delete})` : "، وهو بلا FK"}. حالياً ${inv.customers.total} عميل، منهم ${inv.customers.withUserId} مربوط بحساب §auth.users§ (§userId§ غير فارغ). §addresses§ دفتر عناوين متعدد لكل عميل، يُحذف معه (§CASCADE§).`);
  p();
  p(`#### §ORDERS§ — الطلبات`);
  p(`§orders§ رأس الطلب مع لقطة عنوان الشحن ومبالغ بالدينار الصحيح (§subtotal/shippingCost/discount/total§) وطريقة الدفع (§cod|card|wallet§) كعمود، **لا جدول مدفوعات مستقل**. سطور الطلب في جدولين حسب نوع المنتج: §order_items§ (كتب) و§handout_order_items§ (ملازم)، وكلاهما يخزّن §unitPrice§ وقت الطلب. §order_events§ الخط الزمني لحالة الطلب. حذف الطلب يحذف سطوره وأحداثه؛ حذف العميل ممنوع ما دام له طلب (§RESTRICT§).`);
  p();
  p(`#### §REVIEWS§ — المراجعات`);
  p(`§reviews§ للكتب و§handout_reviews§ للملازم، بنية واحدة: تقييم + عنوان + نص + حالة اعتدال (§pending|published|rejected§)، وقيد فريد (منتج، عميل). §rating§ و§reviewsCount§ على المنتج قيمتان مشتقّتان (denormalised) يعيد التطبيق حسابهما.`);
  p();
  p(`#### §CART_WISHLIST§ — السلة والمفضلة`);
  p(`أربعة جداول ربط بمفتاح مركّب (عميل، منتج): §cart_items§/§wishlist_items§ للكتب و§handout_cart_items§/§handout_wishlist_items§ للملازم. تُحذف مع العميل أو المنتج (§CASCADE§ من الجهتين).${empty("public", APP_GROUPS.CART_WISHLIST.tables) ? " كلها فارغة حالياً." : ""}`);
  p();
  p(`#### §MARKETING§ — التسويق والتواصل`);
  p(`§coupons§ (رمز، نوع §percentage|fixed§، قيمة، حد أدنى، حد استخدام)، §newsletter_subscribers§ (البريد هو المفتاح الأساسي)، و§contact_messages§ (صندوق وارد نموذج «اتصل بنا» بحالة §new|read§). لا مفاتيح أجنبية داخل هذه المجموعة ولا منها.`);
  p();
  p(`#### §SETTINGS§ — الإعدادات`);
  p(`§store_settings§ مخزن مفتاح/قيمة نصّي. المفاتيح الحالية (${inv.settingsKeys.length}): ${inv.settingsKeys.map((k) => `§${k}§`).join("، ")}${settingsHome || settingsNotify ? ` — ${settingsHome} منها محتوى أقسام الصفحة الرئيسية (§home.*§، JSON مسلسل) و${settingsNotify} تفضيلات إشعارات الإدارة (§notify*§)` : ""}.`);
  p();
  p(`#### §AUTH_CORE§ — الهوية والجلسات (Supabase)`);
  p(`§users§ الحساب نفسه (${table("auth", "users")?.columns ?? "?"} عموداً، بينها البريد والهاتف وبياناتهما الوصفية)، §identities§ ربط الحساب بمزوّد${inv.identityProviders.length ? ` (الحالي: ${inv.identityProviders.map((x) => `§${x.provider}§`).join("، ")})` : ""}، §sessions§ + §refresh_tokens§ + §mfa_amr_claims§ ثلاثية الجلسة، §one_time_tokens§ رموز التأكيد/الاستعادة، §flow_state§ حالة تدفّق PKCE، §audit_log_entries§ سجل تدقيق Auth${table("auth", "audit_log_entries")?.exact_rows === 0 ? " (فارغ)" : ""}، §instances§ بقايا تعدد المستأجرين. لا يوجد جدول سجلّات (logs) خاص بالتطبيق؛ الأقرب إلى ذلك §audit_log_entries§ هنا و§order_events§ في §ORDERS§.`);
  p();
  p(`#### §AUTH_MFA§ — التحقق متعدد العوامل (Supabase)`);
  p(`عوامل TOTP/هاتف/WebAuthn وتحدياتها ورموز الاستعادة.${empty("auth", AUTH_GROUPS.AUTH_MFA.tables) ? " كلها فارغة: لم يفعَّل MFA." : ""}`);
  p();
  p(`#### §AUTH_OAUTH§ — خادم OAuth ومزوّدوه (Supabase)`);
  p(`جداول Supabase Auth كـ**خادم** OAuth (عملاء، تفويضات، موافقات) و§custom_oauth_providers§ لمزوّدين مخصّصين.${empty("auth", AUTH_GROUPS.AUTH_OAUTH.tables) ? " كلها فارغة؛" : ""} تسجيل الدخول بمزوّد خارجي (Google) لا يمرّ من هنا بل من §identities§.`);
  p();
  p(`#### §AUTH_SSO§ — SSO / SAML / SCIM (Supabase)`);
  p(`تسجيل الدخول المؤسسي.${empty("auth", AUTH_GROUPS.AUTH_SSO.tables) ? " كلها فارغة." : ""}`);
  p();
  p(`#### §STORAGE§ — تخزين الملفات (Supabase)`);
  p(`§buckets§ + §objects§ هما المستخدمان${inv.buckets.length ? ` (${inv.buckets.map((b) => `حاوية §${b.id}§: ${num(b.objects)} ملف`).join("، ")})` : ""}. §buckets_analytics§/§buckets_vectors§/§vector_indexes§ أنواع حاويات أحدث، و§s3_multipart_uploads(_parts)§ لرفع S3 المجزّأ${empty("storage", ["buckets_analytics", "buckets_vectors", "vector_indexes", "s3_multipart_uploads", "s3_multipart_uploads_parts"]) ? " — كلها فارغة" : ""}. FKs المخطط داخلية فقط؛ §objects.owner§ لا يشير بـFK إلى §auth.users§.`);
  p();
  p(`#### §REALTIME§ / §VAULT§ / §STATS_VIEWS§`);
  p(`بنية Supabase الافتراضية، غير مستخدمة من التطبيق${empty("realtime", ["messages", "subscription"]) && empty("vault", ["secrets"]) ? "، وفارغة" : ""}.`);
  p();
  p(`#### §MIGRATIONS§ — سجلات الترحيل`);
  p(`أربعة دفاتر مستقلة: §public._prisma_migrations§ (${num(table("public", "_prisma_migrations")?.exact_rows)} صفاً — يخصّ التطبيق، الملحق هـ)، و§auth.schema_migrations§ (${num(table("auth", "schema_migrations")?.exact_rows)})، §realtime.schema_migrations§ (${num(table("realtime", "schema_migrations")?.exact_rows)})، §storage.migrations§ (${num(table("storage", "migrations")?.exact_rows)}) تخصّ خدمات Supabase.`);
  p();

  // ---- foreign keys ------------------------------------------------------
  const crossSchema = inv.foreignKeys.filter((f) => f.schema !== f.ref_schema);
  p(`## 5. المفاتيح الأجنبية (كما هي في القاعدة الآن)`);
  p();
  p(`${inv.foreignKeys.length} قيداً من §pg_constraint§ (§contype = 'f'§)، ${inv.foreignKeys.every((f) => f.validated) ? "كلها **مُتحقَّق منها** (§validated§)" : `${inv.foreignKeys.filter((f) => !f.validated).length} منها غير متحقَّق منها`}${inv.foreignKeys.some((f) => f.deferrable) ? "" : " وغير مؤجَّلة"}. ${crossSchema.length ? `${crossSchema.length} منها يعبر بين مخططين.` : "لا يوجد أي FK يعبر بين مخططين."}`);
  p();
  const fkTable = (schemaName: string) => {
    const fks = inv.foreignKeys.filter((f) => f.schema === schemaName);
    p(`### 5.${["public", "auth", "storage"].indexOf(schemaName) + 1} §${schemaName}§ (${fks.length})`);
    p();
    p(`| # | من | إلى | عند الحذف | عند التحديث | اسم القيد |`);
    p(`|--:|---|---|---|---|---|`);
    fks.forEach((f, i) =>
      p(`| ${i + 1} | §${f.table}(${f.columns.join(", ")})§ | §${f.ref_schema === schemaName ? "" : f.ref_schema + "."}${f.ref_table}(${f.ref_columns.join(", ")})§ | ${f.on_delete} | ${f.on_update} | §${f.name}§ |`),
    );
    p();
    return fks;
  };
  const publicFks = fkTable("public");
  const tally = (action: string) => publicFks.filter((f) => f.on_delete === action).length;
  p(`ملخّص سلوك الحذف في §public§: §CASCADE§ ${tally("CASCADE")}، §RESTRICT§ ${tally("RESTRICT")}، §SET NULL§ ${tally("SET NULL")}، §NO ACTION§ ${tally("NO ACTION")}. ${publicFks.every((f) => f.on_update === "CASCADE") ? "كل FKs §public§ تحدّث بـ§CASCADE§ — هذا افتراض Prisma." : ""}`);
  p();
  fkTable("auth");
  fkTable("storage");
  const otherFks = inv.foreignKeys.filter((f) => !["public", "auth", "storage"].includes(f.schema));
  if (otherFks.length) {
    p(`### 5.4 مخططات أخرى (${otherFks.length})`);
    p();
    for (const f of otherFks) p(`- §${f.schema}.${f.table}(${f.columns.join(", ")})§ → §${f.ref_schema}.${f.ref_table}(${f.ref_columns.join(", ")})§ (§${f.name}§)`);
    p();
  }
  p(`### ${otherFks.length ? "5.5" : "5.4"} روابط منطقية بلا مفتاح أجنبي`);
  p();
  p(`مذكورة هنا لأنها ستُقرأ لاحقاً كعلاقات رغم غياب القيد:`);
  p();
  p(`| من | إلى | الحقيقة |`);
  p(`|---|---|---|`);
  if (!customersFk) p(`| §public.customers.userId§ (text، nullable، unique) | §auth.users.id§ (uuid) | الربط الوحيد بين التطبيق وAuth؛ نوعا العمودين مختلفان (نص مقابل uuid) |`);
  p(`| §public.books.coverUrl§ / §public.handouts.coverUrl§ | §storage.objects§ | رابط URL عام نصّي، لا مرجع لصفّ الملف |`);
  p(`| §storage.objects.owner§ / §owner_id§ | §auth.users.id§ | تصميم Supabase القياسي بلا FK |`);
  p();

  // ---- drift -------------------------------------------------------------
  p(`## 6. الفرق بين القاعدة والمستودع (حقائق فقط)`);
  p();
  p(`### 6.1 الترحيلات`);
  p();
  p(`| | المستودع (§prisma/migrations/§) | القاعدة (§public._prisma_migrations§) |`);
  p(`|---|---|---|`);
  p(`| عدد الترحيلات | ${folders.length} | ${applied.size} |`);
  const lastApplied = inv.prismaMigrations.filter((m) => applied.has(m.migration_name)).at(-1);
  p(`| آخر ترحيل | §${folders.at(-1) ?? "—"}§ | ${lastApplied ? `§${lastApplied.migration_name}§ (اكتمل ${utc(lastApplied.finished_at!)})` : "—"} |`);
  p();
  if (pending.length) {
    p(`**غير مطبَّق على القاعدة:** ${pending.map((m) => `§${m}§`).join("، ")}.${orphanLedger.length ? ` وفي السجل ترحيلات لا مجلد لها في المستودع: ${orphanLedger.map((m) => `§${m}§`).join("، ")}.` : ""} §schema.prisma§ يصف حالة ما بعد كل الترحيلات في المجلد، فالعميل المولَّد قد لا يطابق القاعدة — وهذا ما يفصّله القسم 6.2.`);
  } else if (orphanLedger.length) {
    p(`كل مجلدات الترحيل مطبَّقة، لكن في السجل ترحيلات لا مجلد لها في المستودع: ${orphanLedger.map((m) => `§${m}§`).join("، ")}.`);
  } else {
    p(`كل الترحيلات مطبَّقة والسجل يطابق المجلد.`);
  }
  p();
  p(`### 6.2 الأعمدة والأنواع`);
  p();
  if (!drift) {
    p(`أعمدة جداول §public§ وأنواعها المعدودة تطابق §schema.prisma§ تماماً.`);
    p();
  } else {
    if (extraColumns.length) {
      p(`**أعمدة موجودة في القاعدة وغائبة عن §schema.prisma§** (${extraColumns.length}):`);
      p();
      p(`| الجدول | العمود | النوع في القاعدة | القيد |`);
      p(`|---|---|---|---|`);
      for (const c of extraColumns) p(`| §${c.table}§ | §${c.name}§ | §${c.type}§ | ${c.note} |`);
      p();
    }
    if (missingColumns.length) {
      p(`**أعمدة في §schema.prisma§ لا وجود لها في القاعدة** (${missingColumns.length}): ${missingColumns.map((c) => `§${c.table}.${c.column}§`).join("، ")}.`);
      p();
    }
    if (extraEnums.length) p(`**أنواع معدودة في القاعدة وغائبة عن §schema.prisma§:** ${extraEnums.map((e) => `§${e.name}§ (${e.labels.map((l) => `§${l}§`).join("، ")})`).join("؛ ")}.`);
    if (missingEnums.length) p(`**أنواع معدودة في §schema.prisma§ لا وجود لها في القاعدة:** ${missingEnums.map((e) => `§${e}§`).join("، ")}.`);
    if (tablesNotInSchema.length) p(`**جداول في §public§ بلا model في §schema.prisma§:** ${tablesNotInSchema.map((t) => `§${t}§`).join("، ")}.`);
    if (modelsNotInDb.length) p(`**models في §schema.prisma§ بلا جدول في القاعدة:** ${modelsNotInDb.map((t) => `§${t}§`).join("، ")}.`);
    if (extraEnums.length || missingEnums.length || tablesNotInSchema.length || modelsNotInDb.length) p();
    if (extraColumns.length) {
      p(`عدد الأعمدة في القسم 3.1 هو الفعلي في القاعدة (مثلاً §${extraColumns[0].table}§ = ${table("public", extraColumns[0].table)?.columns} في القاعدة مقابل ${schemaTables.get(extraColumns[0].table)?.length} في §schema.prisma§).`);
      p();
    }
    if (blockedTables.length) {
      p(`**نتيجة مباشرة** (تُذكر لأنها تشغيلية لا تحليلية): ${extraColumns.filter((c) => c.blocksInsert).map((c) => `§${c.table}.${c.name}§`).join("، ")} أعمدة §NOT NULL§ بلا قيمة افتراضية لا يعرفها عميل Prisma، فأي §INSERT§ يصدره التطبيق على ${blockedTables.map((t) => `§${t}§`).join(" أو ")} يفشل بخطأ NOT NULL (Prisma §P2011§) حتى تُطبَّق الترحيلات المعلّقة. القراءة والتحديث والحذف لا تتأثر.`);
      p();
    }
  }
  p(`### 6.3 ما لا يُعدّ فرقاً`);
  p();
  p(`- الأعمدة من نوع مصفوفة (§tags "BookTag"[]§) nullable في القاعدة رغم أنها §BookTag[] @default([])§ في Prisma — سلوك Prisma المعتاد مع المصفوفات.`);
  p(`- ترتيب §attnum§ في الملحق أ فيه فجوات — آثار أعمدة حُذفت في ترحيلات سابقة، طبيعي في PostgreSQL.`);
  p();

  // ---- appendix A: public columns ----------------------------------------
  const extraSet = new Set(extraColumns.map((c) => `${c.table}.${c.name}`));
  const pkOf = new Map(inv.primaryKeys.filter((k) => k.schema === "public").map((k) => [k.table, k.columns]));
  p(`## الملحق أ — أعمدة جداول §public§ (التعريف الحي)`);
  p();
  p(`مأخوذ من §pg_attribute§ وقت الالتقاط${extraColumns.length ? "؛ الأعمدة الزائدة عن §schema.prisma§ (القسم 6.2) معلَّمة بـ ⚠" : ""}. 🔑 = مفتاح أساسي. §timestamp(3)§ = بلا منطقة زمنية.`);
  p();
  for (const r of bySchema("public").filter(isTable)) {
    const list = inv.columns.filter((c) => c.schema === "public" && c.table === r.name);
    p(`### §${r.name}§ — ${list.length} عموداً، ${num(r.exact_rows)} صف، مجموعة §${groupOf(r)}§`);
    p();
    p(`| # | العمود | النوع | null | الافتراضي |`);
    p(`|--:|---|---|---|---|`);
    for (const c of list) {
      const marks = `${pkOf.get(r.name)?.includes(c.name) ? " 🔑" : ""}${extraSet.has(`${r.name}.${c.name}`) ? " ⚠" : ""}`;
      const def = c.default ? `§${c.default.replace(/::"?[A-Za-z]+"?(\[\])?$/, "")}§` : "";
      p(`| ${c.position} | §${c.name}§${marks} | §${c.type.replace(" without time zone", "")}§ | ${c.not_null ? "لا" : "نعم"} | ${def} |`);
    }
    p();
  }

  // ---- appendix B: primary keys ------------------------------------------
  p(`## الملحق ب — المفاتيح الأساسية وقيود CHECK في §public§`);
  p();
  p(`### المفاتيح الأساسية`);
  p();
  p(`| الجدول | الأعمدة | النوع |`);
  p(`|---|---|---|`);
  for (const k of inv.primaryKeys.filter((k) => k.schema === "public")) {
    const kind =
      k.columns.length > 1 ? "مركّب (جدول ربط)" : k.columns[0] === "id" ? (k.table === "_prisma_migrations" ? "§varchar(36)§" : "§cuid§ نصّي") : `طبيعي (§${k.columns[0]}§)`;
    p(`| §${k.table}§ | ${k.columns.map((c) => `§${c}§`).join("، ")} | ${kind} |`);
  }
  p();
  const publicChecks = inv.checks.filter((c) => c.schema === "public");
  const otherChecks = inv.checks.filter((c) => c.schema !== "public");
  p(`### قيود CHECK (${publicChecks.length})`);
  p();
  if (publicChecks.length) {
    p(`Prisma لا يعبّر عن قيد CHECK في §schema.prisma§؛ هذه كُتبت يدوياً في ملفات الترحيل، والمصدر هنا هو §pg_constraint§ لا المخطط.`);
    p();
    p(`| الجدول | القيد | التعريف |`);
    p(`|---|---|---|`);
    for (const c of publicChecks) p(`| §${c.table}§ | §${c.name}§ | §${c.definition}§ |`);
  } else {
    p(`لا قيود CHECK في §public§.`);
  }
  if (otherChecks.length) {
    p();
    const bySchema = [...new Set(otherChecks.map((c) => c.schema))].map((sch) => `§${sch}§ ${otherChecks.filter((c) => c.schema === sch).length}`);
    p(`خارج §public§ توجد ${otherChecks.length} قيود CHECK تخصّ خدمات Supabase (${bySchema.join("، ")})، غير مدرجة هنا.`);
  }
  p();

  // ---- appendix C: enums -------------------------------------------------
  p(`## الملحق ج — الأنواع المعدودة (Enums)`);
  p();
  p(`| المخطط | النوع | القيم | ملاحظة |`);
  p(`|---|---|---|---|`);
  for (const e of inv.enums) p(`| §${e.schema}§ | §${e.name}§ | ${e.labels.map((l) => `§${l}§`).join("، ")} | ${extraEnums.includes(e) ? "⚠ غائب عن §schema.prisma§ (القسم 6.2)" : ""} |`);
  p();

  // ---- appendix D: extensions --------------------------------------------
  p(`## الملحق د — الإضافات (Extensions)`);
  p();
  p(`| الإضافة | الإصدار | المخطط |`);
  p(`|---|---|---|`);
  for (const e of inv.extensions) p(`| §${e.name}§ | ${e.version} | §${e.schema}§ |`);
  p();

  // ---- appendix E: migration ledger --------------------------------------
  p(`## الملحق هـ — سجل ترحيلات Prisma كما في القاعدة`);
  p();
  p(`| # | الترحيل | اكتمل (UTC) | خطوات | تراجُع |`);
  p(`|--:|---|---|--:|---|`);
  inv.prismaMigrations.forEach((m, i) =>
    p(`| ${i + 1} | §${m.migration_name}§ | ${m.finished_at ? utc(m.finished_at).replace(" UTC", "") : "**لم يكتمل**"} | ${m.applied_steps_count} | ${m.rolled_back_at ? utc(m.rolled_back_at) : "—"} |`),
  );
  pending.forEach((m, i) => p(`| ${inv.prismaMigrations.length + i + 1} | §${m}§ | **غير مطبَّق** | — | — |`));
  p();

  // ---- appendix F: method ------------------------------------------------
  p(`## الملحق و — طريقة الالتقاط (لإعادة الجرد لاحقاً)`);
  p();
  p(`- §npm run db:inventory§ يعيد كتابة هذا الملف كاملاً؛ §-- --json <ملف>§ يحفظ الالتقاط الخام أيضاً. السكربت: §scripts/db-audit-inventory.ts§.`);
  p(`- الاتصال: حزمة §pg§ الموجودة في المشروع مع §DIRECT_URL§ من §.env.local§ (مجمّع الجلسات، منفذ 5432، SSL). لا يحتاج §psql§.`);
  p(`- كل الاستعلامات قراءة فقط على §pg_catalog§:`);
  p(`  - المخططات: §pg_namespace§ مع استثناء §pg_catalog§/§information_schema§/§pg_toast§ و§pg_temp_*§.`);
  p(`  - الجداول: §pg_class§ (§relkind in ('r','p','v','m','f')§) + §pg_stat_all_tables.n_live_tup§ + §pg_total_relation_size§ + §has_table_privilege§.`);
  p(`  - الصفوف الفعلية: §select count(*)§ لكل جدول مقروء يقدَّر بأقل من مليونَي صف.`);
  p(`  - الأعمدة: §pg_attribute§ (§attnum > 0 and not attisdropped§) + §format_type§ + §pg_attrdef§؛ الفهارس: §pg_indexes§.`);
  p(`  - المفاتيح والقيود: §pg_constraint§ (§contype = 'f'§ و§'p'§ و§'c'§) مع §confdeltype§/§confupdtype§ و§pg_get_constraintdef§.`);
  p(`  - الأنواع: §pg_type§ + §pg_enum§؛ الإضافات: §pg_extension§.`);
  p(`- الفرق في القسم 6: مجلدات §prisma/migrations/§ مقابل §_prisma_migrations§، وأعمدة/أنواع §public§ مقابل قراءة مبسّطة لـ§schema.prisma§ (models و§@@map§ و§@map§؛ حقول العلاقات ليست أعمدة).`);
  p(`- المجموعات معرَّفة في أعلى السكربت؛ جدول جديد لا يُعيَّن هناك يظهر تحت §UNGROUPED§ مع تحذير على الطرفية.`);
  p(`- **السكربت لا يغيّر شيئاً في القاعدة.**`);
  p();

  // Backticks are written as § above because the lines are template literals.
  return L.join("\n").replace(/§/g, "`") + "\n";
}

// ---------------------------------------------------------------------------

async function main() {
  const inv = await capture();
  const schema = parsePrismaSchema(readFileSync(SCHEMA_FILE, "utf8"));
  const markdown = render(inv, schema, migrationFolders());

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, markdown, "utf8");
  console.log(`wrote ${path.relative(ROOT, OUT)} — ${inv.relations.filter(isTable).length} tables, ${inv.foreignKeys.length} foreign keys`);

  if (JSON_OUT) {
    writeFileSync(JSON_OUT, JSON.stringify(inv, null, 2), "utf8");
    console.log(`wrote ${JSON_OUT}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
