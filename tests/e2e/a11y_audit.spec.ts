import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const runE2E = process.env.E2E_RUN === "true";
const paths = (process.env.E2E_A11Y_PATHS || "/")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);

test.describe("EcoTrack WCAG 2.1 AA audit", () => {
  test.skip(
    !runE2E,
    "Set E2E_RUN=true with the running web app to execute the accessibility audit.",
  );

  for (const path of paths) {
    test(`has no WCAG violations on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
