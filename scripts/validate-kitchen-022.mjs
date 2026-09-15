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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isMissingRelation(error, table) {
  const msg = error?.message?.toLowerCase() ?? "";
  return msg.includes("could not find the table") && msg.includes(table);
}

function isMissingFunction(error, fn) {
  const msg = error?.message?.toLowerCase() ?? "";
  return (
    msg.includes("could not find the function") ||
    (msg.includes("function") && msg.includes(fn.toLowerCase()))
  );
}

const LEGACY_COLUMNS = ["service_type", "observation", "accepted_at", "preparing_at", "ready_at", "delivered_at"];
const REQUIRED_COLUMNS = ["ticket_type", "notes", "started_at", "completed_at", "status"];

async function main() {
  const env = loadEnv();
  const supabase = createSupabaseClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  const stamp = Date.now();
  const failures = [];
  const passes = [];

  console.log("=== Validação Migration 022 — Kitchen Display ===\n");

  const rc1 = await isRc1Enabled(supabase);
  assert(rc1, "Migration 009 (RC1) necessária antes da 022");

  await authenticateValidationUser(supabase, stamp, env);
  const profile = await waitForProfile(supabase);

  // 1. Tabelas
  console.log("1. Tabelas...");
  const ticketsProbe = await supabase.from("kitchen_tickets").select("id").limit(1);
  if (ticketsProbe.error) {
    failures.push(`kitchen_tickets: ${ticketsProbe.error.message}`);
  } else {
    passes.push("kitchen_tickets existe");
  }

  const itemsProbe = await supabase.from("kitchen_ticket_items").select("id").limit(1);
  if (itemsProbe.error) {
    failures.push(`kitchen_ticket_items: ${itemsProbe.error.message}`);
  } else {
    passes.push("kitchen_ticket_items existe");
  }

  // 2. Schema 022 (colunas)
  console.log("2. Schema (colunas 022)...");
  const schemaProbe = await supabase
    .from("kitchen_tickets")
    .select(
      "id, status, ticket_type, notes, started_at, completed_at, estimated_minutes, priority"
    )
    .limit(1);

  if (schemaProbe.error) {
    failures.push(`Schema kitchen_tickets: ${schemaProbe.error.message}`);
  } else {
    passes.push("Colunas 022 presentes (ticket_type, notes, timestamps)");
  }

  for (const legacy of LEGACY_COLUMNS) {
    const legacyProbe = await supabase.from("kitchen_tickets").select(legacy).limit(1);
    if (!legacyProbe.error) {
      failures.push(`Coluna legada ainda presente: ${legacy}`);
    }
  }
  if (!failures.some((f) => f.includes("legada"))) {
    passes.push("Colunas legadas ausentes");
  }

  const itemSchemaProbe = await supabase
    .from("kitchen_ticket_items")
    .select("id, summary, status, quantity, product_name")
    .limit(1);

  if (itemSchemaProbe.error) {
    failures.push(`Schema kitchen_ticket_items: ${itemSchemaProbe.error.message}`);
  } else {
    passes.push("kitchen_ticket_items.summary presente");
  }

  // 3. Trigger pós-venda (via finalize_sale)
  console.log("3. Trigger + generate_kitchen_ticket_from_sale...");
  const productName = `[KDS-022] ${stamp}`;
  let productId = null;
  let saleId = null;
  let ticketId = null;

  try {
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name: productName,
        category: "Validação KDS",
        description: "",
        price: 9.9,
        stock: 20,
        min_stock: 1,
        status: "active",
      })
      .select("id")
      .single();

    assert(!productError, productError?.message);
    productId = product.id;

    const { data: saleResult, error: saleError } = await supabase.rpc("finalize_sale", {
      p_items: [{ product_id: productId, quantity: 1 }],
      p_payment_method: "pix",
      p_payment_amount: 9.9,
      p_discount: 0,
      p_observation: "Pedido Digital — Retirada | Validação 022",
      p_customer_id: null,
    });

    assert(!saleError, saleError?.message);
    saleId = saleResult.id;

    await new Promise((r) => setTimeout(r, 800));

    const { data: ticket, error: ticketError } = await supabase
      .from("kitchen_tickets")
      .select("id, status, ticket_type, notes, sale_id, sale_number")
      .eq("sale_id", saleId)
      .maybeSingle();

    if (ticketError) {
      failures.push(`Ticket pós-venda: ${ticketError.message}`);
    } else if (!ticket) {
      failures.push("Trigger trg_kitchen_ticket_after_sale_item_insert não gerou ticket — aplicar migration 024");
    } else {
      ticketId = ticket.id;
      assert(ticket.status === "pending", `Status esperado pending, recebido ${ticket.status}`);
      assert(ticket.ticket_type != null, "ticket_type ausente");
      passes.push(`Ticket auto-gerado #${ticket.sale_number} (status: pending)`);
    }

    if (ticketId) {
      const { data: ticketItems, error: itemsError } = await supabase
        .from("kitchen_ticket_items")
        .select("id, status, summary, product_name, quantity")
        .eq("ticket_id", ticketId);

      if (itemsError) {
        failures.push(`Itens do ticket: ${itemsError.message}`);
      } else if (!ticketItems?.length) {
        failures.push("kitchen_ticket_items não populados — aplicar migration 024");
      } else {
        passes.push(`${ticketItems.length} item(ns) no ticket`);
      }
    }
  } catch (error) {
    failures.push(`Fluxo trigger: ${error.message}`);
  }

  // 4. Functions (RPC expostas)
  console.log("4. Functions...");
  const fnChecks = [
    { name: "infer_kitchen_ticket_type", args: { p_notes: "mesa 5" } },
  ];

  for (const fn of fnChecks) {
    if (fn.skip) continue;
    const { error } = await supabase.rpc(fn.name, fn.args);
    if (error && isMissingFunction(error, fn.name)) {
      failures.push(`Function ausente: ${fn.name}`);
    } else if (!error || !error.message.includes("could not find")) {
      passes.push(`Function ${fn.name} disponível`);
    }
  }

  if (ticketId) {
    const { error: prepError } = await supabase.rpc("calculate_kitchen_prep_minutes", {
      p_ticket_id: ticketId,
    });
    if (prepError && isMissingFunction(prepError, "calculate_kitchen_prep_minutes")) {
      failures.push("Function ausente: calculate_kitchen_prep_minutes");
    } else if (!prepError) {
      passes.push("Function calculate_kitchen_prep_minutes OK");
    }
  }

  // 5. Realtime (subscription smoke)
  console.log("5. Realtime...");
  const realtimeOk = await new Promise((resolve) => {
    const channel = supabase
      .channel(`kds-validate-${stamp}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kitchen_tickets" },
        () => {}
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void supabase.removeChannel(channel);
          resolve(true);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          void supabase.removeChannel(channel);
          resolve(false);
        }
      });

    setTimeout(() => {
      void supabase.removeChannel(channel);
      resolve(false);
    }, 5000);
  });

  if (realtimeOk) {
    passes.push("Realtime kitchen_tickets: SUBSCRIBED");
  } else {
    failures.push(
      "Realtime kitchen_tickets não conectou (verificar publication supabase_realtime na 022)"
    );
  }

  // Cleanup
  console.log("\nLimpeza...");
  if (ticketId) {
    await supabase.from("kitchen_ticket_items").delete().eq("ticket_id", ticketId);
    await supabase.from("kitchen_tickets").delete().eq("id", ticketId);
  }
  if (saleId) {
    await supabase.from("financial_transactions").delete().eq("reference_id", saleId);
    await supabase.from("stock_movements").delete().eq("reference_id", saleId);
    await supabase.from("sale_payments").delete().eq("sale_id", saleId);
    await supabase.from("sale_items").delete().eq("sale_id", saleId);
    await supabase.from("sales").delete().eq("id", saleId);
  }
  if (productId) {
    await supabase.from("products").delete().eq("id", productId);
  }
  await supabase.auth.signOut();

  // Report
  console.log("\n=== RESULTADO 022 ===");
  for (const p of passes) console.log(`  ✅ ${p}`);
  for (const f of failures) console.log(`  ❌ ${f}`);

  if (failures.length > 0) {
    console.error(`\nFALHA: ${failures.length} problema(s). Aplique database/migrations/024_fix_kitchen_items_and_public_checkout.sql`);
    process.exit(1);
  }

  console.log("\n✅ Migration 022 validada com sucesso.");
}

main().catch((error) => {
  console.error("\n=== ERRO NA VALIDAÇÃO 022 ===");
  console.error(error.message);
  process.exit(1);
});
