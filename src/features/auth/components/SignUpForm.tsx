import { useState } from "react";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";

interface SignUpFormProps {
  onBackToLogin: () => void;
}

export default function SignUpForm({ onBackToLogin }: SignUpFormProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!fullName.trim() || !companyName.trim() || !email.trim() || !password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    try {
      setLoading(true);
      const hasSession = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        companyName: companyName.trim(),
      });

      if (hasSession) {
        toast.success("Conta criada com sucesso");
        return;
      }

      toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
      onBackToLogin();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar conta"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div>
        <label htmlFor="signup-name">Nome completo</label>
        <input
          id="signup-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Seu nome"
          className="login-input !pl-4"
        />
      </div>

      <div>
        <label htmlFor="signup-company">Nome da empresa</label>
        <input
          id="signup-company"
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Sua empresa"
          className="login-input !pl-4"
        />
      </div>

      <div>
        <label htmlFor="signup-email">E-mail</label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          className="login-input !pl-4"
        />
      </div>

      <div>
        <label htmlFor="signup-password">Senha</label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 6 caracteres"
          className="login-input !pl-4"
        />
      </div>

      <div>
        <label htmlFor="signup-confirm-password">Confirmar senha</label>
        <input
          id="signup-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repita a senha"
          className="login-input !pl-4"
        />
      </div>

      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? "Criando conta..." : "Criar conta"}
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
