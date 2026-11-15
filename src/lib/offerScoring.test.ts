import { describe, expect, it } from "vitest";
import { offerConditions, scoreOffer, sellerPriorities } from "./offerScoring";

const base = {
  offer_amount: 1_250_000,
  financing_type: "pre_approved",
  settlement_term: "45_days",
  waive_inspection: false,
};

const noPrefs = {
  price: 1_250_000,
  seller_pref_price: null,
  seller_pref_settlement: null,
  seller_pref_waive_inspection: null,
  seller_pref_finance: null,
};

describe("offerConditions", () => {
  it("lists each condition the buyer ticked", () => {
    expect(
      offerConditions({ ...base, subject_to_finance: true, subject_to_sale: true }),
    ).toEqual(["Finance", "Building & pest", "Sale of home"]);
  });

  it("is empty for an unconditional offer", () => {
    expect(
      offerConditions({ ...base, waive_inspection: true, subject_to_finance: false, subject_to_sale: false }),
    ).toEqual([]);
  });

  it("treats older offers that were arranging finance as subject to finance", () => {
    expect(offerConditions({ ...base, financing_type: "financing", waive_inspection: true })).toEqual([
      "Finance",
    ]);
    expect(offerConditions({ ...base, waive_inspection: true })).toEqual([]);
  });
});

describe("scoreOffer with the conditions preference", () => {
  const prefersFew = { ...noPrefs, seller_pref_conditions: "preferred" as const };
  const unconditionalOnly = { ...noPrefs, seller_pref_conditions: "required" as const };

  it("gives full marks to an unconditional offer", () => {
    const offer = { ...base, waive_inspection: true, subject_to_finance: false, subject_to_sale: false };
    expect(scoreOffer(offer, prefersFew).matchPercent).toBe(100);
  });

  it("takes a third off for each condition", () => {
    const one = { ...base, waive_inspection: false, subject_to_finance: false, subject_to_sale: false };
    const three = { ...base, waive_inspection: false, subject_to_finance: true, subject_to_sale: true };
    expect(scoreOffer(one, prefersFew).matchPercent).toBe(67);
    expect(scoreOffer(three, prefersFew).matchPercent).toBe(0);
  });

  it("flags conditional offers when the seller wants unconditional only", () => {
    const offer = { ...base, subject_to_finance: false, subject_to_sale: false };
    expect(scoreOffer(offer, unconditionalOnly).unmetRequired).toEqual(["Unconditional"]);
  });

  it("ignores the preference when it's 'no preference'", () => {
    expect(scoreOffer(base, { ...noPrefs, seller_pref_conditions: "no_preference" }).matchPercent).toBeNull();
  });
});

describe("sellerPriorities", () => {
  it("orders priorities by how much they count", () => {
    const list = sellerPriorities({
      seller_pref_price: "top_priority",
      seller_pref_settlement: "45_days",
      seller_pref_waive_inspection: "preferred",
      seller_pref_finance: "cash_required",
      seller_pref_conditions: "preferred",
    });
    expect(list.map((p) => p.label)).toEqual([
      "Price: Top priority",
      "Cash buyer (required)",
      "Settlement 45 days",
      "Few conditions",
      "No building & pest",
    ]);
  });

  it("leaves out preferences that don't count", () => {
    expect(
      sellerPriorities({
        seller_pref_price: "not_a_priority",
        seller_pref_settlement: "flexible",
        seller_pref_waive_inspection: "no_preference",
        seller_pref_finance: null,
        seller_pref_conditions: "no_preference",
      }),
    ).toEqual([]);
  });
});
