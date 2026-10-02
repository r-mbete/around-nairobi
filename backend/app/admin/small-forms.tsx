"use client";

import { useActionState } from "react";

type Action = (prev: { error?: string }, form: FormData) => Promise<{ error?: string }>;

export function LoginForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="form narrow">
      {state.error && (
        <p className="banner error" role="alert">
          {state.error}
        </p>
      )}
      <label className="field">
        <span>Admin password</span>
        <input name="password" type="password" autoComplete="current-password" required autoFocus />
      </label>
      <button type="submit" className="button primary" disabled={pending}>
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}

export function RejectForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="form">
      {state.error && (
        <p className="banner error" role="alert">
          {state.error}
        </p>
      )}
      <label className="field">
        <span>Reason for the organiser</span>
        <textarea name="reason" rows={3} maxLength={500} required placeholder="e.g. This is a private event, so we can't list it." />
      </label>
      <button type="submit" className="button danger" disabled={pending}>
        {pending ? "Rejecting…" : "Reject submission"}
      </button>
    </form>
  );
}
