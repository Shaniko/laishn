import { describe, it, expect } from "vitest";

// Extract and test the statistics computation logic used in Stats.tsx

interface MockItem {
  purchase_price: number | null;
  warranty_end_date: string | null;
  category_id: string | null;
  purchase_date: string | null;
  categories: { id: string; name: string } | null;
}

function computeStats(items: MockItem[]) {
  const totalItems = items.length;
  const totalSpent = items.reduce((sum, i) => sum + (i.purchase_price || 0), 0);
  const now = new Date();
  const activeWarranty = items.filter(
    (i) => i.warranty_end_date && new Date(i.warranty_end_date) >= now
  ).length;
  const expiredWarranty = items.filter(
    (i) => i.warranty_end_date && new Date(i.warranty_end_date) < now
  ).length;
  return { totalItems, totalSpent, activeWarranty, expiredWarranty };
}

const sampleItems: MockItem[] = [
  { purchase_price: 100, warranty_end_date: "2099-01-01", category_id: "a", purchase_date: "2024-01-15", categories: { id: "a", name: "אלקטרוניקה" } },
  { purchase_price: 200, warranty_end_date: "2020-01-01", category_id: "a", purchase_date: "2024-02-10", categories: { id: "a", name: "אלקטרוניקה" } },
  { purchase_price: null, warranty_end_date: null, category_id: "b", purchase_date: null, categories: { id: "b", name: "ריהוט" } },
];

describe("Stats computations", () => {
  it("calculates total items", () => {
    expect(computeStats(sampleItems).totalItems).toBe(3);
  });

  it("calculates total spent ignoring nulls", () => {
    expect(computeStats(sampleItems).totalSpent).toBe(300);
  });

  it("counts active warranties", () => {
    expect(computeStats(sampleItems).activeWarranty).toBe(1);
  });

  it("counts expired warranties", () => {
    expect(computeStats(sampleItems).expiredWarranty).toBe(1);
  });

  it("handles empty array", () => {
    const result = computeStats([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalSpent).toBe(0);
    expect(result.activeWarranty).toBe(0);
  });
});
