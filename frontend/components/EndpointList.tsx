'use client';

import { useEffect, useState } from 'react';
import { fetchDocs } from '@/lib/api';
import { track } from '@/lib/analytics';
import type { ResourceDocs } from '@/types';

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface EndpointListProps {
  endpoints: string[];
  sessionId: string;
  baseUrl?: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface EndpointDef {
  method: HttpMethod;
  path: string;
  showPostBody?: boolean;
  showPutBody?: boolean;
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
    { method: 'POST', path: base, showPostBody: true },
    { method: 'GET', path: `${base}/:id` },
    { method: 'PUT', path: `${base}/:id`, showPutBody: true },
    { method: 'DELETE', path: `${base}/:id` },
  ];
}

function formatFieldsList(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([name, type]) => `${name} (${type})`)
    .join(', ');
}

function formatJsonExample(example: Record<string, unknown>): string {
  return JSON.stringify(example, null, 2);
}

function curlLabelToMethod(label: string): string {
  if (label.startsWith('POST')) return 'POST';
  if (label.startsWith('PUT')) return 'PUT';
  if (label.startsWith('DELETE')) return 'DELETE';
  return 'GET';
}

function buildCurlExamples(
  baseUrl: string,
  sessionId: string,
  resource: string,
  docs: ResourceDocs | undefined,
): { label: string; command: string }[] {
  const base = `${baseUrl}/mock/${sessionId}/${resource}`;
  const exampleBody = docs?.examplePost ?? {};
  const postBody = JSON.stringify(exampleBody);
  const putBody = JSON.stringify(
    Object.keys(exampleBody).length > 0
      ? { [Object.keys(exampleBody)[0]]: exampleBody[Object.keys(exampleBody)[0]] }
      : {},
  );

  return [
    {
      label: 'GET todos',
      command: `curl ${base}`,
    },
    {
      label: 'POST crear',
      command: `curl -X POST ${base} \\\n  -H "Content-Type: application/json" \\\n  -d '${postBody}'`,
    },
    {
      label: 'GET por ID',
      command: `curl ${base}/1`,
    },
    {
      label: 'PUT actualizar',
      command: `curl -X PUT ${base}/1 \\\n  -H "Content-Type: application/json" \\\n  -d '${putBody}'`,
    },
    {
      label: 'DELETE',
      command: `curl -X DELETE ${base}/1`,
    },
  ];
}

export default function EndpointList({
  endpoints,
  sessionId,
  baseUrl = DEFAULT_BASE_URL,
}: EndpointListProps) {
  const [docs, setDocs] = useState<Record<string, ResourceDocs> | null>(null);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [curlOpen, setCurlOpen] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    fetchDocs(sessionId)
      .then(setDocs)
      .catch((error: Error) => setDocsError(error.message));
  }, [sessionId]);

  const mockBaseUrl = `${baseUrl}/mock/${sessionId}`;

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyEndpoint = async (
    fullUrl: string,
    key: string,
    method: HttpMethod,
    resource: string,
  ) => {
    await copyToClipboard(fullUrl, key);
    track('endpoint_copied', { method, resource });
  };

  const copyCurl = async (
    command: string,
    key: string,
    label: string,
    resource: string,
  ) => {
    await copyToClipboard(command, key);
    track('curl_copied', { method: curlLabelToMethod(label), resource });
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
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm font-medium text-zinc-600">🔗 Base URL</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="flex-1 break-all font-mono text-sm text-zinc-900">
            {mockBaseUrl}
          </code>
          <button
            type="button"
            onClick={() => copyToClipboard(mockBaseUrl, 'mock-base-url')}
            className="rounded border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {copiedKey === 'mock-base-url' ? '¡Copiado!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">⚠️ Your mock data is stored in memory.</p>
        <p className="mt-1">
          It will reset if the server restarts. This is expected behavior for
          the MVP.
        </p>
      </div>

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

      {docsError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo cargar la documentación: {docsError}
        </p>
      )}

      <div className="flex flex-col gap-6">
        {endpoints.map((resource) => {
          const resourceDocs = docs?.[resource];
          const hasSchema =
            resourceDocs && Object.keys(resourceDocs.fields).length > 0;
          const resourceEndpoints = getEndpointsForResource(sessionId, resource);

          return (
            <div
              key={resource}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
            >
              <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
                <h3 className="font-mono text-base font-semibold text-zinc-900">
                  {resource}
                </h3>
                {hasSchema ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    Campos: {formatFieldsList(resourceDocs.fields)}
                  </p>
                ) : (
                  <p className="mt-1 text-sm italic text-zinc-500">
                    Acepta cualquier estructura
                  </p>
                )}
              </div>

              <ul className="flex flex-col gap-0 divide-y divide-zinc-100 p-2">
                {resourceEndpoints.map((endpoint) => {
                  const fullUrl = `${baseUrl}${endpoint.path}`;
                  const key = `${resource}-${endpoint.method}-${endpoint.path}`;

                  return (
                    <li key={key} className="px-2 py-2">
                      <div className="flex flex-wrap items-center gap-3">
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
                          onClick={() =>
                            copyEndpoint(fullUrl, key, endpoint.method, resource)
                          }
                          className="rounded border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          {copiedKey === key ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>

                      {endpoint.showPostBody && hasSchema && resourceDocs && (
                        <div className="mt-2 ml-16">
                          <p className="mb-1 text-xs text-zinc-500">
                            └─ Body requerido:
                          </p>
                          <pre className="overflow-x-auto rounded-md bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100">
                            {formatJsonExample(resourceDocs.examplePost)}
                          </pre>
                        </div>
                      )}

                      {endpoint.showPutBody && hasSchema && resourceDocs && (
                        <div className="mt-2 ml-16">
                          <p className="mb-1 text-xs text-zinc-500">
                            └─ Campos editables:
                          </p>
                          <pre className="overflow-x-auto rounded-md bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100">
                            {formatJsonExample(resourceDocs.examplePut)}
                          </pre>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white">
        <button
          type="button"
          onClick={() => setCurlOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          <span>Ejemplos con curl</span>
          <span className="text-zinc-400">{curlOpen ? '▲' : '▼'}</span>
        </button>

        {curlOpen && (
          <div className="flex flex-col gap-6 border-t border-zinc-200 p-4">
            {endpoints.map((resource) => {
              const resourceDocs = docs?.[resource];
              const curls = buildCurlExamples(
                baseUrl,
                sessionId,
                resource,
                resourceDocs,
              );

              return (
                <div key={resource}>
                  <h4 className="mb-3 font-mono text-sm font-semibold text-zinc-800">
                    {resource}
                  </h4>
                  <div className="flex flex-col gap-3">
                    {curls.map((curl) => {
                      const curlKey = `curl-${resource}-${curl.label}`;

                      return (
                        <div key={curlKey} className="rounded-md bg-zinc-900 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-zinc-400">
                              {curl.label}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                copyCurl(
                                  curl.command,
                                  curlKey,
                                  curl.label,
                                  resource,
                                )
                              }
                              className="rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-800"
                            >
                              {copiedKey === curlKey ? '¡Copiado!' : 'Copiar'}
                            </button>
                          </div>
                          <pre className="overflow-x-auto font-mono text-xs text-zinc-100 whitespace-pre-wrap">
                            {curl.command}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
