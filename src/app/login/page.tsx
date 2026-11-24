"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function Login() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter();
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");const supabase=createClient();const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error){setError(error.message);return;}router.push("/dashboard");router.refresh();}
  async function signup(){setBusy(true);setError("");const supabase=createClient();const {error}=await supabase.auth.signUp({email,password});setBusy(false);setError(error?error.message:"Conta criada. Verifique seu e-mail para confirmar o cadastro.");}
  return <main className="shell"><p className="muted">SCAN-APP</p><h1>Acessar painel</h1><form className="panel stack" onSubmit={submit}><label>E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Senha<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="error">{error}</p>}<div className="row"><button disabled={busy}>Entrar</button><button type="button" disabled={busy} onClick={signup}>Criar conta</button></div></form></main>;
}