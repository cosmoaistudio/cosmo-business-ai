import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient(url, key) {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function isRc1Enabled(supabase) {
  const { error } = await supabase.from("profiles").select("id").limit(1);

  if (!error) return true;

  const message = error.message?.toLowerCase() ?? "";
  return !message.includes("could not find the table");
}

export async function authenticateValidationUser(supabase, stamp, env = {}) {
  const envEmail = env.SUPABASE_TEST_EMAIL;
  const envPassword = env.SUPABASE_TEST_PASSWORD;

  if (envEmail && envPassword) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: envEmail,
      password: envPassword,
    });

    if (error) {
      throw new Error(`Falha no login de teste: ${error.message}`);
    }

    return {
      email: envEmail,
      mode: "existing",
      session: data.session,
    };
  }

  const email = `rc1.validacao.${stamp}@outlook.com`;
  const password = `Rc1Valid@${stamp}!`;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: "RC1 Validação",
        company_name: `RC1 Org ${stamp}`,
      },
    },
  });

  if (signUpError) {
    throw new Error(`Falha no cadastro de teste: ${signUpError.message}`);
  }

  if (signUpData.session) {
    return { email, mode: "signup", session: signUpData.session };
  }

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    throw new Error(
      `Cadastro OK, mas login falhou (desabilite confirmação de e-mail no Supabase): ${signInError.message}`
    );
  }

  return { email, mode: "signin", session: signInData.session };
}

export async function waitForProfile(supabase, attempts = 8) {
  for (let index = 0; index < attempts; index += 1) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) return data;

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Perfil não provisionado após autenticação");
}
