"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ListingPhoto } from "@/lib/types";

type PhotoWithUrl = ListingPhoto & { url: string };

export function ManagePhotos({ photos }: { photos: PhotoWithUrl[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(photo: PhotoWithUrl) {
    if (!confirm("Delete this photo?")) return;

    setBusyId(photo.id);
    const supabase = createClient();
    await supabase.storage.from("listing-photos").remove([photo.storage_path]);
    await supabase.from("listing_photos").delete().eq("id", photo.id);
    setBusyId(null);
    router.refresh();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const current = photos[index];
    const target = photos[targetIndex];

    setBusyId(current.id);
    const supabase = createClient();
    await Promise.all([
      supabase
        .from("listing_photos")
        .update({ position: target.position })
        .eq("id", current.id),
      supabase
        .from("listing_photos")
        .update({ position: current.position })
        .eq("id", target.id),
    ]);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <div key={photo.id} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt=""
            className="aspect-square w-full rounded-md border border-line object-cover"
          />
          {index === 0 ? (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-pine px-2 py-0.5 text-xs font-medium text-paper">
              Cover
            </span>
          ) : null}
          <div className="mt-1 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => handleMove(index, -1)}
              disabled={index === 0 || busyId === photo.id}
              className="rounded border border-line bg-white px-2 py-1 text-xs text-ink disabled:opacity-30"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => handleDelete(photo)}
              disabled={busyId === photo.id}
              className="rounded border border-error px-2 py-1 text-xs text-error disabled:opacity-30"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => handleMove(index, 1)}
              disabled={index === photos.length - 1 || busyId === photo.id}
              className="rounded border border-line bg-white px-2 py-1 text-xs text-ink disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
