'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}>
      <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: 32, maxWidth: 420, width: '100%', boxShadow: 'var(--shadow-md)' }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.5px' }}>
          Welcome to NeuroHome
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>
          Enter your email and we&apos;ll send you a sign-in link.
        </p>

        {sent ? (
          <div style={{ padding: 16, background: 'var(--accent-green-light)', borderRadius: 12, color: '#058831', fontSize: 14 }}>
            ✓ Check your inbox. The sign-in link expires in 1 hour.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, marginBottom: 12, outline: 'none' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px 24px', background: 'var(--text)', color: '#fff', border: 'none', borderRadius: 100, fontWeight: 600, fontSize: 14 }}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
            {error && <div style={{ marginTop: 12, color: 'var(--accent-red)', fontSize: 13 }}>{error}</div>}
          </form>
        )}
      </div>
    </main>
  );
}
