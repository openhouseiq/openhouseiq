"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SellerPreferenceFields } from "@/components/listings/SellerPreferenceFields";
import type { Listing } from "@/lib/types";

export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const formData = new FormData(e.currentTarget);
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

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        address,
        price,
        bedrooms,
        bathrooms,
        car_spaces: carSpaces,
        sqft,
        description,
        seller_pref_price: sellerPrefPrice,
        seller_pref_settlement: sellerPrefSettlement,
        seller_pref_waive_inspection: sellerPrefWaiveInspection,
        seller_pref_finance_approved: sellerPrefFinanceApproved,
        seller_pref_cash_buyer: sellerPrefCashBuyer,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listing.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push(`/dashboard/listings/${listing.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <Field
        label="Full address"
        id="address"
        type="text"
        placeholder="123 Main St, Bellview NSW 2153"
        defaultValue={listing.address}
        required
      />
      <Field
        label="Price"
        id="price"
        type="number"
        min={0}
        step="1"
        defaultValue={listing.price}
        required
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field
          label="Bedrooms"
          id="bedrooms"
          type="number"
          min={0}
          step="1"
          defaultValue={listing.bedrooms ?? undefined}
        />
        <Field
          label="Bathrooms"
          id="bathrooms"
          type="number"
          min={0}
          step="0.5"
          defaultValue={listing.bathrooms ?? undefined}
        />
        <Field
          label="Car spaces"
          id="carSpaces"
          type="number"
          min={0}
          step="1"
          defaultValue={listing.car_spaces ?? undefined}
        />
        <Field
          label="Sqft"
          id="sqft"
          type="number"
          min={0}
          step="1"
          defaultValue={listing.sqft ?? undefined}
        />
      </div>

      <TextAreaField
        label="Description"
        id="description"
        rows={4}
        defaultValue={listing.description ?? undefined}
      />

      <SellerPreferenceFields
        defaults={{
          sellerPrefPrice: listing.seller_pref_price,
          sellerPrefSettlement: listing.seller_pref_settlement,
          sellerPrefWaiveInspection: listing.seller_pref_waive_inspection,
          sellerPrefFinanceApproved: listing.seller_pref_finance_approved,
          sellerPrefCashBuyer: listing.seller_pref_cash_buyer,
        }}
      />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
