import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
const testProductName = `[MVP] Produto ${stamp}`;
const testCustomerName = `[MVP] Cliente ${stamp}`;
const testObservation = "Observação de validação MVP 1.0";
const testDiscount = 5;

async function validateAuth(supabase, env) {
  console.log("\n[01] Login");

  const testEmail = env.SUPABASE_TEST_EMAIL;
  const testPassword = env.SUPABASE_TEST_PASSWORD;

  if (testEmail && testPassword) {
    await supabase.auth.signOut();

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    assert(!signInError, `Falha no login: ${signInError?.message}`);
    assert(signInData.session, "Sessão não retornada");

    const { data: sessionData } = await supabase.auth.getSession();
    assert(sessionData.session, "Sessão não persistida");

    const { error: signOutError } = await supabase.auth.signOut();
    assert(!signOutError, `Falha no logout: ${signOutError?.message}`);
    console.log("   OK - login, sessão e logout");
    return;
  }

  const { error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { skipBrowserRedirect: true },
  });

  assert(!oauthError, `OAuth indisponível: ${oauthError?.message}`);
  console.log("   OK - OAuth Google (login e-mail requer SUPABASE_TEST_EMAIL/PASSWORD)");
}

async function main() {
  const env = loadEnv();
  const supabase = createClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  let productId = null;
  let deleteProductId = null;
  let customerId = null;
  let deleteCustomerId = null;
  let saleId = null;
  let stockBeforeSale = null;

  console.log("=== VALIDAÇÃO MVP 1.0 — Cosmo Business AI ===");

  try {
    await validateAuth(supabase, env);

    console.log("\n[02] Produtos — CRUD");
    const { data: createdProduct, error: createProductError } = await supabase
      .from("products")
      .insert({
        name: testProductName,
        category: "MVP",
        description: "Produto de validação",
        price: 20,
        stock: 12,
        min_stock: 2,
        status: "active",
      })
      .select()
      .single();

    assert(!createProductError, createProductError?.message);
    productId = createdProduct.id;
    console.log("   OK - criar");

    const { data: updatedProduct, error: updateProductError } = await supabase
      .from("products")
      .update({ price: 25, stock: 15 })
      .eq("id", productId)
      .select()
      .single();

    assert(!updateProductError, updateProductError?.message);
    assert(Number(updatedProduct.price) === 25, "Preço não atualizado");
    stockBeforeSale = updatedProduct.stock;
    console.log("   OK - editar");

    const { data: deleteProduct, error: deleteProductCreateError } =
      await supabase
        .from("products")
        .insert({
          name: `[MVP] Delete ${stamp}`,
          category: "MVP",
          description: "",
          price: 1,
          stock: 1,
          min_stock: 0,
          status: "active",
        })
        .select()
        .single();

    assert(!deleteProductCreateError, deleteProductCreateError?.message);
    deleteProductId = deleteProduct.id;

    const { error: deleteProductError } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteProductId);

    assert(!deleteProductError, deleteProductError?.message);
    deleteProductId = null;
    console.log("   OK - excluir");

    console.log("\n[03] Clientes — CRUD");
    const { data: createdCustomer, error: createCustomerError } =
      await supabase
        .from("customers")
        .insert({
          name: testCustomerName,
          phone: "11999990000",
          cpf: "39053344705",
          email: `mvp${stamp}@outlook.com`,
          address: "Av. MVP, 100",
          notes: "Cliente MVP",
        })
        .select()
        .single();

    assert(!createCustomerError, createCustomerError?.message);
    customerId = createdCustomer.id;
    console.log("   OK - criar");

    const { data: updatedCustomer, error: updateCustomerError } =
      await supabase
        .from("customers")
        .update({ phone: "11988887777", notes: "Cliente MVP atualizado" })
        .eq("id", customerId)
        .select()
        .single();

    assert(!updateCustomerError, updateCustomerError?.message);
    assert(updatedCustomer.phone === "11988887777", "Cliente não editado");
    console.log("   OK - editar");

    const { data: tempCustomer, error: tempCustomerError } = await supabase
      .from("customers")
      .insert({ name: `[MVP] Delete ${stamp}`, phone: "11977776666" })
      .select()
      .single();

    assert(!tempCustomerError, tempCustomerError?.message);
    deleteCustomerId = tempCustomer.id;

    const { error: deleteCustomerError } = await supabase
      .from("customers")
      .delete()
      .eq("id", deleteCustomerId);

    assert(!deleteCustomerError, deleteCustomerError?.message);
    deleteCustomerId = null;
    console.log("   OK - excluir");

    console.log("\n[04] Pesquisa de produtos");
    const { data: searchedProducts, error: searchProductsError } =
      await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${testProductName}%`);

    assert(!searchProductsError, searchProductsError?.message);
    assert(
      searchedProducts.some((product) => product.id === productId),
      "Produto não encontrado na busca"
    );
    console.log("   OK -", searchedProducts.length, "resultado(s)");

    console.log("\n[05] Pesquisa de clientes");
    const { data: searchedCustomers, error: searchCustomersError } =
      await supabase
        .from("customers")
        .select("*")
        .or(
          `name.ilike.%${testCustomerName}%,phone.ilike.%11988887777%,cpf.ilike.%39053344705%`
        );

    assert(!searchCustomersError, searchCustomersError?.message);
    assert(
      searchedCustomers.some((customer) => customer.id === customerId),
      "Cliente não encontrado na busca"
    );
    console.log("   OK -", searchedCustomers.length, "resultado(s)");

    console.log("\n[06-11] PDV — carrinho, desconto, observação, cliente, finalização");
    const cartQuantity = 3;
    const expectedSubtotal = 25 * cartQuantity;
    const expectedTotal = expectedSubtotal - testDiscount;
    const paymentAmount = expectedTotal;

    const { data: pdvCustomers, error: pdvCustomerError } = await supabase
      .from("customers")
      .select("*")
      .ilike("name", `%${testCustomerName}%`)
      .limit(20);

    assert(!pdvCustomerError, pdvCustomerError?.message);
    assert(
      pdvCustomers.some((customer) => customer.id === customerId),
      "Cliente indisponível no PDV"
    );
    console.log("   OK - seleção de cliente");

    const { data: saleResult, error: saleError } = await supabase.rpc(
      "finalize_sale",
      {
        p_items: [{ product_id: productId, quantity: cartQuantity }],
        p_payment_method: "pix",
        p_payment_amount: paymentAmount,
        p_discount: testDiscount,
        p_observation: testObservation,
        p_customer_id: customerId,
      }
    );

    assert(!saleError, `Falha ao finalizar venda: ${saleError?.message}`);
    saleId = saleResult.id;
    assert(saleResult.subtotal === expectedSubtotal, "Subtotal incorreto");
    assert(saleResult.discount === testDiscount, "Desconto incorreto");
    assert(saleResult.total === expectedTotal, "Total incorreto");
    assert(saleResult.customer_id === customerId, "Cliente não vinculado");
    console.log("   OK - venda #", saleResult.sale_number);
    console.log("   OK - carrinho (3 itens), desconto R$5, observação, cliente");

    console.log("\n[12] Baixa automática de estoque");
    const { data: productAfterSale, error: stockError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    assert(!stockError, stockError?.message);
    assert(
      productAfterSale.stock === stockBeforeSale - cartQuantity,
      `Estoque esperado ${stockBeforeSale - cartQuantity}, recebido ${productAfterSale.stock}`
    );

    const { data: movements, error: movementsError } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("reference_id", saleId);

    assert(!movementsError, movementsError?.message);
    assert(movements.length >= 1, "Movimentação não registrada");
    console.log("   OK - estoque:", productAfterSale.stock);

    console.log("\n[13] Registro financeiro");
    const { data: financeRows, error: financeError } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("reference_id", saleId)
      .eq("source", "pdv");

    assert(!financeError, financeError?.message);
    assert(financeRows.length >= 1, "Lançamento não encontrado");
    assert(Number(financeRows[0].amount) === expectedTotal, "Valor incorreto");
    assert(
      financeRows[0].description.includes(testCustomerName),
      "Cliente ausente na descrição financeira"
    );
    assert(financeRows[0].notes === testObservation, "Observação não registrada");
    console.log("   OK -", financeRows[0].description);

    console.log("\n[14] Dashboard — agregações");
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("id, customer_id, total, created_at")
      .eq("status", "completed");

    assert(!salesError, salesError?.message);

    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: customersCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    const customerSales = sales.filter((sale) => sale.customer_id === customerId);
    const totalSpent = customerSales.reduce(
      (sum, sale) => sum + Number(sale.total),
      0
    );

    assert(productsCount !== null && customersCount !== null, "Contagens falharam");
    assert(customerSales.some((sale) => sale.id === saleId), "Venda ausente no dashboard");
    assert(totalSpent >= expectedTotal, "Total gasto incorreto");
    console.log("   OK - produtos:", productsCount, "| clientes:", customersCount);
    console.log("   OK - receita do cliente:", totalSpent);

    console.log("\n[15] Histórico do cliente");
    const { data: history, error: historyError } = await supabase
      .from("sales")
      .select(
        `
        id,
        sale_number,
        total,
        discount,
        observation,
        created_at,
        sale_items (product_name, quantity, unit_price, subtotal),
        sale_payments (payment_method)
      `
      )
      .eq("customer_id", customerId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    assert(!historyError, historyError?.message);
    assert(history.length >= 1, "Histórico vazio");
    assert(history[0].id === saleId, "Venda não encontrada no histórico");
    assert(history[0].observation === testObservation, "Observação ausente");
    assert(history[0].sale_items.length >= 1, "Itens ausentes");
    console.log("   OK -", history.length, "venda(s),", history[0].sale_items.length, "item(ns)");

    console.log("\n=== VALIDAÇÃO MVP 1.0 CONCLUÍDA COM SUCESSO ===");
  } finally {
    console.log("\nLimpeza de dados de teste...");

    if (saleId) {
      await supabase
        .from("financial_transactions")
        .delete()
        .eq("reference_id", saleId);
      await supabase.from("stock_movements").delete().eq("reference_id", saleId);
      await supabase.from("sale_payments").delete().eq("sale_id", saleId);
      await supabase.from("sale_items").delete().eq("sale_id", saleId);
      await supabase.from("sales").delete().eq("id", saleId);
    }

    if (productId) {
      await supabase.from("products").delete().eq("id", productId);
    }

    if (deleteProductId) {
      await supabase.from("products").delete().eq("id", deleteProductId);
    }

    if (customerId) {
      await supabase.from("customers").delete().eq("id", customerId);
    }

    if (deleteCustomerId) {
      await supabase.from("customers").delete().eq("id", deleteCustomerId);
    }

    console.log("Limpeza concluída.");
  }
}

main().catch((error) => {
  console.error("\n=== FALHA NA VALIDAÇÃO MVP 1.0 ===");
  console.error(error.message);
  process.exit(1);
});
