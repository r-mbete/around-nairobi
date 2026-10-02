"use client";

import { type InputHTMLAttributes, useActionState } from "react";

import { CATEGORIES } from "@/lib/categories";
import type { FormState, ReviewValues } from "@/lib/review-form";

type Props = {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  defaults: ReviewValues;
  submitLabel: string;
};

/** Shared form for approving a submission and editing an event. Times are entered in Nairobi time. */
export function ReviewForm({ action, defaults, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const v = state.values ?? defaults;
  const err = state.fields ?? {};

  const field = (name: keyof ReviewValues, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="field">
      <span>{label}</span>
      <input name={name} defaultValue={v[name]} aria-invalid={!!err[name]} {...props} />
      {err[name] && <small className="error">{err[name]}</small>}
    </label>
  );

  return (
    // key resets uncontrolled inputs to the values returned with an error
    <form action={formAction} className="form" key={JSON.stringify(v)}>
      {state.error && (
        <p className="banner error" role="alert">
          {state.error}
        </p>
      )}

      {field("title", "Title", { maxLength: 80, required: true })}
      <label className="field">
        <span>Category</span>
        <select name="category" defaultValue={v.category}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>

      <div className="row">
        {field("startsAt", "Starts (Nairobi time)", { type: "datetime-local", required: true })}
        {field("endsAt", "Ends (Nairobi time)", { type: "datetime-local", required: true })}
      </div>

      <div className="row">
        {field("venueName", "Venue", { required: true })}
        {field("neighbourhood", "Neighbourhood", { required: true })}
      </div>
      {field("address", "Address or landmark", { required: true })}
      <div className="row">
        {field("lat", "Latitude", { inputMode: "decimal", placeholder: "-1.2641", required: true })}
        {field("lng", "Longitude", { inputMode: "decimal", placeholder: "36.8029", required: true })}
      </div>
      <p className="hint">Right-click the venue in Google Maps to copy its coordinates. Needed for “Get directions”.</p>

      <div className="row">
        {field("organiser", "Organiser (shown in the app)", { required: true })}
        {field("price", "Price in KES (blank = free)", { inputMode: "numeric" })}
      </div>

      <label className="field">
        <span>Description</span>
        <textarea name="description" defaultValue={v.description} maxLength={1000} rows={5} aria-invalid={!!err.description} />
        {err.description && <small className="error">{err.description}</small>}
      </label>
      {field("link", "Tickets or info link", { type: "url", required: true })}

      <button type="submit" className="button primary" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
