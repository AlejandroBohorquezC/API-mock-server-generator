import type { ApiResponse, ResourceDocs } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const COLD_START_TIMEOUT_MS = 65_000;

export async function registerSchema(
  sessionId: string,
  schema: Record<string, unknown[]>,
  onColdStart?: () => void,
): Promise<{ endpoints: string[] }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), COLD_START_TIMEOUT_MS);

  const coldStartTimer = setTimeout(() => {
    onColdStart?.();
  }, 5_000);

  try {
    const response = await fetch(`${BASE_URL}/mock/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, schema }),
      signal: controller.signal,
    });
    clearTimeout(coldStartTimer);

    const result: ApiResponse<{ sessionId: string; endpoints: string[] }> =
      await response.json();

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.error ?? 'Failed to register schema');
    }

    return { endpoints: result.data.endpoints };
  } catch (error) {
    clearTimeout(coldStartTimer);
    if ((error as Error).name === 'AbortError') {
      throw new Error(
        'Request timed out. The server may be unavailable. Please try again.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchDocs(
  sessionId: string,
): Promise<Record<string, ResourceDocs>> {
  const response = await fetch(`${BASE_URL}/mock/${sessionId}/docs`);
  const result: ApiResponse<Record<string, ResourceDocs>> =
    await response.json();

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error ?? 'Failed to fetch docs');
  }

  return result.data;
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
