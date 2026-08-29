import { useState, type FormEvent } from "react";
import { supabase } from "./supabaseClient";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1420] px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16212F] text-[#2DD4B0]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 14 L7 14 L9 8 L13 18 L15 11 L17 14 L22 14" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-[#E7ECF3]">NeoBill</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/5 bg-[#111C2E] p-8 shadow-xl shadow-black/20">
          <h1 className="text-lg font-semibold text-[#E7ECF3]">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-[#8B97A8]">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-[#8B97A8]"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@empresa.com"
                className="w-full rounded-lg border border-white/10 bg-[#0B1420] px-3.5 py-2.5 text-sm text-[#E7ECF3] placeholder:text-[#5B6675] outline-none transition focus:border-[#2DD4B0]/50 focus:ring-2 focus:ring-[#2DD4B0]/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-[#8B97A8]"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-[#0B1420] px-3.5 py-2.5 text-sm text-[#E7ECF3] placeholder:text-[#5B6675] outline-none transition focus:border-[#2DD4B0]/50 focus:ring-2 focus:ring-[#2DD4B0]/20"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-[#2DD4B0] px-4 py-2.5 text-sm font-semibold text-[#0B1420] transition hover:bg-[#28C0A0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#5B6675]">
          ¿No tienes cuenta? Contacta a un administrador para solicitar acceso.
        </p>
      </div>
    </div>
  );
}
