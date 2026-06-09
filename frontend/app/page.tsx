'use client';

import { useEffect, useState } from 'react';
import EndpointList from '@/components/EndpointList';
import JsonEditor from '@/components/JsonEditor';
import { track } from '@/lib/analytics';
import { EXAMPLE_JSON } from '@/lib/example-schema';
import { getOrCreateSessionId } from '@/lib/session';

type Step = 'landing' | 'editor' | 'endpoints';

export default function Home() {
  const [step, setStep] = useState<Step>('landing');
  const [endpoints, setEndpoints] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [editorInitialValue, setEditorInitialValue] = useState<string | undefined>();

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const handleTryItNow = () => {
    track('landing_cta_clicked');
    setEditorInitialValue(undefined);
    setStep('editor');
  };

  const handleLoadExample = () => {
    track('example_loaded');
    setEditorInitialValue(EXAMPLE_JSON);
    setStep('editor');
  };

  const handleSuccess = (newEndpoints: string[]) => {
    setEndpoints(newEndpoints);
    setSessionId(getOrCreateSessionId());
    setStep('endpoints');
  };

  const handleNewApi = () => {
    track('new_api_clicked');
    setStep('editor');
  };

  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-zinc-100">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
          <section className="flex flex-col gap-8">
            <div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
                Generate a mock REST API from JSON in seconds.
              </h1>
              <p className="mt-4 text-lg text-zinc-400">
                No signup. No config. No backend needed.
              </p>
            </div>

            <ul className="flex flex-col gap-2 font-mono text-sm text-zinc-300">
              <li>✓ CRUD endpoints — instant</li>
              <li>✓ Field validation included</li>
              <li>✓ Auto-increment IDs</li>
              <li>✓ Session isolated — your data, your session</li>
            </ul>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleTryItNow}
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0f0f0f] transition-colors hover:bg-zinc-200"
              >
                Try it now →
              </button>
              <button
                type="button"
                onClick={handleLoadExample}
                className="rounded-lg border border-zinc-600 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-400 hover:bg-zinc-900"
              >
                Load Example
              </button>
            </div>

            <div className="mt-4 border-t border-zinc-800 pt-8">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                How it works
              </h2>
              <ol className="flex flex-col gap-4 font-mono text-sm text-zinc-300">
                <li className="flex gap-3">
                  <span className="text-zinc-500">1.</span>
                  <span>Paste your JSON schema</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-zinc-500">2.</span>
                  <span>Click &quot;Generate API&quot;</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-zinc-500">3.</span>
                  <span>Get working CRUD endpoints instantly</span>
                </li>
              </ol>
            </div>
          </section>

          <footer className="mt-16 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <p className="text-sm font-medium text-amber-400">⚠️ MVP Notice</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              This is an early version. Data is stored in memory and will be lost
              if the server restarts. Perfect for quick prototyping sessions.
            </p>
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <h1 className="text-2xl font-bold text-zinc-900">
            API Mock Server Generator
          </h1>
          <p className="mt-2 text-zinc-600">
            Pega tu JSON y obtén una API REST funcional al instante.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {step === 'editor' && (
          <JsonEditor
            key={editorInitialValue ?? 'default'}
            onSuccess={handleSuccess}
            initialValue={editorInitialValue}
          />
        )}

        {step === 'endpoints' && (
          <div className="flex flex-col gap-6">
            <button
              type="button"
              onClick={handleNewApi}
              className="self-start rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              ← Nueva API
            </button>
            <EndpointList endpoints={endpoints} sessionId={sessionId} />
          </div>
        )}
      </main>
    </div>
  );
}
