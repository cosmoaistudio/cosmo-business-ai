import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

function missingFunction(error) {
  const msg = error?.message?.toLowerCase() ?? "";
  return msg.includes("could not find the function") || msg.includes("schema cache");
}

function missingTable(error) {
  const msg = error?.message?.toLowerCase() ?? "";
  return msg.includes("could not find the table");
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false } }
  );

  const checks = [];
  console.log("=== Validação remota de schema (anon) ===\n");

  const rpc023 = [
    ["get_public_digital_store", { p_slug: "__schema_probe__" }],
    ["get_public_digital_menu", { p_slug: "__schema_probe__" }],
    ["get_public_order_status", { p_store_slug: "__probe__", p_sale_id: "00000000-0000-4000-8000-000000000001" }],
  ];

  for (const [name, args] of rpc023) {
    const { error } = await supabase.rpc(name, args);
    const ok = !error || !missingFunction(error);
    checks.push({ name: `023 RPC ${name}`, ok, detail: error?.message ?? "OK" });
    console.log(`  ${ok ? "✅" : "❌"} ${name}${error && !ok ? `: ${error.message}` : ""}`);
  }

  const { error: orderErr } = await supabase.rpc("place_public_digital_order", {
    p_store_slug: "__probe__",
    p_items: [],
    p_payment_method: "pix",
    p_payment_amount: 1,
  });
  const orderOk = !orderErr || !missingFunction(orderErr);
  checks.push({
    name: "023 RPC place_public_digital_order",
    ok: orderOk,
    detail: orderErr?.message ?? "OK",
  });
  console.log(
    `  ${orderOk ? "✅" : "❌"} place_public_digital_order${orderErr && !orderOk ? `: ${orderErr.message}` : ""}`
  );

  const { error: inferErr } = await supabase.rpc("infer_kitchen_ticket_type", {
    p_notes: "mesa",
  });
  const inferOk = !inferErr || !missingFunction(inferErr);
  checks.push({ name: "022 RPC infer_kitchen_ticket_type", ok: inferOk, detail: inferErr?.message ?? "OK" });
  console.log(
    `  ${inferOk ? "✅" : "❌"} infer_kitchen_ticket_type${inferErr && !inferOk ? `: ${inferErr.message}` : ""}`
  );

  const { error: storeTableErr } = await supabase.from("digital_stores").select("id").limit(1);
  checks.push({
    name: "023 table digital_stores",
    ok: !missingTable(storeTableErr),
    detail: storeTableErr?.message ?? "OK",
  });
  console.log(
    `  ${!missingTable(storeTableErr) ? "✅" : "❌"} digital_stores${storeTableErr ? `: ${storeTableErr.message}` : ""}`
  );

  const { error: kdsTableErr } = await supabase.from("kitchen_tickets").select("id").limit(1);
  checks.push({
    name: "022 table kitchen_tickets",
    ok: !missingTable(kdsTableErr),
    detail: kdsTableErr?.message ?? "OK",
  });
  console.log(
    `  ${!missingTable(kdsTableErr) ? "✅" : "❌"} kitchen_tickets${kdsTableErr ? `: ${kdsTableErr.message}` : ""}`
  );

  const failed = checks.filter((c) => !c.ok);
  console.log(`\nResultado: ${checks.length - failed.length}/${checks.length}`);

  if (failed.length > 0) {
    console.error("\nAplique as migrations pendentes (022, 023).");
    process.exit(1);
  }

  console.log("\n✅ Schema remoto OK (RPCs e tabelas detectadas).");
  console.log("   Para validação completa: npm run validate:kitchen && npm run validate:pilot");
  console.log("   (requer SUPABASE_TEST_EMAIL/PASSWORD ou confirmação de e-mail desabilitada)");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
