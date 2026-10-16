import { expect, test } from "@playwright/test";
import { QUIZ_DAY, answer, expectAccessible } from "./helpers";

// axe checks (WCAG 2.2 A/AA) on every screen and state, in light and dark mode.
// Lighthouse (npm run lighthouse) covers first visits; this covers the states it
// can't reach, such as answered questions and results.

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test("daily quiz: question, feedback for both input types, results, home afterwards", async ({ page }) => {
      await page.clock.setFixedTime(QUIZ_DAY);
      await page.goto("/");
      await expectAccessible(page, "home");

      await page.goto("/dagsins");
      const seen = new Set<string>();
      for (let n = 1; n <= 7; n++) {
        await expect(page.getByText(`Spurning ${n} af 7`)).toBeVisible();
        const kind = await page.getByRole("slider").count() > 0 ? "estimate" : "choice";
        const first = !seen.has(kind);
        if (first) await expectAccessible(page, `${kind} question`);
        await answer(page);
        if (first) await expectAccessible(page, `${kind} feedback`);
        seen.add(kind);
        await page.getByRole("button", { name: n === 7 ? "Sjá niðurstöður" : "Næsta spurning" }).click();
      }

      await expect(page.getByTestId("score")).toBeVisible();
      await page.locator("details summary").first().click();
      await expectAccessible(page, "results");

      await page.goto("/");
      await expect(page.getByRole("link", { name: "Sjá niðurstöður" })).toBeVisible();
      await expectAccessible(page, "home after playing");
    });

    test("practice picker, practice results, About and 404", async ({ page }) => {
      await page.goto("/aefing");
      await expect(page.getByRole("link", { name: /Kerfið/ })).toBeVisible();
      await expectAccessible(page, "practice picker");

      await page.goto("/aefing/flokkarnir");
      for (let n = 1; n <= 10; n++) {
        await expect(page.getByText(`Spurning ${n} af 10`)).toBeVisible();
        await answer(page);
        await page.getByRole("button", { name: n === 10 ? "Sjá niðurstöður" : "Næsta spurning" }).click();
      }
      await expectAccessible(page, "practice results");

      await page.goto("/um");
      await expectAccessible(page, "about");

      await page.goto("/ekki-til");
      await expectAccessible(page, "404");
    });
  });
}
