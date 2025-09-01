"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Invalid password");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white shadow-xl border border-slate-200/50 rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Admin Login</h1>
        <p className="text-sm text-slate-600">Enter the admin password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          autoFocus
        />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded-md text-white text-sm ${loading ? "bg-indigo-300" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            location.reload();
          }}
          className="w-full px-4 py-2 rounded-md text-slate-700 text-sm border border-slate-300 hover:bg-slate-50"
        >
          Clear session
        </button>
      </form>
    </main>
  );
}
