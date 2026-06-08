import type { ApiResponse } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function registerSchema(
  sessionId: string,
  schema: Record<string, unknown[]>,
): Promise<{ endpoints: string[] }> {
  const response = await fetch(`${BASE_URL}/mock/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, schema }),
  });

  const result: ApiResponse<{ sessionId: string; endpoints: string[] }> =
    await response.json();

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error ?? 'Failed to register schema');
  }

  return { endpoints: result.data.endpoints };
}

export async function callEndpoint(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const result: ApiResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error ?? 'Request failed');
  }

  return result.data;
}
