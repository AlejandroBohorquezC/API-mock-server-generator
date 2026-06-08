'use client';

import { useEffect, useState } from 'react';
import EndpointList from '@/components/EndpointList';
import JsonEditor from '@/components/JsonEditor';
import { getOrCreateSessionId } from '@/lib/session';

type Step = 'editor' | 'endpoints';

export default function Home() {
  const [step, setStep] = useState<Step>('editor');
  const [endpoints, setEndpoints] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const handleSuccess = (newEndpoints: string[]) => {
    setEndpoints(newEndpoints);
    setSessionId(getOrCreateSessionId());
    setStep('endpoints');
  };

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
        {step === 'editor' && <JsonEditor onSuccess={handleSuccess} />}

        {step === 'endpoints' && (
          <div className="flex flex-col gap-6">
            <button
              type="button"
              onClick={() => setStep('editor')}
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
