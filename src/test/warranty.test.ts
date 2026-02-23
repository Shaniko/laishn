import { describe, it, expect } from "vitest";
import { getWarrantyStatus } from "@/pages/ItemView";

const mockT = (key: string) => {
  const map: Record<string, string> = {
    "warranty.not_set": "לא הוגדרה",
    "warranty.active_label": "אחריות פעילה",
    "warranty.expired_label": "אחריות פגה",
  };
  return map[key] || key;
};

describe("getWarrantyStatus", () => {
  it("returns active for future date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = getWarrantyStatus(future.toISOString(), mockT);
    expect(result.label).toBe("אחריות פעילה");
    expect(result.variant).toBe("default");
  });

  it("returns expired for past date", () => {
    const past = new Date();
    past.setFullYear(past.getFullYear() - 1);
    const result = getWarrantyStatus(past.toISOString(), mockT);
    expect(result.label).toBe("אחריות פגה");
    expect(result.variant).toBe("destructive");
  });

  it("returns undefined for null", () => {
    const result = getWarrantyStatus(null, mockT);
    expect(result.label).toBe("לא הוגדרה");
    expect(result.variant).toBe("secondary");
  });
});
