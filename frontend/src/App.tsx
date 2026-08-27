import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { api } from "./api";
import { type Client } from "./models/models";
import AuthForm from "./AuthForm";
import "./App.css";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  console.log(session?.access_token);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (sessionLoading) return null;
  if (!session) return <AuthForm />;

  return <ClientsApp userEmail={session.user.email ?? ""} />;
}

function ClientsApp({ userEmail }: { userEmail: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      setClients(await api.list());
      setError(null);
    } catch (err) {
      console.error("Failed to load clients:", err);
      setError("No se pueden cargar los clientes. Contacte a soporte.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const created = await api.create({
      name: trimmed,
      email: email.trim() || undefined,
      company: company.trim() || undefined,
    });
    setClients((prev) => [...prev, created]);
    setName("");
    setEmail("");
    setCompany("");
  }

  async function handleDelete(id: number) {
    await api.remove(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="page">
      <header className="header">
        <div className="header-top">
          <div>
            <span className="eyebrow">hono.js · postgresql(supabase) · react/vite</span>
            <h1>Clientes</h1>
          </div>
          <button className="signout" onClick={() => supabase.auth.signOut()}>
            Salir
          </button>
        </div>
        <p className="subtitle">
          {loading ? "Cargando…" : `${clients.length} client${clients.length === 1 ? "" : "s"}`}
          {" · autenticado como "}
          {userEmail}
        </p>
      </header>

      <form className="add-form client-form" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          aria-label="Nombre del cliente"
          required
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          aria-label="Email del cliente"
          type="email"
        />
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company (optional)"
          aria-label="Company del cliente"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="task-list">
        {clients.map((client) => (
          <li key={client.id}>
            <div className="client-info">
              <span className="client-name">{client.name}</span>
              <span className="client-meta">
                {[client.company, client.email].filter(Boolean).join(" · ")}
              </span>
            </div>
            <button
              className="delete"
              onClick={() => handleDelete(client.id)}
              aria-label={`Delete ${client.name}`}
            >
              ×
            </button>
          </li>
        ))}
        {!loading && clients.length === 0 && !error && (
          <li className="empty">No hay clientes todavia — añade uno.</li>
        )}
      </ul>
    </div>
  );
}