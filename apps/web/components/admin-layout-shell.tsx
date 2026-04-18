'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { apiRequest, getToken } from '@/lib/api';
import { ADMIN_NAV_ITEMS } from '@/lib/admin';

interface MeResponse {
  fullName: string;
  role: 'passenger' | 'driver' | 'admin';
}

export default function AdminLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token) {
        setError('No hay sesion activa para acceder al panel admin.');
        setLoading(false);
        return;
      }

      try {
        const me = await apiRequest<MeResponse>('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAdmin(me.role === 'admin');
        setFullName(me.fullName);
        if (me.role !== 'admin') {
          setError('Tu cuenta no tiene permisos de administrador para entrar a este panel.');
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudo validar tu sesion de administrador.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return <p className="text-slate-700">Cargando panel admin...</p>;
  }

  if (!isAdmin) {
    return (
      <section className="vs-card space-y-4 bg-red-50 text-red-700">
        <h1 className="text-2xl font-semibold">Acceso restringido</h1>
        <p className="text-sm">{error ?? 'Solo un usuario con role=admin puede entrar a estas rutas.'}</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className="vs-button-secondary">Volver al dashboard</Link>
          <Link href="/login" className="vs-button-primary">Ir a login</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="vs-panel-theme">
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden xl:sticky xl:top-24 xl:block xl:self-start">
          <div className="space-y-4 rounded-[26px] border border-slate-800 bg-[#070f22] p-5 text-white shadow-[0_24px_60px_-36px_rgba(6,10,24,0.95)]">
            <div className="space-y-2 rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Admin</p>
              <h2 className="text-2xl font-semibold">Operacion del MVP</h2>
              <p className="text-sm text-slate-300">{fullName}</p>
              <p className="text-sm text-slate-300">Mas orden, mas seguridad, mejor traslado.</p>
            </div>

            <nav className="space-y-2">
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl border px-4 py-3 transition ${
                      active
                        ? 'border-blue-400/40 bg-gradient-to-r from-blue-600/35 to-indigo-600/35 text-white'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs text-slate-300">{item.description}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-2">
              <Link href="/dashboard" className="inline-flex w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Volver al panel general
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <section className="vs-panel-card p-3 xl:hidden">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Navegacion admin</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition ${
                      active ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'border border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>

          {children}
        </div>
      </div>
    </div>
  );
}