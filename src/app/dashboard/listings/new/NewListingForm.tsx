"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SellerPreferenceFields } from "@/components/listings/SellerPreferenceFields";

export function NewListingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<FileList | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const formData = new FormData(form);
    const address = String(formData.get("address") ?? "");
    const price = Number(formData.get("price"));
    const bedrooms = formData.get("bedrooms") ? Number(formData.get("bedrooms")) : null;
    const bathrooms = formData.get("bathrooms") ? Number(formData.get("bathrooms")) : null;
    const carSpaces = formData.get("carSpaces") ? Number(formData.get("carSpaces")) : null;
    const sqft = formData.get("sqft") ? Number(formData.get("sqft")) : null;
    const description = String(formData.get("description") ?? "");
    const sellerPrefPrice = String(formData.get("sellerPrefPrice") ?? "") || null;
    const sellerPrefSettlement =
      String(formData.get("sellerPrefSettlement") ?? "") || null;
    const sellerPrefWaiveInspection =
      String(formData.get("sellerPrefWaiveInspection") ?? "") || null;
    const sellerPrefFinanceApproved =
      String(formData.get("sellerPrefFinanceApproved") ?? "") || null;
    const sellerPrefCashBuyer =
      String(formData.get("sellerPrefCashBuyer") ?? "") || null;

    const agentName = (user.user_metadata?.full_name as string | undefined) ?? "";

    const { data: listing, error: insertError } = await supabase
      .from("listings")
      .insert({
        agent_id: user.id,
        address,
        price,
        bedrooms,
        bathrooms,
        car_spaces: carSpaces,
        sqft,
        description,
        agent_name: agentName,
        agent_email: user.email,
        seller_pref_price: sellerPrefPrice,
        seller_pref_settlement: sellerPrefSettlement,
        seller_pref_waive_inspection: sellerPrefWaiveInspection,
        seller_pref_finance_approved: sellerPrefFinanceApproved,
        seller_pref_cash_buyer: sellerPrefCashBuyer,
      })
      .select()
      .single();

    if (insertError || !listing) {
      setError(insertError?.message ?? "Could not create listing.");
      setLoading(false);
      return;
    }

    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const path = `${user.id}/${listing.id}/${crypto.randomUUID()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(path, file);

        if (!uploadError) {
          await supabase
            .from("listing_photos")
            .insert({ listing_id: listing.id, storage_path: path, position: i });
        }
      }
    }

    router.push(`/dashboard/listings/${listing.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <Field label="Address" id="address" type="text" required />
      <Field label="Price" id="price" type="number" min={0} step="1" required />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Bedrooms" id="bedrooms" type="number" min={0} step="1" />
        <Field label="Bathrooms" id="bathrooms" type="number" min={0} step="0.5" />
        <Field label="Car spaces" id="carSpaces" type="number" min={0} step="1" />
        <Field label="Sqft" id="sqft" type="number" min={0} step="1" />
      </div>

      <TextAreaField label="Description" id="description" rows={4} />

      <SellerPreferenceFields />

      <div>
        <label htmlFor="photos" className="mb-1.5 block text-sm font-medium text-ink">
          Photos
        </label>
        <input
          id="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setPhotos(e.target.files)}
          className="w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-pine file:px-3 file:py-2 file:text-sm file:font-medium file:text-paper"
        />
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Create listing"}
      </Button>
    </form>
  );
}
