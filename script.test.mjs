import { calculateRevisionDates } from "./script.mjs";

describe("calculateRevisionDates", () => {
  test("returns all expected revision labels for a future date", () => {
    const startDate = "2025-12-01";
    const revisions = calculateRevisionDates(startDate);

    // There should be 5 revisions
    expect(revisions.length).toBe(5);

    // The labels should be correct
    const labels = revisions.map((r) => r.label);
    expect(labels).toEqual([
      "1 Week",
      "1 Month",
      "3 Months",
      "6 Months",
      "1 Year",
    ]);

    // Each date should be in YYYY-MM-DD format
    revisions.forEach((r) => {
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  test("skips the 1-week revision if it's in the past", () => {
    const pastDate = "2020-01-01";
    const revisions = calculateRevisionDates(pastDate);

    const labels = revisions.map((r) => r.label);

    // The 1-week revision should not be included
    expect(labels).not.toContain("1 Week");

    // Other revisions should still exist
    expect(labels).toContain("1 Month");
    expect(labels).toContain("3 Months");
    expect(labels).toContain("6 Months");
    expect(labels).toContain("1 Year");
  });
});
