import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const sql = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(join(migrationsDir, file), "utf8"))
  .join("\n\n");

const requiredTables = [
  "organizations",
  "profiles",
  "business_settings",
  "customers",
  "conversations",
  "messages",
  "products",
  "services",
  "appointments",
  "payments",
  "ai_knowledge_base",
  "human_handoffs",
];

const tenantScopedTables = requiredTables.filter(
  (table) => table !== "organizations" && table !== "profiles",
);

const requiredFunctions = [
  "current_user_organization_id",
  "current_user_role",
  "is_member_of_organization",
  "has_organization_role",
];

const failures = [];
const requiredBusinessSettingsColumns = [
  "business_name",
  "industry",
  "business_description",
  "address",
  "business_hours",
  "tone_of_voice",
  "default_language",
  "important_rules",
  "welcome_message",
  "human_handoff_message",
  "cancellation_policy",
  "instagram_url",
  "google_maps_url",
  "whatsapp_phone_number_id",
];

const requiredProductColumns = [
  "category",
  "stock_quantity",
  "status",
];

const requiredServiceColumns = [
  "category",
  "duration_minutes",
  "status",
];

const requiredKnowledgeBaseColumns = [
  "category",
  "priority",
  "status",
];

function expect(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function tableBlock(table) {
  const match = sql.match(
    new RegExp(`create table if not exists public\\.${table} \\(([\\s\\S]*?)\\n\\);`, "i"),
  );

  return match?.[1] ?? "";
}

function hasColumn(table, column) {
  const block = tableBlock(table);

  return (
    new RegExp(`\\b${column}\\b`, "i").test(block) ||
    new RegExp(`add column if not exists ${column}\\b`, "i").test(sql)
  );
}

for (const table of requiredTables) {
  const block = tableBlock(table);

  expect(Boolean(block), `Missing table public.${table}`);
  expect(
    sql.includes(`alter table public.${table} enable row level security;`),
    `Missing RLS enable for public.${table}`,
  );
  expect(
    sql.includes(`alter table public.${table} force row level security;`),
    `Missing RLS force for public.${table}`,
  );
  expect(
    new RegExp(`create policy [\\s\\S]+?on public\\.${table}`, "i").test(sql),
    `Missing at least one policy for public.${table}`,
  );
}

for (const table of tenantScopedTables) {
  const block = tableBlock(table);

  expect(
    /organization_id uuid not null/i.test(block),
    `public.${table} must have organization_id uuid not null`,
  );
  expect(
    /unique \(organization_id, id\)/i.test(block),
    `public.${table} must have unique (organization_id, id) for composite tenant FKs`,
  );
}

expect(
  /user_id uuid not null unique/i.test(tableBlock("profiles")),
  "profiles.user_id must be unique so each user belongs to one organization",
);

for (const column of requiredBusinessSettingsColumns) {
  expect(
    hasColumn("business_settings", column),
    `business_settings must include ${column}`,
  );
}

for (const column of requiredProductColumns) {
  expect(hasColumn("products", column), `products must include ${column}`);
}

for (const column of requiredServiceColumns) {
  expect(hasColumn("services", column), `services must include ${column}`);
}

for (const column of requiredKnowledgeBaseColumns) {
  expect(
    hasColumn("ai_knowledge_base", column),
    `ai_knowledge_base must include ${column}`,
  );
}

expect(
  /ai_knowledge_base_priority_check/i.test(sql),
  "ai_knowledge_base must constrain priority",
);

expect(
  /ai_knowledge_base_(insert|update|delete)_owner_same_org/i.test(sql) &&
    /array\['owner'\]::public\.profile_role\[\]/i.test(sql),
  "ai_knowledge_base writes must be restricted to owner policies",
);

expect(
  /business_settings_whatsapp_phone_number_unique_idx/i.test(sql),
  "business_settings.whatsapp_phone_number_id must be unique to prevent webhook tenant ambiguity",
);

expect(
  /payments_organization_mercadopago_idempotency_unique_idx/i.test(sql),
  "payments must enforce Mercado Pago idempotency per organization",
);

for (const fn of requiredFunctions) {
  expect(
    sql.includes(`function public.${fn}`),
    `Missing helper function public.${fn}`,
  );
  expect(
    new RegExp(`grant execute on function public\\.${fn}`, "i").test(sql),
    `Missing execute grant for public.${fn}`,
  );
}

expect(
  (sql.match(/foreign key \(organization_id,/gi) ?? []).length >= 8,
  "Expected composite foreign keys using organization_id to prevent cross-tenant references",
);

expect(
  sql.includes("revoke all on all tables in schema public from anon;"),
  "Anon role must not receive table access",
);

if (failures.length > 0) {
  console.error("Tenant schema verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Tenant schema verification passed.");
