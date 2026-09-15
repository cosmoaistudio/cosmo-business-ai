import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";

export default function ResetPasswordForm() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

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
      await updatePassword({ password });
      toast.success("Senha atualizada com sucesso");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar senha"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <p className="text-left text-sm text-slate-400">
        Defina uma nova senha para sua conta.
      </p>

      <div>
        <label htmlFor="reset-password">Nova senha</label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 6 caracteres"
          className="login-input !pl-4"
        />
      </div>

      <div>
        <label htmlFor="reset-confirm-password">Confirmar nova senha</label>
        <input
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repita a senha"
          className="login-input !pl-4"
        />
      </div>

      <button type="submit" className="login-btn" disabled={loading}>
        {loading ? "Salvando..." : "Atualizar senha"}
      </button>
    </form>
  );
}
