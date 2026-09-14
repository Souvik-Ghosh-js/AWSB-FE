'use client';

import { useState } from 'react';

import { ApiError, submitFeedback } from '@/lib/api';
import { isValidEmail } from '@/lib/validation';

/**
 * Feedback / contact form, posting to POST /feedback.
 *
 * Everything is optional except the message itself, matching the `feedback`
 * table — but an email is strongly encouraged, because without one there is no
 * way to reply.
 */
export function FeedbackForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!message.trim()) {
      setError('Please write your message.');
      return;
    }
    if (email.trim() && !isValidEmail(email)) {
      setError('That email address does not look right.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await submitFeedback({
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(subject.trim() ? { subject: subject.trim() } : {}),
        ...(orderNumber.trim() ? { orderNumber: orderNumber.trim().toUpperCase() } : {}),
        message: message.trim(),
      });

      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setOrderNumber('');
      setMessage('');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.friendlyMessage
          : 'We could not send that just now. Please email us directly instead.'
      );
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="aw-card px-6 py-12 text-center sm:px-8">
        <span
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent text-lg text-accent"
        >
          ✓
        </span>
        <h2 className="mt-5 text-2xl">Thank you — your message is with us</h2>
        <p className="mx-auto mt-3 max-w-sm text-[0.875rem] leading-relaxed text-muted">
          We read everything ourselves and usually reply within one working day.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="aw-btn aw-btn-outline aw-btn-sm mt-7"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="aw-card p-6 sm:p-8"
      noValidate
    >
      <h2 className="text-xl">Send us a message</h2>
      <hr className="aw-rule mt-4" />

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="fb-name" className="aw-label">
            Your name
          </label>
          <input
            id="fb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="aw-field"
          />
        </div>

        <div>
          <label htmlFor="fb-email" className="aw-label">
            Email
          </label>
          <input
            id="fb-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="aw-field"
          />
          <p className="aw-hint">So we can reply.</p>
        </div>

        <div>
          <label htmlFor="fb-subject" className="aw-label">
            Subject
          </label>
          <input
            id="fb-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="aw-field"
          />
        </div>

        <div>
          <label htmlFor="fb-order" className="aw-label">
            Order number
          </label>
          <input
            id="fb-order"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="AWSB-2026-00417"
            className="aw-field uppercase"
          />
          <p className="aw-hint">If your message is about an order.</p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="fb-message" className="aw-label">
            Message <span className="text-accent">*</span>
          </label>
          <textarea
            id="fb-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            maxLength={4000}
            required
            className={`aw-field resize-y ${error && !message.trim() ? 'aw-field-error' : ''}`}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="aw-error mt-4">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="aw-btn aw-btn-primary mt-7 w-full sm:w-auto"
      >
        {sending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
