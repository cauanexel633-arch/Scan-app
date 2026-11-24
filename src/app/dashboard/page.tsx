"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Port = { id: string; name: string; webhook_url: string; created_at: string; enabled: boolean };

export default function Dashboard() {
  const [ports, setPorts] = useState<Port[]>([]);
  const [name, setName] = useState("Minha integração");
  const [webhook, setWebhook] = useState("");
  const [credentials, setCredentials] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function load() {
    const session = await authClient.getSession();
    if (!session.data?.user) { router.replace("/login"); return; }
    const response = await fetch("/api/ports");
    if (response.status === 401) { router.replace("/login"); return; }
    if (response.ok) setPorts(await response.json());
  }

  useEffect(() => { void load(); }, []);

  async function createPort(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setCredentials("");
    const response = await fetch("/api/ports", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, webhookUrl: webhook })
    });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setError(data.error || "Não foi possível criar a porta."); return; }
    setCredentials(JSON.stringify({ portId: data.port.id, token: data.token, webhookSecret: data.webhookSecret }, null, 2));
    setPorts(current => [data.port, ...current]);
  }

  async function logout() {
    await authClient.signOut(); router.push("/login"); router.refresh();
  }

  return <main className="shell">
    <div className="row"><div><p className="muted">SCAN-APP / DASHBOARD</p><h1>Suas portas</h1></div><button onClick={logout}>Sair</button></div>
    <form className="panel stack" onSubmit={createPort}>
      <h2>Criar nova porta</h2>
      <div className="grid">
        <label>Nome da integração<input value={name} onChange={e => setName(e.target.value)} required maxLength={80} /></label>
        <label>Webhook HTTPS<input type="url" placeholder="https://hooks.example.com/api/scans" value={webhook} onChange={e => setWebhook(e.target.value)} required /></label>
      </div>
      {error && <p className="error">{error}</p>}
      <button disabled={busy}>{busy ? "Criando..." : "Criar porta"}</button>
      {credentials && <div className="stack">
        <p className="pill">Copie e guarde as credenciais agora. Elas não serão exibidas novamente.</p>
        <pre className="code">{credentials}</pre>
        <button type="button" onClick={() => navigator.clipboard.writeText(credentials)}>Copiar credenciais</button>
      </div>}
    </form>
    <section className="panel"><h2>Integrações cadastradas</h2>
      {ports.length === 0 ? <p className="muted">Nenhuma porta criada ainda.</p> : ports.map(port =>
        <article key={port.id} className="panel">
          <div className="row"><strong>{port.name}</strong><span className="pill">{port.enabled ? "Ativa" : "Desativada"}</span></div>
          <p className="muted">{port.webhook_url}</p><p className="muted">ID: {port.id}</p>
        </article>
      )}
    </section>
  </main>;
}
