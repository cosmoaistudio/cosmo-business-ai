import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({
  onBackToLogin,
}: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Informe seu e-mail");
      return;
    }

    try {
      setLoading(true);
      await resetPassword({ email: email.trim() });
      toast.success("Enviamos um link de recuperação para seu e-mail");
      onBackToLogin();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao solicitar recuperação de senha"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <p className="text-left text-sm text-slate-400">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
      </p>

      <div>
        <label htmlFor="forgot-email">E-mail</label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          className="login-input !pl-4"
        />
      </div>

      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? "Enviando..." : "Enviar link de recuperação"}
      </button>

      <button
        type="button"
        onClick={onBackToLogin}
        className="login-form__link w-full text-center"
      >
        Voltar para login
      </button>
    </form>
  );
}
