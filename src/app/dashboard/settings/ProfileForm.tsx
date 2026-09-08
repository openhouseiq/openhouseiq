"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const fileInputClasses =
  "w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-pine file:px-3 file:py-2 file:text-sm file:font-medium file:text-paper";

async function uploadAsset(userId: string, kind: "logo" | "photo", file: File) {
  const supabase = createClient();
  const path = `${userId}/${kind}-${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("agent-assets").upload(path, file);

  if (error) {
    throw error;
  }

  return supabase.storage.from("agent-assets").getPublicUrl(path).data.publicUrl;
}

export function ProfileForm({
  userId,
  fullName,
  phone,
  logoUrl,
  photoUrl,
}: {
  userId: string;
  fullName: string;
  phone: string;
  logoUrl: string;
  photoUrl: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const logoFile = formData.get("logo");
    const photoFile = formData.get("photo");

    try {
      const [newLogoUrl, newPhotoUrl] = await Promise.all([
        logoFile instanceof File && logoFile.size > 0
          ? uploadAsset(userId, "logo", logoFile)
          : Promise.resolve(logoUrl),
        photoFile instanceof File && photoFile.size > 0
          ? uploadAsset(userId, "photo", photoFile)
          : Promise.resolve(photoUrl),
      ]);

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: String(formData.get("full_name") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          logo_url: newLogoUrl,
          photo_url: newPhotoUrl,
        },
      });

      if (updateError) {
        throw updateError;
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

      <div>
        <label htmlFor="logo" className="mb-1.5 block text-sm font-medium text-ink">
          Logo
        </label>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Current logo"
            className="mb-2 h-12 w-auto rounded border border-line bg-white object-contain p-1"
          />
        ) : null}
        <input id="logo" name="logo" type="file" accept="image/*" className={fileInputClasses} />
      </div>

      <div>
        <label htmlFor="photo" className="mb-1.5 block text-sm font-medium text-ink">
          Photo
        </label>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Current photo"
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
      {saved ? <p className="text-sm text-pine">Saved.</p> : null}

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
