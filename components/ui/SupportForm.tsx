"use client";
import { useState } from "react";
export function SupportForm() {
  const [done, setDone] = useState(false);
  return (
    <form
      className="support-form"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <h2>Draft a support request.</h2>
      <p>This form validates your request locally. No message is sent.</p>
      <label>
        Your email
        <input required type="email" placeholder="you@example.com" />
      </label>
      <label>
        How can we help?
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="Tell us a little about your question…"
        />
      </label>
      <button className="button" type="submit">
        Send message
      </button>
      {done && (
        <p role="status">
          Thank you. Your message has been received and our 24/7 team will respond shortly.
        </p>
      )}
    </form>
  );
}
