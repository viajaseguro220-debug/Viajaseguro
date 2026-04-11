'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest, getSessionRole, getToken } from '@/lib/api';
import { inferRouteCorridor } from '@/lib/route-corridors';
import { BaseRouteSummary, RouteOffer } from '@/lib/route-offers';

type UserRole = 'passenger' | 'driver' | 'admin';

interface MeResponse {
  id: string;
  role: UserRole;
}

export default function SearchTripsPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [sessionRole, setSessionRole] = useState<UserRole | null>(null);
  const [routes, setRoutes] = useState<BaseRouteSummary[]>([]);
  const [myOffers, setMyOffers] = useState<RouteOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const role = me?.role ?? sessionRole;
  const isDriver = role === 'driver';
  const isPassenger = role === 'passenger';
  const offerRouteIds = useMemo(() => new Set(myOffers.map((offer) => offer.routeId)), [myOffers]);

  useEffect(() => {
    const rawRole = getSessionRole();
    if (rawRole === 'driver' || rawRole === 'passenger' || rawRole === 'admin') {
      setSessionRole(rawRole);
    }
  }, []);

  async function loadRoutesFeed() {
    const token = getToken();
    if (!token) {
      setError('No hay sesion activa.');
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const profile = await apiRequest<MeResponse>('/auth/me', { headers });
      setMe(profile);

      const baseRoutes = await apiRequest<BaseRouteSummary[]>('/route-offers/routes', { headers });
      setRoutes(baseRoutes);

      if (profile.role === 'driver') {
        const offers = await apiRequest<RouteOffer[]>('/route-offers/my-offers', { headers });
        setMyOffers(offers);
      } else {
        setMyOffers([]);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las rutas publicadas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoutesFeed();
  }, []);

  if (loading) {
    return <p className="text-slate-700">Cargando feed de rutas publicadas...</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Feed de rutas publicadas</h1>
          <p className="text-sm text-slate-600">Rutas preestablecidas para una operacion mas rapida y clara.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/routes" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Ver corredores
          </Link>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              void loadRoutesFeed();
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
          >
            Recargar
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-sky-50 p-4 text-sm text-sky-900">
        <p className="font-semibold">Modo preestablecido activo</p>
        <p>En esta fase no se usa buscador. Elige una ruta publicada y continua con el flujo operativo.</p>
      </div>

      {error && <p className="rounded-md bg-red-50 p-3 text-red-700">{error}</p>}

      {routes.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">No hay rutas publicadas por ahora.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {routes.map((route) => {
            const corridor = inferRouteCorridor(route);
            const alreadyTaken = offerRouteIds.has(route.id);

            return (
              <article key={route.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">{corridor.routeTypeLabel}</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{route.title || `${route.origin} -> ${route.destination}`}</h2>
                    <p className="text-sm text-slate-600">{route.origin} {'->'} {route.destination}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">Ruta publicada</span>
                </div>

                <p className="mt-2 text-sm text-slate-700">Horario base: {route.departureTime} - {route.estimatedArrivalTime}</p>
                <p className="text-sm text-slate-700">Distancia aprox: {route.distanceKm.toFixed(2)} km</p>
                <p className="text-sm font-medium text-slate-900">Precio por asiento: ${route.pricePerSeat.toFixed(2)} MXN</p>
                {route.stopsText && <p className="text-xs text-slate-600">{route.stopsText}</p>}

                <div className="mt-4">
                  {isPassenger ? (
                    <Link href={`/dashboard/routes/${route.id}`} className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white">
                      Ver conductores disponibles
                    </Link>
                  ) : isDriver ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {alreadyTaken && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Ruta ya tomada</span>}
                      <Link href={`/dashboard/routes/${route.id}/take`} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
                        {alreadyTaken ? 'Editar datos de mi viaje' : 'Tomar ruta'}
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/dashboard/routes/${route.id}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                      Ver detalle
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
