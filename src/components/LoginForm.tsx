'use client';

import { useState } from 'react';

import { ApiError, requestLoginOtp, verifyLoginOtp } from '@/lib/api';
import { saveCustomerSession } from '@/lib/customer-auth';
import { isValidEmail } from '@/lib/validation';

/**
 * Email + OTP sign-in. No password: the shop never asks a returning shopper
 * to remember one, and a 6-digit code emailed on demand is enough proof of
 * the inbox to unlock order history — nothing more sensitive lives behind it.
 */
export function LoginForm({ onSignedIn }: { onSignedIn: () => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await requestLoginOtp(email.trim().toLowerCase());
      setStep('code');
      setNotice(`We sent a 6-digit code to ${email.trim()}. It expires in 10 minutes.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.friendlyMessage : 'Could not send a code just now.');
    } finally {
      setLoading(false);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await verifyLoginOtp(email.trim().toLowerCase(), code);
      saveCustomerSession(result.token);
      onSignedIn();
    } catch (err) {
      setError(err instanceof ApiError ? err.friendlyMessage : 'Could not verify that code just now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="aw-card p-6 sm:p-8">
        <h2 className="text-xl">Sign in</h2>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
          {step === 'email'
            ? "Enter your email and we'll send a one-time code — no password needed."
            : 'Enter the code we just emailed you.'}
        </p>

        {step === 'email' ? (
          <form onSubmit={sendCode} className="mt-6" noValidate>
            <label htmlFor="login-email" className="aw-label">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="aw-field"
            />
            {error ? (
              <p className="aw-error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={loading} className="aw-btn aw-btn-primary mt-5 w-full">
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-6" noValidate>
            {notice ? <p className="mb-4 text-[0.8125rem] leading-relaxed text-muted">{notice}</p> : null}
            <label htmlFor="login-code" className="aw-label">
              6-digit code
            </label>
            <input
              id="login-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              className="aw-field tracking-[0.3em]"
            />
            {error ? (
              <p className="aw-error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={loading} className="aw-btn aw-btn-primary mt-5 w-full">
              {loading ? 'Verifying…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setError(null);
              }}
              className="mt-3 w-full text-center text-xs text-muted underline underline-offset-4"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
