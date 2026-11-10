import { describe, expect, it } from "vitest";
import {
  parseIntakeMessage,
  getNextIntakeQuestion,
  INTAKE_FIELD_SEQUENCE,
} from "@/lib/engine/intake";
import type { PartialProfile, Profile } from "@/lib/engine/types";

describe("lib/engine/intake - profile field extraction and keyword rules", () => {
  it("extracts goal variants deterministically", () => {
    expect(parseIntakeMessage("I want to grow my wealth").profile.goal).toBe("grow_wealth");
    expect(parseIntakeMessage("Looking for regular dividend income").profile.goal).toBe("dividends");
    expect(parseIntakeMessage("Want to learn how the market works").profile.goal).toBe("learn");
    expect(parseIntakeMessage("Protect what I have and avoid capital loss").profile.goal).toBe("preserve");
    expect(parseIntakeMessage("Need safety of capital").profile.goal).toBe("preserve");
  });

  it("extracts horizon variants deterministically", () => {
    expect(parseIntakeMessage("Need this money in 1 to 3 years").profile.horizon).toBe("1_3y");
    expect(parseIntakeMessage("Horizon is 3-5 years").profile.horizon).toBe("3_5y");
    expect(parseIntakeMessage("5+ years horizon for investment").profile.horizon).toBe("5_10y");
    expect(parseIntakeMessage("Long term >5y horizon").profile.horizon).toBe("5_10y");
    expect(parseIntakeMessage("10+ years retirement corpus").profile.horizon).toBe("10y_plus");
    expect(parseIntakeMessage("<1y short horizon").profile.horizon).toBe("1_3y");
  });

  it("extracts riskComfort variants including percentages and unsure", () => {
    expect(parseIntakeMessage("Low risk investor").profile.riskComfort).toBe("low");
    expect(parseIntakeMessage("Can tolerate about 10% drop").profile.riskComfort).toBe("low");
    expect(parseIntakeMessage("Medium risk appetite").profile.riskComfort).toBe("medium");
    expect(parseIntakeMessage("Moderate risk, around 20% drop").profile.riskComfort).toBe("medium");
    expect(parseIntakeMessage("High risk, 30% drop or more").profile.riskComfort).toBe("high");
    expect(parseIntakeMessage("Aggressive growth").profile.riskComfort).toBe("high");
    expect(parseIntakeMessage("Not sure about risk").profile.riskComfort).toBe("unsure");
    expect(parseIntakeMessage("I am confused and unsure").profile.riskComfort).toBe("unsure");
  });

  it("extracts experience levels accurately", () => {
    expect(parseIntakeMessage("I am a student with no experience").profile.experience).toBe("none");
    expect(parseIntakeMessage("Never bought a stock before").profile.experience).toBe("none");
    expect(parseIntakeMessage("Bought a few stocks in the past").profile.experience).toBe("few");
    expect(parseIntakeMessage("Only done mutual fund SIPs so far").profile.experience).toBe("sip");
  });

  it("extracts locale preferences", () => {
    expect(parseIntakeMessage("Please reply in English").profile.locale).toBe("en");
    expect(parseIntakeMessage("Hinglish mein baat karo").profile.locale).toBe("hi-en");
  });
});

describe("lib/engine/intake - one-line profile parsing & rupee amounts", () => {
  it("parses one-line profile: '21, student, ₹1,000 monthly SIP, 5+ year horizon, medium risk. I have ₹10,000 saved. Help me pick a few stocks to start with.'", () => {
    const input =
      "21, student, ₹1,000 monthly SIP, 5+ year horizon, medium risk. I have ₹10,000 saved. Help me pick a few stocks to start with.";

    const result = parseIntakeMessage(input);

    // Profile fields
    expect(result.profile.experience).toBe("none");
    expect(result.profile.horizon).toBe("5_10y");
    expect(result.profile.riskComfort).toBe("medium");
    // "start" triggers assumed grow_wealth
    expect(result.profile.goal).toBe("grow_wealth");
    expect(result.assumed).toContain("goal");
    expect(result.explicit).toContain("experience");
    expect(result.explicit).toContain("horizon");
    expect(result.explicit).toContain("riskComfort");

    // Rupee amounts must NOT be stored in profile
    const profileKeys = Object.keys(result.profile);
    for (const key of profileKeys) {
      expect(["goal", "horizon", "riskComfort", "experience", "locale"]).toContain(key);
    }
    // Profile must never have amounts
    expect((result.profile as Record<string, unknown>).amount).toBeUndefined();
    expect((result.profile as Record<string, unknown>).sip).toBeUndefined();

    // But amounts are extracted in entities for audit/boundary checking
    expect(result.entities.amounts.length).toBeGreaterThanOrEqual(2);
    const sipAmount = result.entities.amounts.find((a) => a.type === "sip");
    expect(sipAmount?.value).toBe(1000);
    const savedAmount = result.entities.amounts.find((a) => a.value === 10000);
    expect(savedAmount).toBeDefined();
  });

  it("preserves existing fields when merging partial answers", () => {
    const current: PartialProfile = { goal: "dividends", locale: "en" };
    const result = parseIntakeMessage("3 to 5 years, low risk", current);

    expect(result.profile.goal).toBe("dividends");
    expect(result.profile.locale).toBe("en");
    expect(result.profile.horizon).toBe("3_5y");
    expect(result.profile.riskComfort).toBe("low");
    expect(result.explicit).toContain("horizon");
    expect(result.explicit).toContain("riskComfort");
  });
});

describe("lib/engine/intake - entity extraction (tickers, sectors)", () => {
  it("extracts covered tickers and company aliases", () => {
    const result = parseIntakeMessage("Compare Infosys and TCS or Reliance");
    expect(result.entities.tickers).toContain("INFY");
    expect(result.entities.tickers).toContain("TCS");
    expect(result.entities.tickers).toContain("RELIANCE");
  });

  it("extracts sector names", () => {
    const result = parseIntakeMessage("Show me IT and Banking sector companies");
    expect(result.entities.sectors).toContain("it");
    expect(result.entities.sectors).toContain("financial");
  });
});

describe("lib/engine/intake - question sequence & progression", () => {
  it("enforces fixed question progression order: goal -> horizon -> riskComfort -> experience -> locale", () => {
    expect(INTAKE_FIELD_SEQUENCE).toEqual(["goal", "horizon", "riskComfort", "experience", "locale"]);

    // 1. Empty profile asks goal
    const q1 = getNextIntakeQuestion({}, "en");
    expect(q1?.type).toBe("intake_question");
    if (q1?.type === "intake_question") {
      expect(q1.field).toBe("goal");
      expect(q1.options.length).toBe(4);
    }

    // 2. Goal present -> asks horizon
    const q2 = getNextIntakeQuestion({ goal: "grow_wealth" }, "en");
    expect(q2?.type).toBe("intake_question");
    if (q2?.type === "intake_question") {
      expect(q2.field).toBe("horizon");
      expect(q2.options.length).toBe(4);
    }

    // 3. Goal + horizon present -> asks riskComfort
    const q3 = getNextIntakeQuestion({ goal: "grow_wealth", horizon: "5_10y" }, "en");
    expect(q3?.type).toBe("intake_question");
    if (q3?.type === "intake_question") {
      expect(q3.field).toBe("riskComfort");
      expect(q3.options.length).toBe(4);
    }

    // 4. Goal + horizon + riskComfort present -> asks experience
    const q4 = getNextIntakeQuestion({ goal: "grow_wealth", horizon: "5_10y", riskComfort: "medium" }, "en");
    expect(q4?.type).toBe("intake_question");
    if (q4?.type === "intake_question") {
      expect(q4.field).toBe("experience");
      expect(q4.options.length).toBe(3);
    }

    // 5. 4 fields present -> asks locale
    const q5 = getNextIntakeQuestion(
      { goal: "grow_wealth", horizon: "5_10y", riskComfort: "medium", experience: "sip" },
      "en",
    );
    expect(q5?.type).toBe("intake_question");
    if (q5?.type === "intake_question") {
      expect(q5.field).toBe("locale");
      expect(q5.options.length).toBe(2);
    }

    // 6. Complete profile -> returns null
    const complete: Profile = {
      goal: "grow_wealth",
      horizon: "5_10y",
      riskComfort: "medium",
      experience: "sip",
      locale: "en",
    };
    const q6 = getNextIntakeQuestion(complete, "en");
    expect(q6).toBeNull();
  });

  it("provides localized questions and options in Hinglish", () => {
    const qHi = getNextIntakeQuestion({ goal: "grow_wealth" }, "hi-en");
    expect(qHi?.type).toBe("intake_question");
    if (qHi?.type === "intake_question") {
      expect(qHi.field).toBe("horizon");
      expect(qHi.question).toContain("paise ki zaroorat");
      expect(qHi.options[0].label).toContain("1 se 3 saal");
    }
  });
});

describe("lib/engine/intake - conversation stages", () => {
  it("determines conversation stage transitions", () => {
    // New
    expect(parseIntakeMessage("Hello there").stage).toBe("new");

    // Profiling
    expect(parseIntakeMessage("1 to 3 years").stage).toBe("profiling");

    // Shortlisting
    expect(parseIntakeMessage("Give me a shortlist of stocks").stage).toBe("shortlisting");

    // Comparing
    expect(parseIntakeMessage("Compare TCS and INFY").stage).toBe("comparing");

    // Exploring
    expect(parseIntakeMessage("Tell me about ITC debt").stage).toBe("exploring");

    // Educating
    expect(parseIntakeMessage("What is PE ratio?").stage).toBe("educating");
  });
});
