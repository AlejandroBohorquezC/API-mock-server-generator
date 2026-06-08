'use client';

import { useState } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface EndpointListProps {
  endpoints: string[];
  sessionId: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface EndpointDef {
  method: HttpMethod;
  path: string;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-amber-100 text-amber-800',
  DELETE: 'bg-red-100 text-red-800',
};

function getEndpointsForResource(
  sessionId: string,
  resource: string,
): EndpointDef[] {
  const base = `/mock/${sessionId}/${resource}`;
  return [
    { method: 'GET', path: base },
    { method: 'POST', path: base },
    { method: 'GET', path: `${base}/:id` },
    { method: 'PUT', path: `${base}/:id` },
    { method: 'DELETE', path: `${base}/:id` },
  ];
}

export default function EndpointList({
  endpoints,
  sessionId,
}: EndpointListProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (endpoints.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-lg font-medium text-zinc-700">
          No hay endpoints generados
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Pega un JSON válido en el editor y haz clic en &quot;Generar API&quot;
          para ver los endpoints disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-100 px-4 py-3">
        <span className="text-sm font-medium text-zinc-600">Session ID:</span>
        <code className="rounded bg-white px-2 py-1 font-mono text-sm text-zinc-800">
          {sessionId}
        </code>
        <button
          type="button"
          onClick={() => copyToClipboard(sessionId, 'session')}
          className="rounded border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {copiedKey === 'session' ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {endpoints.map((resource) => {
          const resourceEndpoints = getEndpointsForResource(sessionId, resource);

          return (
            <div
              key={resource}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <h3 className="mb-3 font-mono text-base font-semibold text-zinc-900">
                /{resource}
              </h3>
              <ul className="flex flex-col gap-2">
                {resourceEndpoints.map((endpoint) => {
                  const fullUrl = `${BASE_URL}${endpoint.path}`;
                  const key = `${resource}-${endpoint.method}-${endpoint.path}`;

                  return (
                    <li
                      key={key}
                      className="flex flex-wrap items-center gap-3 rounded-md bg-zinc-50 px-3 py-2"
                    >
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${METHOD_COLORS[endpoint.method]}`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="flex-1 font-mono text-sm text-zinc-700">
                        {endpoint.path}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fullUrl, key)}
                        className="rounded border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      >
                        {copiedKey === key ? '¡Copiado!' : 'Copiar'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-amber-700">
        Los datos se almacenan en memoria y se pierden al reiniciar el servidor.
      </p>
    </div>
  );
}
