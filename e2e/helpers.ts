import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

// The clock is fixed so runs are repeatable. With the current content the quiz for
// 2026-10-16 includes an estimate question, so both answer inputs get exercised;
// the helpers handle whichever kind of question appears.
export const QUIZ_DAY = new Date("2026-10-16T12:00:00Z");
export const NEXT_DAY = new Date("2026-10-17T12:00:00Z");

/** Answers the question on screen: moves the slider one step, or picks the first option. */
export async function answer(page: Page): Promise<"estimate" | "choice"> {
  const slider = page.getByRole("slider");
  const kind = (await slider.count()) > 0 ? "estimate" : "choice";
  if (kind === "estimate") {
    await slider.focus();
    await page.keyboard.press("ArrowRight");
  } else {
    await page.getByRole("radio").first().check();
  }
  await page.getByRole("button", { name: "Svara" }).click();
  return kind;
}

/** Plays the daily quiz from /dagsins to the result screen. */
export async function playDaily(page: Page): Promise<void> {
  await page.goto("/dagsins");
  for (let n = 1; n <= 7; n++) {
    await expect(page.getByText(`Spurning ${n} af 7`)).toBeVisible();
    await answer(page);
    await page.getByRole("button", { name: n === 7 ? "Sjá niðurstöður" : "Næsta spurning" }).click();
  }
  await expect(page.getByTestId("score")).toBeVisible();
}

export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

/** Runs axe with the WCAG 2.2 A/AA rules and fails on any violation. */
export async function expectAccessible(page: Page, state: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const violations = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(violations, `accessibility violations in: ${state}`).toEqual([]);
}
