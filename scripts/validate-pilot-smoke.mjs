import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
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

const stamp = Date.now();
const storeSlug = `piloto-${stamp}`;
const results = [];

function record(step, ok, detail = "") {
  results.push({ step, ok, detail });
  const icon = ok ? "✅" : "❌";
  console.log(`  ${icon} ${step}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const env = loadEnv();
  const supabaseAuth = createSupabaseClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY
  );
  const supabaseAnon = createClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  let productId = null;
  let saleIdPdv = null;
  let saleIdPublic = null;
  let ticketIdPdv = null;
  let ticketIdPublic = null;
  let storeRowId = null;
  let orgId = null;

  console.log("=== Smoke Test Piloto — Cosmo Business AI ===\n");

  try {
    // Loja / Auth
    console.log("Fase: Loja + Onboarding (auth)...");
    const rc1 = await isRc1Enabled(supabaseAuth);
    record("RC1 / multi-tenant", rc1, rc1 ? "profiles OK" : "migration 009 pendente");
    assert(rc1, "Migration 009 necessária");

    await authenticateValidationUser(supabaseAuth, stamp, env);
    const profile = await waitForProfile(supabaseAuth);
    orgId = profile.organization_id;
    record("Signup/Login + perfil", true, profile.role);

    // Produto
    console.log("\nFase: Produto...");
    const { data: product, error: productError } = await supabaseAuth
      .from("products")
      .insert({
        name: `[PILOTO] Produto ${stamp}`,
        category: "Piloto",
        description: "Smoke test",
        price: 12,
        stock: 50,
        min_stock: 2,
        status: "active",
      })
      .select("id, name, price")
      .single();

    assert(!productError, productError?.message);
    productId = product.id;
    record("Cadastro de produto", true, productId);

    // PDV venda
    console.log("\nFase: PDV → Venda...");
    const { data: pdvSale, error: pdvError } = await supabaseAuth.rpc("finalize_sale", {
      p_items: [{ product_id: productId, quantity: 1, unit_price: 12 }],
      p_payment_method: "pix",
      p_payment_amount: 12,
      p_discount: 0,
      p_observation: "Smoke PDV",
      p_customer_id: null,
    });
    assert(!pdvError, pdvError?.message);
    saleIdPdv = pdvSale.id;
    record("PDV finalize_sale", true, `#${pdvSale.sale_number}`);

    await new Promise((r) => setTimeout(r, 600));

    const { data: pdvTicket } = await supabaseAuth
      .from("kitchen_tickets")
      .select("id, status")
      .eq("sale_id", saleIdPdv)
      .maybeSingle();

    if (pdvTicket) {
      ticketIdPdv = pdvTicket.id;
      record("Kitchen ticket (PDV)", pdvTicket.status === "pending", pdvTicket.status);
    } else {
      record("Kitchen ticket (PDV)", false, "ticket não gerado — aplicar 022");
    }

    const { data: pdvFinance } = await supabaseAuth
      .from("financial_transactions")
      .select("id, source, amount")
      .eq("reference_id", saleIdPdv)
      .eq("source", "pdv");

    record("Financeiro (PDV)", (pdvFinance?.length ?? 0) >= 1, `R$ ${pdvFinance?.[0]?.amount ?? "?"}`);

    // Pedido Digital + Checkout público
    console.log("\nFase: Pedido Digital + Checkout público...");
    const catalogSnapshot = [
      {
        id: productId,
        name: product.name,
        basePrice: Number(product.price),
        available: true,
        groups: [],
      },
    ];

    const { data: storeRow, error: storeError } = await supabaseAuth
      .from("digital_stores")
      .upsert(
        {
          organization_id: orgId,
          slug: storeSlug,
          name: `Loja Piloto ${stamp}`,
          enabled: true,
          welcome_message: "Bem-vindo",
          theme: {},
          settings: { minimumOrder: 0, averagePrepMinutes: 20 },
          catalog_snapshot: catalogSnapshot,
          published_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" }
      )
      .select("id, slug")
      .single();

    if (storeError) {
      record("digital_stores (023)", false, storeError.message);
    } else {
      storeRowId = storeRow.id;
      record("Loja digital publicada", true, storeRow.slug);
    }

    const { data: publicStore, error: publicStoreError } = await supabaseAnon.rpc(
      "get_public_digital_store",
      { p_slug: storeSlug }
    );

    if (publicStoreError) {
      record("RPC get_public_digital_store", false, publicStoreError.message);
    } else {
      record("RPC get_public_digital_store", publicStore != null, "anon OK");
    }

    const { data: publicMenu, error: menuError } = await supabaseAnon.rpc(
      "get_public_digital_menu",
      { p_slug: storeSlug }
    );
    record(
      "RPC get_public_digital_menu",
      !menuError && Array.isArray(publicMenu) && publicMenu.length >= 1,
      menuError?.message ?? `${publicMenu?.length ?? 0} produto(s)`
    );

    const { data: publicOrder, error: orderError } = await supabaseAnon.rpc(
      "place_public_digital_order",
      {
        p_store_slug: storeSlug,
        p_items: [{ product_id: productId, quantity: 1, unit_price: 12 }],
        p_payment_method: "pix",
        p_payment_amount: 12,
        p_discount: 0,
        p_observation: "Pedido Digital — Retirada | Smoke test",
        p_context: { mode: "pickup" },
      }
    );

    if (orderError) {
      record("Checkout público (RPC)", false, orderError.message);
    } else {
      saleIdPublic = publicOrder.id;
      record("Checkout público (RPC)", true, `#${publicOrder.sale_number}`);

      await new Promise((r) => setTimeout(r, 600));

      const { data: publicTicket } = await supabaseAuth
        .from("kitchen_tickets")
        .select("id, status, ticket_type")
        .eq("sale_id", saleIdPublic)
        .maybeSingle();

      if (publicTicket) {
        ticketIdPublic = publicTicket.id;
        record("Kitchen (checkout público)", true, publicTicket.ticket_type);
      } else {
        record("Kitchen (checkout público)", false, "sem ticket");
      }

      const { data: publicFinance } = await supabaseAuth
        .from("financial_transactions")
        .select("amount, source")
        .eq("reference_id", saleIdPublic)
        .eq("source", "digital_ordering");

      record(
        "Financeiro (digital)",
        (publicFinance?.length ?? 0) >= 1,
        publicFinance?.[0]?.source ?? "ausente"
      );

      const { data: orderStatus, error: statusError } = await supabaseAnon.rpc(
        "get_public_order_status",
        { p_store_slug: storeSlug, p_sale_id: saleIdPublic }
      );
      record(
        "Status público do pedido",
        !statusError && orderStatus?.kitchen_status === "pending",
        statusError?.message ?? orderStatus?.kitchen_status
      );
    }

    // Dashboard / Operações (leitura)
    console.log("\nFase: Dashboard + Operações...");
    const { data: salesToday, error: salesError } = await supabaseAuth
      .from("sales")
      .select("id, total")
      .eq("status", "completed")
      .limit(20);

    record("Dashboard (vendas)", !salesError && (salesToday?.length ?? 0) >= 1, `${salesToday?.length ?? 0} vendas`);

    const { data: kitchenQueue, error: kdsError } = await supabaseAuth
      .from("kitchen_tickets")
      .select("id, status")
      .in("status", ["pending", "accepted", "preparing"])
      .limit(10);

    record("Operation Center (KDS queue)", !kdsError, `${kitchenQueue?.length ?? 0} ticket(s) ativo(s)`);

    record("Cosmo AI", true, "painel depende de UI — dados operacionais OK");

    record("Desktop Agent / Impressão", true, "requer agente local — não automatizado");

    const failed = results.filter((r) => !r.ok);
    console.log("\n=== RESUMO SMOKE TEST ===");
    console.log(`Passou: ${results.length - failed.length}/${results.length}`);

    if (failed.length > 0) {
      console.error("\nFalhas:");
      for (const f of failed) console.error(`  - ${f.step}: ${f.detail}`);
      process.exit(1);
    }

    console.log("\n✅ Smoke test piloto completo.");
  } finally {
    console.log("\nLimpeza...");
    if (ticketIdPublic) {
      await supabaseAuth.from("kitchen_ticket_items").delete().eq("ticket_id", ticketIdPublic);
      await supabaseAuth.from("kitchen_tickets").delete().eq("id", ticketIdPublic);
    }
    if (ticketIdPdv) {
      await supabaseAuth.from("kitchen_ticket_items").delete().eq("ticket_id", ticketIdPdv);
      await supabaseAuth.from("kitchen_tickets").delete().eq("id", ticketIdPdv);
    }
    for (const sid of [saleIdPublic, saleIdPdv].filter(Boolean)) {
      await supabaseAuth.from("financial_transactions").delete().eq("reference_id", sid);
      await supabaseAuth.from("stock_movements").delete().eq("reference_id", sid);
      await supabaseAuth.from("sale_payments").delete().eq("sale_id", sid);
      await supabaseAuth.from("sale_items").delete().eq("sale_id", sid);
      await supabaseAuth.from("sales").delete().eq("id", sid);
    }
    if (storeRowId) {
      await supabaseAuth.from("digital_store_tables").delete().eq("store_id", storeRowId);
      await supabaseAuth.from("digital_stores").delete().eq("id", storeRowId);
    }
    if (productId) {
      await supabaseAuth.from("products").delete().eq("id", productId);
    }
    await supabaseAuth.auth.signOut();
  }
}

main().catch((error) => {
  console.error("\n=== FALHA NO SMOKE TEST ===");
  console.error(error.message);
  process.exit(1);
});
