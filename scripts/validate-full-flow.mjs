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
  if (!condition) {
    throw new Error(message);
  }
}

const stamp = Date.now();
const testCustomerName = `[VALIDACAO] Cliente ${stamp}`;
const testProductName = `[VALIDACAO] Produto ${stamp}`;

async function ensureAuthIfRequired(supabase, stamp, env) {
  const rc1 = await isRc1Enabled(supabase);

  if (!rc1) {
    console.log("   OK - modo legacy (migration 009 pendente, sem RLS)");
    return { rc1: false };
  }

  const authResult = await authenticateValidationUser(supabase, stamp, env);
  assert(authResult.session, "Sessão não retornada");

  const profile = await waitForProfile(supabase);
  assert(profile.organization_id, "Perfil sem organização");
  assert(profile.role, "Perfil sem role");

  console.log("   OK - autenticado:", authResult.email, `(${authResult.mode})`);
  console.log("   OK - perfil:", profile.role);

  return { rc1: true, profile };
}

async function main() {
  const env = loadEnv();
  const supabase = createSupabaseClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  let productId = null;
  let customerId = null;
  let saleId = null;
  let rc1 = false;

  console.log("=== Validação Completa Cosmo Business AI (RC1) ===\n");

  try {
    console.log("1. Autenticação...");
    const authState = await ensureAuthIfRequired(supabase, stamp, env);
    rc1 = authState.rc1;

    console.log("2. Cadastro de cliente...");
    const { data: createdCustomer, error: createCustomerError } =
      await supabase
        .from("customers")
        .insert({
          name: testCustomerName,
          phone: "11999998888",
          cpf: "52998224725",
          email: `cliente${stamp}@outlook.com`,
          address: "Rua Validação, 123",
          notes: "Cliente de teste automatizado",
        })
        .select()
        .single();

    assert(
      !createCustomerError,
      `Falha ao criar cliente: ${createCustomerError?.message}`
    );
    customerId = createdCustomer.id;
    console.log("   OK - cliente criado:", customerId);

    console.log("3. Edição de cliente...");
    const { data: updatedCustomer, error: updateCustomerError } =
      await supabase
        .from("customers")
        .update({
          phone: "11988887777",
          notes: "Cliente atualizado na validação",
        })
        .eq("id", customerId)
        .select()
        .single();

    assert(!updateCustomerError, updateCustomerError?.message);
    assert(updatedCustomer.phone === "11988887777", "Telefone não atualizado");
    console.log("   OK - cliente editado");

    console.log("4. Pesquisa de clientes...");
    const { data: searchedCustomers, error: searchCustomerError } =
      await supabase
        .from("customers")
        .select("*")
        .or(
          `name.ilike.%${testCustomerName}%,phone.ilike.%11988887777%,cpf.ilike.%52998224705%`
        );

    assert(!searchCustomerError, searchCustomerError?.message);
    assert(
      searchedCustomers.some((customer) => customer.id === customerId),
      "Cliente não encontrado"
    );
    console.log("   OK - busca retornou", searchedCustomers.length, "registro(s)");

    console.log("5. Cadastro de produto...");
    const { data: createdProduct, error: createProductError } = await supabase
      .from("products")
      .insert({
        name: testProductName,
        category: "Validação",
        description: "Produto temporário",
        price: 15,
        stock: 10,
        min_stock: 2,
        status: "active",
      })
      .select()
      .single();

    assert(!createProductError, createProductError?.message);
    productId = createdProduct.id;
    console.log("   OK - produto criado:", productId);

    console.log("6. PDV — venda com cliente...");
    const { data: saleResult, error: saleError } = await supabase.rpc(
      "finalize_sale",
      {
        p_items: [{ product_id: productId, quantity: 3 }],
        p_payment_method: "pix",
        p_payment_amount: 45,
        p_discount: 0,
        p_observation: "Venda validação RC1",
        p_customer_id: customerId,
      }
    );

    assert(!saleError, `Falha ao finalizar venda: ${saleError?.message}`);
    saleId = saleResult.id;
    assert(saleResult.total === 45, `Total incorreto: ${saleResult.total}`);
    console.log("   OK - venda #", saleResult.sale_number);

    console.log("7. Estoque...");
    const { data: productAfterSale } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    assert(productAfterSale.stock === 7, `Estoque incorreto: ${productAfterSale.stock}`);
    console.log("   OK - estoque:", productAfterSale.stock);

    console.log("8. Financeiro...");
    const { data: financeRows, error: financeError } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("reference_id", saleId)
      .eq("source", "pdv");

    assert(!financeError, financeError?.message);
    assert(financeRows.length >= 1, "Lançamento não encontrado");
    console.log("   OK -", financeRows[0].description);

    console.log("9. Histórico do cliente...");
    const { data: customerSales, error: historyError } = await supabase
      .from("sales")
      .select("id, sale_items(product_name)")
      .eq("customer_id", customerId)
      .eq("status", "completed");

    assert(!historyError, historyError?.message);
    assert(customerSales.length >= 1, "Histórico vazio");
    console.log("   OK - histórico validado");

    console.log("10. Dashboard...");
    const { data: dashboardSales, error: dashboardSalesError } = await supabase
      .from("sales")
      .select("id, total")
      .eq("status", "completed");

    assert(!dashboardSalesError, dashboardSalesError?.message);
    assert(dashboardSales.some((sale) => sale.id === saleId), "Venda ausente");
    console.log("   OK - agregações");

    if (rc1) {
      console.log("11. Auditoria RC1...");
      const { data: auditRows, error: auditError } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "sale")
        .eq("entity_id", saleId);

      assert(!auditError, auditError?.message);
      assert(auditRows.length >= 1, "Auditoria não registrada");
      console.log("   OK - audit_logs");
    }

    console.log("\n=== TODOS OS TESTES PASSARAM ===");
    if (!rc1) {
      console.log("\nAVISO: Aplique migration 009 para habilitar RLS e multi-tenant RC1.");
    }
  } finally {
    console.log("\nLimpeza...");

    if (saleId) {
      await supabase
        .from("financial_transactions")
        .delete()
        .eq("reference_id", saleId);
      await supabase.from("stock_movements").delete().eq("reference_id", saleId);
      await supabase.from("sale_payments").delete().eq("sale_id", saleId);
      await supabase.from("sale_items").delete().eq("sale_id", saleId);
      await supabase.from("sales").delete().eq("id", saleId);

      if (rc1) {
        await supabase.from("audit_logs").delete().eq("entity_id", saleId);
      }
    }

    if (productId) {
      await supabase.from("products").delete().eq("id", productId);
    }

    if (customerId) {
      await supabase.from("customers").delete().eq("id", customerId);
    }

    await supabase.auth.signOut();
    console.log("Limpeza concluída.");
  }
}

main().catch((error) => {
  console.error("\n=== FALHA NA VALIDAÇÃO ===");
  console.error(error.message);
  process.exit(1);
});
