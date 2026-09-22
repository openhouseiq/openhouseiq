"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SellerPreferenceFields } from "@/components/listings/SellerPreferenceFields";
import { LandlordPreferenceFields } from "@/components/listings/LandlordPreferenceFields";
import type { ListingType } from "@/lib/types";

export function NewListingForm() {
  const router = useRouter();
  const [listingType, setListingType] = useState<ListingType>("sale");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const sellerPrefPrice = String(formData.get("sellerPrefPrice") ?? "") || null;
    const sellerPrefSettlement =
      String(formData.get("sellerPrefSettlement") ?? "") || null;
    const sellerPrefWaiveInspection =
      String(formData.get("sellerPrefWaiveInspection") ?? "") || null;
    const sellerPrefFinanceApproved =
      String(formData.get("sellerPrefFinanceApproved") ?? "") || null;
    const sellerPrefCashBuyer =
      String(formData.get("sellerPrefCashBuyer") ?? "") || null;
    const landlordPrefPets = String(formData.get("landlordPrefPets") ?? "") || null;
    const landlordPrefMinLeaseTerm =
      String(formData.get("landlordPrefMinLeaseTerm") ?? "") || null;
    const landlordPrefSmoking =
      String(formData.get("landlordPrefSmoking") ?? "") || null;
    const landlordPrefEmploymentVerification =
      String(formData.get("landlordPrefEmploymentVerification") ?? "") || null;

    const agentName = (user.user_metadata?.full_name as string | undefined) ?? "";

    const { data: listing, error: insertError } = await supabase
      .from("listings")
      .insert({
        agent_id: user.id,
        listing_type: listingType,
        address,
        price,
        bedrooms,
        bathrooms,
        car_spaces: carSpaces,
        sqft,
        agent_name: agentName,
        agent_email: user.email,
        ...(listingType === "sale"
          ? {
              seller_pref_price: sellerPrefPrice,
              seller_pref_settlement: sellerPrefSettlement,
              seller_pref_waive_inspection: sellerPrefWaiveInspection,
              seller_pref_finance_approved: sellerPrefFinanceApproved,
              seller_pref_cash_buyer: sellerPrefCashBuyer,
            }
          : {
              landlord_pref_pets: landlordPrefPets,
              landlord_pref_min_lease_term: landlordPrefMinLeaseTerm,
              landlord_pref_smoking: landlordPrefSmoking,
              landlord_pref_employment_verification: landlordPrefEmploymentVerification,
            }),
      })
      .select()
      .single();

    if (insertError || !listing) {
      setError(insertError?.message ?? "Could not create listing.");
      setLoading(false);
      return;
    }

    router.push(`/dashboard/listings/${listing.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <p className="mb-1.5 block text-sm font-medium text-ink">Listing type</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setListingType("sale")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              listingType === "sale"
                ? "border-pine bg-pine text-ink"
                : "border-line bg-white text-ink hover:border-pine"
            }`}
          >
            For sale
          </button>
          <button
            type="button"
            onClick={() => setListingType("rental")}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              listingType === "rental"
                ? "border-pine bg-pine text-ink"
                : "border-line bg-white text-ink hover:border-pine"
            }`}
          >
            Rental
          </button>
        </div>
      </div>

      <Field
        label="Full address"
        id="address"
        type="text"
        placeholder="123 Main St, Bellview NSW 2153"
        required
      />
      <Field
        label={listingType === "rental" ? "Weekly rent" : "Price"}
        id="price"
        type="number"
        min={0}
        step="1"
        required
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Bedrooms" id="bedrooms" type="number" min={0} step="1" />
        <Field label="Bathrooms" id="bathrooms" type="number" min={0} step="0.5" />
        <Field label="Car spaces" id="carSpaces" type="number" min={0} step="1" />
        <Field label="Sqft" id="sqft" type="number" min={0} step="1" />
      </div>

      {listingType === "sale" ? (
        <SellerPreferenceFields />
      ) : (
        <LandlordPreferenceFields />
      )}

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Create listing"}
      </Button>
    </form>
  );
}
