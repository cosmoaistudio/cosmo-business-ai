import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

interface LoginFormProps {
  onForgotPassword: () => void;
  onSignUp: () => void;
}

export default function LoginForm({
  onForgotPassword,
  onSignUp,
}: LoginFormProps) {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Informe e-mail e senha");
      return;
    }

    try {
      setLoading(true);
      await signIn({ email: email.trim(), password });
      toast.success("Login realizado com sucesso");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer login"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao entrar com Google"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="login-btn"
        disabled={loading}
        onClick={handleGoogleSignIn}
      >
        <span className="login-btn__google-icon">
          <GoogleIcon />
        </span>
        Entrar com Google
      </button>

      <div className="login-form__divider">
        <span className="login-form__divider-line" />
        <span className="login-form__divider-text">ou</span>
        <span className="login-form__divider-line" />
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <Mail size={16} className="login-field__icon" aria-hidden />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            className="login-input"
          />
        </div>

        <div className="login-field">
          <Lock size={16} className="login-field__icon" aria-hidden />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            className="login-input"
          />
          <button
            type="button"
            className="login-field__toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="login-form__links">
          <button
            type="button"
            onClick={onForgotPassword}
            className="login-form__link"
          >
            Esqueci minha senha
          </button>
          <button
            type="button"
            onClick={onSignUp}
            className="login-form__link login-form__link--muted"
          >
            Criar conta
          </button>
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>
    </>
  );
}
