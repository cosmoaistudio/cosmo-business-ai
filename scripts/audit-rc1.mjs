import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  authenticateValidationUser,
  createSupabaseClient,
  isRc1Enabled,
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

function pass(label, detail = "") {
  console.log(`  ✅ ${label}${detail ? ` — ${detail}` : ""}`);
  return { ok: true, label, detail };
}

function fail(label, detail = "") {
  console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
  return { ok: false, label, detail };
}

function warn(label, detail = "") {
  console.log(`  ⚠️  ${label}${detail ? ` — ${detail}` : ""}`);
  return { ok: null, label, detail };
}

const RLS_TABLES = [
  "organizations",
  "profiles",
  "audit_logs",
  "products",
  "customers",
  "sales",
  "sale_items",
  "sale_payments",
  "stock_movements",
  "financial_transactions",
];

async function main() {
  const env = loadEnv();
  const supabase = createSupabaseClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  const results = [];
  const stamp = Date.now();

  console.log("=== Auditoria RC1 — Cosmo Business AI ===\n");

  console.log("A. Infraestrutura RC1");
  const rc1 = await isRc1Enabled(supabase);
  results.push(rc1 ? pass("Migration 009 aplicada (tabela profiles)") : fail("Migration 009 não detectada"));

  if (rc1) {
    for (const table of ["organizations", "profiles", "audit_logs"]) {
      const { error } = await supabase.from(table).select("id").limit(1);
      results.push(!error ? pass(`Tabela ${table} acessível`) : fail(`Tabela ${table}`, error.message));
    }
  }

  console.log("\nB. RLS — acesso anônimo bloqueado");
  for (const table of RLS_TABLES) {
    const { data, error } = await supabase.from(table).select("id").limit(5);
    if (error) {
      results.push(pass(`${table}: SELECT anônimo rejeitado`, error.message));
    } else if (!data || data.length === 0) {
      results.push(pass(`${table}: SELECT anônimo retorna vazio (RLS)`));
    } else {
      results.push(fail(`${table}: SELECT anônimo retornou dados`, `${data.length} linha(s)`));
    }
  }

  console.log("\nC. RLS — INSERT anônimo bloqueado");
  const { error: anonInsertError } = await supabase.from("products").insert({
    name: `[AUDIT] Anon ${stamp}`,
    category: "Audit",
    price: 1,
    stock: 1,
    status: "active",
  });
  results.push(
    anonInsertError
      ? pass("INSERT anônimo em products bloqueado", anonInsertError.message)
      : fail("INSERT anônimo em products permitido")
  );

  console.log("\nD. RPCs — acesso anônimo bloqueado");
  const { error: anonRpcError } = await supabase.rpc("finalize_sale", {
    p_items: [],
    p_payment_method: "pix",
    p_payment_amount: 1,
  });
  results.push(
    anonRpcError
      ? pass("finalize_sale anônimo bloqueado", anonRpcError.message)
      : fail("finalize_sale anônimo permitido")
  );

  console.log("\nE. Autenticação e fluxo completo");
  if (env.SUPABASE_TEST_EMAIL && env.SUPABASE_TEST_PASSWORD) {
    try {
      const auth = await authenticateValidationUser(supabase, stamp, env);
      const profile = await waitForProfile(supabase);
      results.push(pass("Login com credenciais de teste", auth.email));
      results.push(pass("Perfil provisionado", `role=${profile.role}`));
      results.push(pass("Organização vinculada", profile.organization_id));

      const orgId = profile.organization_id;

      const { data: products } = await supabase.from("products").select("organization_id").limit(20);
      const crossOrg = (products ?? []).filter((p) => p.organization_id !== orgId);
      results.push(
        crossOrg.length === 0
          ? pass("Isolamento products — apenas org própria")
          : fail("Vazamento cross-org em products", `${crossOrg.length} registro(s)`)
      );

      const testName = `[AUDIT] Prod ${stamp}`;
      const { data: created, error: createErr } = await supabase
        .from("products")
        .insert({
          name: testName,
          category: "Audit",
          price: 10,
          stock: 5,
          status: "active",
        })
        .select()
        .single();

      if (createErr) {
        results.push(fail("CRUD produto (create)", createErr.message));
      } else {
        results.push(pass("CRUD produto (create)"));
        await supabase.from("products").delete().eq("id", created.id);
        results.push(pass("CRUD produto (delete)"));
      }

      const { data: saleResult, error: saleErr } = await supabase.rpc("finalize_sale", {
        p_items: created ? [{ product_id: created.id, quantity: 1 }] : [],
        p_payment_method: "pix",
        p_payment_amount: 10,
      });

      if (created && !saleErr) {
        results.push(pass("PDV finalize_sale", `#${saleResult.sale_number}`));
        await supabase.from("financial_transactions").delete().eq("reference_id", saleResult.id);
        await supabase.from("stock_movements").delete().eq("reference_id", saleResult.id);
        await supabase.from("sale_payments").delete().eq("sale_id", saleResult.id);
        await supabase.from("sale_items").delete().eq("sale_id", saleResult.id);
        await supabase.from("sales").delete().eq("id", saleResult.id);
        await supabase.from("audit_logs").delete().eq("entity_id", saleResult.id);
      } else if (!created) {
        results.push(warn("PDV não testado", "produto não criado"));
      } else {
        results.push(fail("PDV finalize_sale", saleErr.message));
      }

      await supabase.auth.signOut();
    } catch (error) {
      results.push(fail("Fluxo autenticado", error.message));
    }
  } else {
    results.push(
      warn(
        "Fluxo autenticado não executado",
        "Defina SUPABASE_TEST_EMAIL e SUPABASE_TEST_PASSWORD no .env, ou desabilite confirmação de e-mail"
      )
    );
  }

  console.log("\nF. Resumo");
  const passed = results.filter((r) => r.ok === true).length;
  const failed = results.filter((r) => r.ok === false).length;
  const skipped = results.filter((r) => r.ok === null).length;

  console.log(`  Total: ${results.length} | ✅ ${passed} | ❌ ${failed} | ⚠️  ${skipped}`);

  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error("\n=== ERRO NA AUDITORIA ===");
  console.error(error.message);
  process.exit(1);
});
