import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  LoginGlassPanel,
  LoginOfficialShell,
} from "@/components/login-official";
import "@/components/login-official/styles/login-official.css";

import {
  ForgotPasswordForm,
  LoginForm,
  ResetPasswordForm,
  SignUpForm,
  useAuth,
  type AuthView,
} from "@/features/auth";
import { authService } from "@/features/auth/services/auth.service";

const ALT_VIEWS: Record<
  Exclude<AuthView, "login">,
  { headline: string; subheadline: string }
> = {
  signup: {
    headline: "Criar conta",
    subheadline: "Comece sua jornada no Cosmo.",
  },
  forgot: {
    headline: "Recuperar acesso",
    subheadline: "Vamos restaurar sua conta.",
  },
  reset: {
    headline: "Nova senha",
    subheadline: "Escolha uma senha segura.",
  },
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [view, setView] = useState<AuthView>("login");

  useEffect(() => {
    if (searchParams.get("mode") === "reset" && session) {
      setView("reset");
    }
  }, [searchParams, session]);

  useEffect(() => {
    const { data } = authService.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset");
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const isLogin = view === "login";
  const alt = !isLogin ? ALT_VIEWS[view] : null;

  return (
    <LoginOfficialShell
      showBrand={isLogin}
      headline={alt?.headline}
      subheadline={alt?.subheadline}
    >
      <LoginGlassPanel>
        {view === "login" && (
          <LoginForm
            onForgotPassword={() => setView("forgot")}
            onSignUp={() => setView("signup")}
          />
        )}

        {view === "signup" && (
          <div className="login-alt-form">
            <SignUpForm onBackToLogin={() => setView("login")} />
          </div>
        )}

        {view === "forgot" && (
          <div className="login-alt-form">
            <ForgotPasswordForm onBackToLogin={() => setView("login")} />
          </div>
        )}

        {view === "reset" && (
          <div className="login-alt-form">
            <ResetPasswordForm />
          </div>
        )}
      </LoginGlassPanel>
    </LoginOfficialShell>
  );
}
