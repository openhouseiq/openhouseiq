"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const fileInputClasses =
  "w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-pine file:px-3 file:py-2 file:text-sm file:font-medium file:text-paper";

async function uploadHeadshot(userId: string, file: File) {
  const supabase = createClient();
  const path = `${userId}/photo-${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("agent-assets").upload(path, file);

  if (error) {
    throw error;
  }

  return supabase.storage.from("agent-assets").getPublicUrl(path).data.publicUrl;
}

export function AgentProfileForm({
  userId,
  fullName,
  phone,
  email,
  photoUrl,
}: {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  photoUrl: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [emailPending, setEmailPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setEmailPending(false);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const photoFile = formData.get("photo");
    const newEmail = String(formData.get("email") ?? "");

    try {
      const newPhotoUrl =
        photoFile instanceof File && photoFile.size > 0
          ? await uploadHeadshot(userId, photoFile)
          : photoUrl;

      const supabase = createClient();
      const { error: profileError } = await supabase.auth.updateUser({
        data: {
          full_name: String(formData.get("full_name") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          photo_url: newPhotoUrl,
        },
      });

      if (profileError) {
        throw profileError;
      }

      if (newEmail && newEmail !== email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: newEmail,
        });
        if (emailError) {
          throw emailError;
        }
        setEmailPending(true);
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Full name" id="full_name" type="text" defaultValue={fullName} required />
      <Field label="Phone" id="phone" type="tel" defaultValue={phone} />
      <Field label="Email" id="email" type="email" defaultValue={email} required />

      <div>
        <label htmlFor="photo" className="mb-1.5 block text-sm font-medium text-ink">
          Headshot
        </label>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Current headshot"
            className="mb-2 h-16 w-16 rounded-full border border-line object-cover"
          />
        ) : null}
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          className={fileInputClasses}
        />
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {emailPending ? (
        <p className="text-sm text-pine">
          Check your inbox (old and new address) to confirm your new email.
        </p>
      ) : saved ? (
        <p className="text-sm text-pine">Saved.</p>
      ) : null}

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
