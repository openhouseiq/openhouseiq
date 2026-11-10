import { describe, expect, it } from "vitest";
import { buildAnswers, cleanQuestions, parseAnswers, parseQuestions } from "./customQuestions";
import { ValidationError } from "./validate";
import { buildThankYouEmail, safeDisplayName } from "./visitorThankYou";
import { feedbackRecord } from "./crm/record";

describe("custom questions", () => {
  it("keeps up to three trimmed, non-blank questions", () => {
    expect(cleanQuestions(["  Selling too? ", "", null, "Q2", "Q3", "Q4"])).toEqual(["Selling too?", "Q2", "Q3"]);
  });

  it("cuts very long questions to 140 characters", () => {
    expect(cleanQuestions(["x".repeat(200)])[0]).toHaveLength(140);
  });

  it("reads saved questions defensively", () => {
    expect(parseQuestions(null)).toEqual([]);
    expect(parseQuestions("nope")).toEqual([]);
    expect(parseQuestions(["A", 5, "B"])).toEqual(["A", "B"]);
  });

  it("pairs answers with questions by position and skips blanks", () => {
    expect(buildAnswers(["Selling too?", "What would stop you?"], ["Yes, in 6 months", "  "])).toEqual([
      { question: "Selling too?", answer: "Yes, in 6 months" },
    ]);
  });

  it("ignores answers to questions that don't exist", () => {
    expect(buildAnswers(["Only one"], ["a", "b"])).toEqual([{ question: "Only one", answer: "a" }]);
  });

  it("treats missing answers as none", () => {
    expect(buildAnswers(["Q"], undefined)).toEqual([]);
  });

  it("rejects bad input", () => {
    expect(() => buildAnswers(["Q"], "text")).toThrow(ValidationError);
    expect(() => buildAnswers(["Q"], [42])).toThrow(ValidationError);
    expect(() => buildAnswers(["Q"], ["x".repeat(501)])).toThrow(ValidationError);
    expect(() => buildAnswers(["Q"], ["a", "b", "c", "d"])).toThrow(ValidationError);
  });

  it("reads saved answers defensively", () => {
    expect(parseAnswers([{ question: "Q", answer: "A" }, { question: 1 }, "x"])).toEqual([{ question: "Q", answer: "A" }]);
  });

  it("adds answers to the CRM note", () => {
    const record = feedbackRecord(
      {
        id: "f1",
        is_anonymous: false,
        name: "Sam Visitor",
        email: "sam@example.com",
        phone: null,
        comments: null,
        interest_level: "considering",
        rating_price: null,
        rating_condition: null,
        rating_location: null,
        rating_layout: null,
        pre_approved: null,
        working_with_agent: null,
        purchase_timeframe: null,
        wants_followup: null,
        custom_answers: [{ question: "Selling too?", answer: "Yes" }],
        created_at: "2026-11-10T00:00:00Z",
      },
      { id: "l1", address: "5 Tent St" },
    );
    expect(record?.body).toContain("Selling too?: Yes");
  });
});

describe("visitor thank-you email", () => {
  const base = {
    visitorName: "Sam Visitor",
    address: "5 Tent St, West QLD",
    agentName: "Mick Orr",
    agentEmail: "mick@example.com",
    agentPhone: "0400 000 000",
  };

  it("thanks a feedback visitor by first name and signs off as the agent", () => {
    const { subject, body } = buildThankYouEmail({ ...base, kind: "feedback", wantsFollowup: true });
    expect(subject).toBe("Thanks for visiting 5 Tent St, West QLD");
    expect(body).toContain("Hi Sam,");
    expect(body).toContain("Mick Orr has your details and will call you back soon.");
    expect(body).toContain("Mick Orr\n0400 000 000\nmick@example.com");
  });

  it("doesn't promise a follow-up the visitor didn't ask for", () => {
    const { body } = buildThankYouEmail({ ...base, kind: "feedback", wantsFollowup: false });
    expect(body).toContain("Mick Orr has your details.");
  });

  it("confirms an offer without accepting it", () => {
    const { subject, body } = buildThankYouEmail({ ...base, kind: "offer" });
    expect(subject).toBe("Your offer on 5 Tent St, West QLD has been received");
    expect(body).toContain("It is not an acceptance of the offer.");
  });

  it("leaves out a missing phone number", () => {
    const { body } = buildThankYouEmail({ ...base, kind: "offer", agentPhone: null });
    expect(body).toContain("Mick Orr\nmick@example.com");
  });

  it("makes the agent's name safe for the From header", () => {
    expect(safeDisplayName('Mick "the" <Hero>\r\nBcc: x')).toBe("Mick the Hero Bcc: x");
  });
});

import { parseOfferAmount } from "./offerAmount";

describe("offer amount typing", () => {
  it("reads the ways buyers type amounts", () => {
    expect(parseOfferAmount("750000")).toBe(750000);
    expect(parseOfferAmount("$750,000")).toBe(750000);
    expect(parseOfferAmount(" 750 000 ")).toBe(750000);
    expect(parseOfferAmount("750k")).toBe(750000);
    expect(parseOfferAmount("1.25m")).toBe(1250000);
    expect(parseOfferAmount("1.2M")).toBe(1200000);
  });

  it("refuses anything that isn't an amount", () => {
    expect(parseOfferAmount("")).toBeNull();
    expect(parseOfferAmount("abc")).toBeNull();
    expect(parseOfferAmount("0")).toBeNull();
    expect(parseOfferAmount("750,000 or best")).toBeNull();
  });
});
