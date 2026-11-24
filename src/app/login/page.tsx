"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    const result = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (result.error) { setError(result.error.message || "Não foi possível entrar."); return; }
    router.push("/dashboard"); router.refresh();
  }

  async function signup() {
    setBusy(true); setError("");
    const result = await authClient.signUp.email({
      email, password, name: email.split("@")[0] || "Operador"
    });
    setBusy(false);
    if (result.error) { setError(result.error.message || "Não foi possível criar a conta."); return; }
    router.push("/dashboard"); router.refresh();
  }

  return <main className="shell">
    <p className="muted">SCAN-APP</p><h1>Acessar painel</h1>
    <form className="panel stack" onSubmit={submit}>
      <label>E-mail<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Senha<input type="password" required minLength={10} value={password} onChange={e => setPassword(e.target.value)} /></label>
      {error && <p className="error">{error}</p>}
      <div className="row"><button disabled={busy}>{busy ? "Aguarde..." : "Entrar"}</button>
        <button type="button" disabled={busy || !email || password.length < 10} onClick={signup}>Criar conta</button>
      </div>
    </form>
  </main>;
}
