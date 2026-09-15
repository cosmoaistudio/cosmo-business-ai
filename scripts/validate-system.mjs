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

async function main() {
  const env = loadEnv();
  const supabase = createClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  const testName = `[VALIDACAO] Produto ${Date.now()}`;
  let productId = null;
  let saleId = null;

  console.log("=== Validação Cosmo Business AI ===\n");

  try {
    console.log("1. Cadastro de produto...");
    const { data: created, error: createError } = await supabase
      .from("products")
      .insert({
        name: testName,
        category: "Validação",
        description: "Produto temporário de validação",
        price: 10,
        stock: 5,
        min_stock: 2,
        status: "active",
      })
      .select()
      .single();

    assert(!createError, `Falha ao criar produto: ${createError?.message}`);
    productId = created.id;
    console.log("   OK - produto criado:", productId);

    console.log("2. Edição de produto...");
    const { data: updated, error: updateError } = await supabase
      .from("products")
      .update({ price: 12.5, stock: 8 })
      .eq("id", productId)
      .select()
      .single();

    assert(!updateError, `Falha ao editar produto: ${updateError?.message}`);
    assert(Number(updated.price) === 12.5, "Preço não atualizado");
    assert(updated.stock === 8, "Estoque não atualizado");
    console.log("   OK - produto editado");

    console.log("3. Busca de produtos...");
    const { data: products, error: searchError } = await supabase
      .from("products")
      .select("*")
      .ilike("name", `%${testName}%`);

    assert(!searchError, `Falha na busca: ${searchError?.message}`);
    assert(products.length >= 1, "Produto não encontrado na busca");
    console.log("   OK - busca retornou", products.length, "registro(s)");

    console.log("4. Finalizar venda PDV (desconto + observação)...");
    const { data: saleResult, error: saleError } = await supabase.rpc(
      "finalize_sale",
      {
        p_items: [{ product_id: productId, quantity: 2 }],
        p_payment_method: "pix",
        p_payment_amount: 20,
        p_discount: 5,
        p_observation: "Venda de validação automatizada",
        p_customer_id: null,
      }
    );

    assert(!saleError, `Falha ao finalizar venda: ${saleError?.message}`);
    saleId = saleResult.id;
    assert(saleResult.total === 20, `Total esperado 20, recebido ${saleResult.total}`);
    assert(saleResult.discount === 5, `Desconto esperado 5, recebido ${saleResult.discount}`);
    console.log("   OK - venda #", saleResult.sale_number);

    console.log("5. Baixa automática de estoque...");
    const { data: productAfterSale, error: productAfterError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    assert(!productAfterError, productAfterError?.message);
    assert(productAfterSale.stock === 6, `Estoque esperado 6, recebido ${productAfterSale.stock}`);
    console.log("   OK - estoque atual:", productAfterSale.stock);

    console.log("6. Histórico de movimentações...");
    const { data: movements, error: movementsError } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("product_id", productId)
      .eq("reference_id", saleId);

    assert(!movementsError, movementsError?.message);
    assert(movements.length >= 1, "Movimentação de venda não registrada");
    assert(movements[0].movement_type === "sale", "Tipo de movimentação incorreto");
    console.log("   OK - movimentação registrada");

    console.log("7. Registro financeiro...");
    const { data: financeRows, error: financeError } = await supabase
      .from("financial_transactions")
      .select("*")
      .eq("reference_id", saleId)
      .eq("source", "pdv");

    assert(!financeError, financeError?.message);
    assert(financeRows.length >= 1, "Lançamento financeiro não encontrado");
    assert(Number(financeRows[0].amount) === 20, "Valor financeiro incorreto");
    console.log("   OK - lançamento financeiro registrado");

    console.log("8. Dashboard (agregações)...");
    const { count: salesCount } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    const { count: customersCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    assert(salesCount !== null, "Falha ao contar vendas");
    assert(customersCount !== null, "Falha ao contar clientes");
    console.log("   OK - vendas:", salesCount, "| clientes:", customersCount);

    console.log("9. Exclusão de produto...");
    const { data: deleteTarget, error: deleteTargetError } = await supabase
      .from("products")
      .insert({
        name: `[VALIDACAO] Delete ${Date.now()}`,
        category: "Validação",
        description: "",
        price: 1,
        stock: 1,
        min_stock: 0,
        status: "active",
      })
      .select()
      .single();

    assert(!deleteTargetError, deleteTargetError?.message);

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteTarget.id);

    assert(!deleteError, `Falha ao excluir produto: ${deleteError?.message}`);
    console.log("   OK - produto excluído");

    console.log("10. Movimentação manual de estoque...");
    const { data: tempProduct, error: tempCreateError } = await supabase
      .from("products")
      .insert({
        name: `[VALIDACAO] Estoque ${Date.now()}`,
        category: "Validação",
        description: "",
        price: 5,
        stock: 3,
        min_stock: 1,
        status: "active",
      })
      .select()
      .single();

    assert(!tempCreateError, tempCreateError?.message);

    const { data: movementResult, error: movementError } = await supabase.rpc(
      "register_stock_movement",
      {
        p_product_id: tempProduct.id,
        p_movement_type: "entry",
        p_quantity: 2,
        p_notes: "Entrada de validação",
      }
    );

    assert(!movementError, movementError?.message);
    assert(movementResult.new_stock === 5, "Estoque após entrada incorreto");
    console.log("   OK - entrada registrada, estoque:", movementResult.new_stock);

    await supabase.from("products").delete().eq("id", tempProduct.id);

    console.log("\n=== TODOS OS TESTES PASSARAM ===");
  } finally {
    console.log("\nLimpeza...");
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

    console.log("Dados de teste removidos.");
  }
}

main().catch((error) => {
  console.error("\n=== FALHA NA VALIDAÇÃO ===");
  console.error(error.message);
  process.exit(1);
});
