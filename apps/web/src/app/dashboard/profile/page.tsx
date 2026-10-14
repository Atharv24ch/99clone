"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { accountService } from "@/services/properties";
import { errorMessage } from "@/services/api";
import { PageTitle } from "@/components/dashboard/DashboardShell";

const ROLE_LABEL: Record<string, string> = {
  buyer: "Buyer or tenant",
  seller: "Owner",
  agent: "Agent or broker",
  builder: "Builder",
  admin: "Moderator",
};

export default function ProfilePage() {
  const { user, token, updateUser } = useAuthStore();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", agencyName: "", reraNumber: "", bio: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName,
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      agencyName: user.agencyName ?? "",
      reraNumber: user.reraNumber ?? "",
      bio: user.bio ?? "",
    });
  }, [user]);

  const save = useMutation({
    mutationFn: () =>
      accountService.update(
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim() || null,
          phone: form.phone.trim() || null,
          agencyName: form.agencyName.trim() || null,
          reraNumber: form.reraNumber.trim() || null,
          bio: form.bio.trim() || null,
        },
        token!
      ),
    onSuccess: (res) => {
      updateUser(res.data);
      setSaved(true);
    },
  });

  if (!user) return null;
  const professional = user.role === "agent" || user.role === "builder";

  const input = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`profile-${key}`} className="field-label">{label}</label>
      <input
        id={`profile-${key}`}
        value={form[key]}
        onChange={(e) => {
          setSaved(false);
          setForm((f) => ({ ...f, [key]: e.target.value }));
        }}
        className="input-line"
        {...props}
      />
    </div>
  );

  return (
    <>
      <PageTitle title="Profile" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.firstName.trim()) return;
          save.mutate();
        }}
        className="max-w-2xl space-y-7"
        noValidate
      >
        <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <p><span className="text-ink-soft">Email </span><span className="text-ink">{user.email ?? "Not set"}</span></p>
          <p><span className="text-ink-soft">Account type </span><span className="text-ink">{ROLE_LABEL[user.role] ?? user.role}</span></p>
        </div>

        <div className="grid gap-7 sm:grid-cols-2">
          {input("firstName", "First name", { autoComplete: "given-name", required: true })}
          {input("lastName", "Last name", { autoComplete: "family-name" })}
          {input("phone", "Phone", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+91 98765 43210" })}
        </div>

        {professional && (
          <div className="grid gap-7 sm:grid-cols-2">
            {input("agencyName", user.role === "builder" ? "Company name" : "Agency name")}
            {input("reraNumber", "RERA registration no.")}
          </div>
        )}

        <div>
          <label htmlFor="profile-bio" className="field-label">About you</label>
          <textarea
            id="profile-bio"
            rows={4}
            maxLength={2000}
            value={form.bio}
            onChange={(e) => {
              setSaved(false);
              setForm((f) => ({ ...f, bio: e.target.value }));
            }}
            className="input-box mt-1 resize-y"
            placeholder="A line or two buyers will see next to your listings"
          />
        </div>

        {save.isError && <p role="alert" className="text-sm text-danger">{errorMessage(save.error)}</p>}

        <div className="flex items-center gap-4">
          <button type="submit" className="btn-seal" disabled={save.isPending || !form.firstName.trim()}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Save changes
          </button>
          {saved && <p role="status" className="text-sm text-stamp-dark">Saved</p>}
        </div>
      </form>
    </>
  );
}
