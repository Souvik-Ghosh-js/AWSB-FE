'use client';

import { useState } from 'react';

import { ApiError, requestReplacement } from '@/lib/api';
import { getToken } from '@/lib/customer-auth';

const MIN_REASON_LENGTH = 20;

/**
 * The complaint step of a replacement request. There is no in-app upload for
 * the unboxing video — the confirmation email that follows tells the
 * customer to reply with photos and a video of the unboxing recorded from
 * before the package was first opened.
 */
export function ReplacementRequestForm({
  orderItemId,
  onDone,
}: {
  orderItemId: number;
  onDone: (requestNumber: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError('Please describe the defect in a bit more detail.');
      return;
    }
    const token = getToken();
    if (!token) {
      setError('Your session has expired. Please sign in again.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await requestReplacement(token, { orderItemId, reason: reason.trim() });
      onDone(result.requestNumber);
    } catch (err) {
      setError(err instanceof ApiError ? err.friendlyMessage : 'Could not submit this just now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 border-t border-line pt-4" noValidate>
      <label htmlFor={`reason-${orderItemId}`} className="aw-label">
        What is wrong with this item?
      </label>
      <textarea
        id={`reason-${orderItemId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        placeholder="Describe the defect — e.g. the bottle arrived cracked and had leaked in transit."
        className="aw-field"
      />
      <p className="aw-hint">
        After you submit, we will email you asking for photos and a video of the unboxing —
        recorded from before the package was first opened.
      </p>
      {error ? (
        <p className="aw-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className="aw-btn aw-btn-primary aw-btn-sm mt-3">
        {loading ? 'Submitting…' : 'Submit complaint'}
      </button>
    </form>
  );
}
