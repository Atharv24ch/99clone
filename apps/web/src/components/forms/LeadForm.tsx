"use client";

import React, { useState } from "react";
import { Phone, Mail, MessageSquare, Send, CheckCircle, User } from "lucide-react";
import { submitLead } from "@/services/properties";

interface LeadFormProps {
  propertyId: string;
  propertyTitle: string;
  agentName?: string;
}

export function LeadForm({ propertyId, propertyTitle, agentName }: LeadFormProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: `Hi, I'm interested in this property. Please share more details and contact me at the earliest.`,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) errs["name"] = "Please enter your full name";
    if (!form.phone.trim() || !/^\+?[\d\s\-()]{8,20}$/.test(form.phone)) {
      errs["phone"] = "Please enter a valid phone number";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs["email"] = "Please enter a valid email address";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsSubmitting(true);

    try {
      await submitLead({ propertyId, ...form });
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Enquiry Sent!</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          {agentName ? `${agentName}` : "The agent"} will contact you shortly on {form.phone}.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm text-brand-600 hover:underline"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {agentName && (
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 font-bold text-sm flex-shrink-0">
            {agentName[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-slate-500">Contact</p>
            <p className="text-sm font-semibold text-slate-800">{agentName}</p>
          </div>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="lead-name" className="block text-xs font-medium text-slate-600 mb-1.5">
          Your Name <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="lead-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Rahul Sharma"
            className={`input-base pl-10 ${errors["name"] ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}`}
          />
        </div>
        {errors["name"] && <p className="mt-1 text-xs text-red-500">{errors["name"]}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="lead-phone" className="block text-xs font-medium text-slate-600 mb-1.5">
          Phone Number <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="lead-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className={`input-base pl-10 ${errors["phone"] ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}`}
          />
        </div>
        {errors["phone"] && <p className="mt-1 text-xs text-red-500">{errors["phone"]}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="lead-email" className="block text-xs font-medium text-slate-600 mb-1.5">
          Email <span className="text-slate-400">(optional)</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="lead-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="rahul@example.com"
            className={`input-base pl-10 ${errors["email"] ? "border-red-400" : ""}`}
          />
        </div>
        {errors["email"] && <p className="mt-1 text-xs text-red-500">{errors["email"]}</p>}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="lead-message" className="block text-xs font-medium text-slate-600 mb-1.5">
          Message
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <textarea
            id="lead-message"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            rows={3}
            className="input-base pl-10 resize-none"
          />
        </div>
      </div>

      {errors["submit"] && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errors["submit"]}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        id="lead-submit-btn"
        className="btn-brand w-full gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isSubmitting ? "Sending..." : "Send Enquiry"}
      </button>

      <p className="text-center text-xs text-slate-400">
        By submitting, you agree to our{" "}
        <a href="/terms" className="text-brand-500 hover:underline">Terms of Service</a>
      </p>
    </form>
  );
}
