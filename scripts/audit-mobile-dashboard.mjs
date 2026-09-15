import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  authenticateValidationUser,
  createSupabaseClient,
  waitForProfile,
} from "./lib/auth-client.mjs";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  const content = readFileSync(envPath, "utf8");
  const env = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key] = rest.join("=").trim();
  }

  return env;
}

function startOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

function extractError(error) {
  if (!error) return null;
  return {
    message: error.message ?? String(error),
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    status: error.status ?? error.statusCode ?? null,
  };
}

async function probeTable(supabase, table) {
  const startedAt = Date.now();
  const { data, error, status } = await supabase.from(table).select("id").limit(0);
  return {
    table,
    durationMs: Date.now() - startedAt,
    exists: !error || !String(error.message).toLowerCase().includes("could not find the table"),
    httpStatus: status ?? (error ? 404 : 200),
    rowCount: data?.length ?? 0,
    error: extractError(error),
  };
}

async function runQuery(supabase, input) {
  const startedAt = Date.now();
  const result = await input.execute(supabase);
  const durationMs = Date.now() - startedAt;

  return {
    query: input.name,
    table: input.table,
    filters: input.filters,
    durationMs,
    rowCount: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0,
    error: extractError(result.error),
    success: !result.error,
  };
}

async function main() {
  const env = loadEnv();
  const supabase = createSupabaseClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  const stamp = Date.now();
  const report = {
    auth: {},
    schema: [],
    queries: [],
    rootCause: null,
  };

  console.log("=== Auditoria Dashboard Mobile ===\n");

  console.log("1. Schema — tabelas necessárias (anon)");
  for (const table of [
    "profiles",
    "sales",
    "products",
    "remote_commands",
    "automation_logs",
    "desktop_agents",
    "automation_rules",
  ]) {
    const probe = await probeTable(supabase, table);
    report.schema.push(probe);
    console.log(
      `  ${probe.exists ? "OK" : "FALHA"} ${table} — ${probe.durationMs}ms — HTTP ${probe.httpStatus}${
        probe.error ? ` — ${probe.error.message}` : ""
      }`
    );
  }

  console.log("\n2. Autenticação");
  const auth = await authenticateValidationUser(supabase, stamp, env);
  const session = auth.session ?? (await supabase.auth.getSession()).data.session;
  const user = session?.user ?? null;

  report.auth = {
    authenticated: Boolean(user),
    userId: user?.id ?? null,
    email: user?.email ?? null,
    sessionExpiresAt: session?.expires_at ?? null,
    accessTokenPresent: Boolean(session?.access_token),
    mode: auth.mode,
  };

  console.log(`  Usuário autenticado: ${report.auth.authenticated ? "sim" : "não"}`);
  console.log(`  user_id: ${report.auth.userId ?? "—"}`);
  console.log(`  JWT presente: ${report.auth.accessTokenPresent ? "sim" : "não"}`);
  console.log(
    `  Sessão expira: ${
      report.auth.sessionExpiresAt
        ? new Date(report.auth.sessionExpiresAt * 1000).toISOString()
        : "—"
    }`
  );

  if (!user) {
    report.rootCause = "Sessão Supabase ausente após autenticação.";
    printSummary(report);
    process.exit(1);
  }

  console.log("\n3. Perfil / organização");
  const profile = await waitForProfile(supabase);
  report.auth.organizationId = profile.organization_id;
  report.auth.profileLoaded = Boolean(profile);

  console.log(`  Perfil carregado: sim`);
  console.log(`  organization_id: ${profile.organization_id}`);
  console.log(`  role: ${profile.role}`);

  const organizationId = profile.organization_id;
  const todayIso = startOfTodayIso();

  console.log("\n4. Consultas do Dashboard (autenticado)");
  const queries = [
    {
      name: "revenueToday",
      table: "sales",
      filters: {
        organization_id: organizationId,
        status: "completed",
        created_at_gte: todayIso,
      },
      execute: (client) =>
        client
          .from("sales")
          .select("id, total, created_at, status")
          .eq("organization_id", organizationId)
          .eq("status", "completed")
          .gte("created_at", todayIso),
    },
    {
      name: "criticalStock",
      table: "products",
      filters: {
        organization_id: organizationId,
        status: "active",
      },
      execute: (client) =>
        client
          .from("products")
          .select("id, name, stock, status")
          .eq("organization_id", organizationId)
          .eq("status", "active"),
    },
    {
      name: "openOrders",
      table: "remote_commands",
      filters: {
        organization_id: organizationId,
        status: ["pending", "processing"],
      },
      execute: (client) =>
        client
          .from("remote_commands")
          .select("id, status, created_at, command")
          .eq("organization_id", organizationId)
          .in("status", ["pending", "processing"]),
    },
    {
      name: "automationsToday",
      table: "automation_logs",
      filters: {
        organization_id: organizationId,
        created_at_gte: todayIso,
      },
      execute: (client) =>
        client
          .from("automation_logs")
          .select("id, created_at, status")
          .eq("organization_id", organizationId)
          .gte("created_at", todayIso),
    },
    {
      name: "desktopAgents",
      table: "desktop_agents",
      filters: {
        organization_id: organizationId,
      },
      execute: (client) =>
        client
          .from("desktop_agents")
          .select("*")
          .eq("organization_id", organizationId)
          .order("last_seen_at", { ascending: false }),
    },
  ];

  for (const query of queries) {
    const result = await runQuery(supabase, query);
    report.queries.push(result);
    console.log(
      `  ${result.success ? "OK" : "ERRO"} ${query.table} — ${result.durationMs}ms — ${result.rowCount} linha(s)${
        result.error ? `\n     → ${result.error.code ?? "—"}: ${result.error.message}` : ""
      }`
    );

    if (!result.success && !report.rootCause) {
      report.rootCause = `[${query.table}] ${result.error.message}`;
    }
  }

  await supabase.auth.signOut();
  printSummary(report);
  process.exit(report.rootCause ? 1 : 0);
}

function printSummary(report) {
  console.log("\n=== Resumo ===");
  console.log(`Causa raiz: ${report.rootCause ?? "Nenhuma — dashboard deve carregar"}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Falha na auditoria:", error);
  process.exit(1);
});
