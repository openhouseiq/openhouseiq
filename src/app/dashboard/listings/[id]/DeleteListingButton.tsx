"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function DeleteListingButton({
  listingId,
  label = "Delete listing",
}: {
  listingId: string;
  label?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this listing? This cannot be undone.")) return;

    setDeleting(true);
    const supabase = createClient();
    await supabase.from("listings").delete().eq("id", listingId);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button variant="danger" onClick={handleDelete} disabled={deleting}>
      {deleting ? "Deleting…" : label}
    </Button>
  );
}
