import { supabase } from "./config/supabase";

export async function testSupabase() {
  const { error } = await supabase.from("products").select("*").limit(1);

  if (error) {
    console.log("❌ Erro:", error.message);
  } else {
    console.log("✅ Supabase conectado com sucesso!");
  }
}