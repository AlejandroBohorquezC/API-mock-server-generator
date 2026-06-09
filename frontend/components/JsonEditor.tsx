'use client';

import { useEffect, useState } from 'react';
import { registerSchema } from '@/lib/api';
import { track } from '@/lib/analytics';
import { EXAMPLE_JSON } from '@/lib/example-schema';
import { clearSession, getOrCreateSessionId } from '@/lib/session';

const DEFAULT_JSON = `{
  "users": [{"id": 1, "name": "Alice"}],
  "products": [],
  "orders": []
}`;

interface JsonEditorProps {
  onSuccess: (endpoints: string[]) => void;
  initialValue?: string;
}

export default function JsonEditor({
  onSuccess,
  initialValue,
}: JsonEditorProps) {
  const [jsonText, setJsonText] = useState(initialValue ?? DEFAULT_JSON);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValue !== undefined) {
      setJsonText(initialValue);
      setError(null);
      setSubmitError(null);
    }
  }, [initialValue]);

  const isValidJson = (() => {
    if (!jsonText.trim()) return false;
    try {
      JSON.parse(jsonText);
      return true;
    } catch {
      return false;
    }
  })();

  const handleChange = (value: string) => {
    setJsonText(value);
    setSubmitError(null);

    if (!value.trim()) {
      setError(null);
      return;
    }

    try {
      JSON.parse(value);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const handleSubmit = async () => {
    if (!isValidJson) return;

    setLoading(true);
    setSubmitError(null);

    try {
      const schema = JSON.parse(jsonText) as Record<string, unknown[]>;
      const sessionId = getOrCreateSessionId();
      const { endpoints } = await registerSchema(sessionId, schema);
      track('api_generated', { resourceCount: endpoints.length });
      onSuccess(endpoints);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to generate API');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSession = () => {
    track('session_cleared');
    clearSession();
    setJsonText(DEFAULT_JSON);
    setError(null);
    setSubmitError(null);
  };

  const handleLoadExample = () => {
    track('example_loaded');
    setJsonText(EXAMPLE_JSON);
    setError(null);
    setSubmitError(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="json-editor"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          JSON Schema
        </label>
        <textarea
          id="json-editor"
          value={jsonText}
          onChange={(e) => handleChange(e.target.value)}
          rows={14}
          className={`w-full rounded-lg border px-4 py-3 font-mono text-sm text-zinc-900 outline-none transition-colors focus:ring-2 focus:ring-blue-500 ${
            error
              ? 'border-red-500 bg-red-50 focus:ring-red-400'
              : 'border-zinc-300 bg-white'
          }`}
          placeholder="Paste your JSON schema here..."
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">JSON inválido: {error}</p>
        )}
      </div>

      {submitError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValidJson || loading}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Generando...' : 'Generar API'}
        </button>
        <button
          type="button"
          onClick={handleLoadExample}
          className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Load Example
        </button>
        <button
          type="button"
          onClick={handleClearSession}
          className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Limpiar sesión
        </button>
      </div>
    </div>
  );
}
