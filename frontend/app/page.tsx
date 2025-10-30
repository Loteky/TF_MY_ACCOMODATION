'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { login, register, loading, officer } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formState, setFormState] = useState({
    service_number: '',
    official_email: '',
    full_name: '',
    rank: '',
    station: '',
  });
  const [error, setError] = useState<string | null>(null);

  if (!loading && officer) {
    router.replace('/dashboard');
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login({
          service_number: formState.service_number,
          official_email: formState.official_email,
        });
      } else {
        await register(formState);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'We could not complete that request.');
    }
  };

  return (
    <main>
      <div className="card" style={{ maxWidth: '480px', margin: '4rem auto' }}>
        <h1>Naval House Handover</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          Secure accommodation management for Nigerian Navy officers. Please use your service credentials.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{
              background: mode === 'login' ? 'var(--accent)' : '#e0e7ef',
              color: mode === 'login' ? 'white' : 'var(--text)',
              flex: 1,
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            style={{
              background: mode === 'register' ? 'var(--accent)' : '#e0e7ef',
              color: mode === 'register' ? 'white' : 'var(--text)',
              flex: 1,
            }}
          >
            Register
          </button>
        </div>
        {error && (
          <div style={{ background: '#ffe5e5', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label>
            Service number
            <input
              required
              value={formState.service_number}
              onChange={(e) => setFormState({ ...formState, service_number: e.target.value })}
            />
          </label>
          <label>
            Official e-mail
            <input
              type="email"
              required
              value={formState.official_email}
              onChange={(e) => setFormState({ ...formState, official_email: e.target.value })}
              placeholder="name@navy.mil.ng"
            />
          </label>
          {mode === 'register' && (
            <>
              <label>
                Full name
                <input
                  required
                  value={formState.full_name}
                  onChange={(e) => setFormState({ ...formState, full_name: e.target.value })}
                />
              </label>
              <label>
                Rank
                <input
                  required
                  value={formState.rank}
                  onChange={(e) => setFormState({ ...formState, rank: e.target.value })}
                />
              </label>
              <label>
                Station
                <input
                  required
                  value={formState.station}
                  onChange={(e) => setFormState({ ...formState, station: e.target.value })}
                />
              </label>
            </>
          )}
          <button type="submit">{mode === 'login' ? 'Sign in securely' : 'Register new officer'}</button>
        </form>
      </div>
    </main>
  );
}
