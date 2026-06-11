'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { registerSchema } from '@/lib/api';
import { track } from '@/lib/analytics';
import { EXAMPLE_JSON } from '@/lib/example-schema';
import { clearSession, getOrCreateSessionId } from '@/lib/session';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

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
  const [jsonValue, setJsonValue] = useState(initialValue ?? DEFAULT_JSON);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [coldStartProgress, setColdStartProgress] = useState(0);

  useEffect(() => {
    if (initialValue !== undefined) {
      setJsonValue(initialValue);
      setError(null);
      setSubmitError(null);
    }
  }, [initialValue]);

  useEffect(() => {
    if (!isColdStarting) {
      setColdStartProgress(0);
      return;
    }

    setColdStartProgress(0);
    const frame = requestAnimationFrame(() => {
      setColdStartProgress(90);
    });

    return () => cancelAnimationFrame(frame);
  }, [isColdStarting]);

  const isValidJson = (() => {
    if (!jsonValue.trim()) return false;
    try {
      JSON.parse(jsonValue);
      return true;
    } catch {
      return false;
    }
  })();

  const handleChange = (value: string) => {
    setJsonValue(value);
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
    setIsColdStarting(false);

    try {
      const schema = JSON.parse(jsonValue) as Record<string, unknown[]>;
      const sessionId = getOrCreateSessionId();
      const { endpoints } = await registerSchema(
        sessionId,
        schema,
        () => setIsColdStarting(true),
      );
      setColdStartProgress(100);
      track('api_generated', { resourceCount: endpoints.length });
      onSuccess(endpoints);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to generate API');
    } finally {
      setIsColdStarting(false);
      setLoading(false);
    }
  };

  const handleClearSession = () => {
    track('session_cleared');
    clearSession();
    setJsonValue(DEFAULT_JSON);
    setError(null);
    setSubmitError(null);
  };

  const handleLoadExample = () => {
    track('example_loaded');
    setJsonValue(EXAMPLE_JSON);
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
        <div
          id="json-editor"
          className={`overflow-hidden rounded-lg border ${
            error
              ? 'border-red-500 ring-2 ring-red-400'
              : 'border-zinc-300'
          }`}
        >
          <Editor
            height="320px"
            defaultLanguage="json"
            value={jsonValue}
            onChange={(val) => handleChange(val ?? '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'off',
              folding: true,
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              formatOnPaste: true,
              formatOnType: false,
              tabSize: 2,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">Invalid JSON: {error}</p>
        )}
      </div>

      {submitError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      {loading && isColdStarting ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm font-medium text-blue-900">
            ⏳ Waking up the server...
          </p>
          <p className="mt-2 text-sm text-blue-800">
            This can take up to 60 seconds on the first request. The service is
            hosted on a free tier that sleeps when inactive. Please wait.
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-200">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{
                width: `${coldStartProgress}%`,
                transition:
                  coldStartProgress === 100
                    ? 'width 0.3s ease-out'
                    : 'width 60s linear',
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValidJson || loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate API'}
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
            Clear session
          </button>
        </div>
      )}
    </div>
  );
}
