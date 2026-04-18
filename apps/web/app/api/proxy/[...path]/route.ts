import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_TARGET = 'https://viaja-seguro-mvp.onrender.com/api';

function normalizeBaseUrl(raw: string) {
  return raw.trim().replace(/\/+$/, '');
}

async function resolvePathSegments(context: any): Promise<string[]> {
  const params = await context?.params;
  const value = params?.path;
  return Array.isArray(value) ? value : [];
}

async function forward(request: NextRequest, context: any) {
  const base = normalizeBaseUrl(process.env.API_PROXY_TARGET ?? DEFAULT_TARGET);
  const segments = await resolvePathSegments(context);
  const incomingUrl = new URL(request.url);
  const targetUrl = `${base}/${segments.join('/')}${incomingUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'follow'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(targetUrl, init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  responseHeaders.delete('transfer-encoding');

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: upstream.status,
    headers: responseHeaders
  });
}

export async function GET(request: NextRequest, context: any) {
  return forward(request, context);
}

export async function POST(request: NextRequest, context: any) {
  return forward(request, context);
}

export async function PUT(request: NextRequest, context: any) {
  return forward(request, context);
}

export async function PATCH(request: NextRequest, context: any) {
  return forward(request, context);
}

export async function DELETE(request: NextRequest, context: any) {
  return forward(request, context);
}