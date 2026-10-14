"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { submitLead } from "@/services/properties";
import { errorMessage } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { Seal } from "@/components/paper/Seal";

interface LeadFormProps {
  propertyId: string;
  propertyTitle: string;
}

const PHONE_RE = /^\+?[\d\s\-()]{8,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadForm({ propertyId, propertyTitle }: LeadFormProps) {
  const { user, token, hasHydrated } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: `I'm interested in "${propertyTitle}". Please call me with more details.`,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // Prefill from the signed-in account
  useEffect(() => {
    if (!hasHydrated || !user) return;
    setForm((f) => ({
      ...f,
      name: f.name || [user.firstName, user.lastName].filter(Boolean).join(" "),
      phone: f.phone || user.phone || "",
      email: f.email || user.email || "",
    }));
  }, [hasHydrated, user]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs["name"] = "Enter your name";
    if (!PHONE_RE.test(form.phone.trim())) errs["phone"] = "Enter a phone number with at least 8 digits";
    if (form.email && !EMAIL_RE.test(form.email.trim())) errs["email"] = "This email address looks incomplete";
    return errs;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await submitLead(
        {
          propertyId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          message: form.message.trim() || undefined,
        },
        token
      );
      setSent(true);
    } catch (err) {
      setErrors({ submit: errorMessage(err, "Your enquiry didn't go through. Please try again.") });
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center py-6 text-center" role="status">
        <Seal size={112} center="Sent" sub="ENQUIRY" ring="ENQUIRY RECEIVED · AANGAN REGISTRY ·" animate />
        <p className="mt-5 font-display text-2xl text-ink">Enquiry sent</p>
        <p className="mt-1 max-w-[30ch] text-sm text-ink-soft">
          The lister has your details and will call you on <span className="tabular font-semibold text-ink">{form.phone}</span>.
        </p>
        <button type="button" onClick={() => setSent(false)} className="link-ink mt-5 text-sm">
          Send another enquiry
        </button>
      </div>
    );
  }

  const field = (key: "name" | "phone" | "email", label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`lead-${key}`} className="field-label">{label}</label>
      <input
        id={`lead-${key}`}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `lead-${key}-err` : undefined}
        className="input-line"
        {...props}
      />
      {errors[key] && <p id={`lead-${key}-err`} className="mt-1 text-xs text-danger">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {field("name", "Your name", { autoComplete: "name", placeholder: "Full name" })}
      {field("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "+91 98765 43210" })}
      {field("email", "Email (optional)", { type: "email", autoComplete: "email", placeholder: "you@example.com" })}
      <div>
        <label htmlFor="lead-message" className="field-label">Message</label>
        <textarea
          id="lead-message"
          rows={3}
          maxLength={1000}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="input-box mt-1 resize-none text-sm"
        />
      </div>

      {errors["submit"] && (
        <p role="alert" className="rounded-sheet border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
          {errors["submit"]}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-seal w-full !py-3">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {submitting ? "Sending" : "Send enquiry"}
      </button>
    </form>
  );
}
