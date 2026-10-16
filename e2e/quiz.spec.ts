import { expect, test } from "@playwright/test";
import { NEXT_DAY, QUIZ_DAY, answer, collectPageErrors } from "./helpers";

test("plays a full daily quiz, then shows the result instead of a second attempt", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.clock.setFixedTime(QUIZ_DAY);

  await page.goto("/");
  await expect(page.getByText("föstudagur 16. október")).toBeVisible();
  await page.getByRole("link", { name: "Taka dagsins próf" }).click();

  const kinds = new Set<string>();
  for (let n = 1; n <= 7; n++) {
    await expect(page.getByText(`Spurning ${n} af 7`)).toBeVisible();
    kinds.add(await answer(page));

    // Feedback: focused, with an explanation, sources and a report link naming the question.
    const feedback = page.locator("section:focus");
    await expect(feedback).toBeVisible();
    await expect(feedback.getByText("Heimildir")).toBeVisible();
    await expect(feedback.getByRole("link", { name: "Tilkynna villu" })).toHaveAttribute(
      "href",
      /^mailto:[^?]+\?subject=.*(kerfid|flokkarnir)-\d{4}/,
    );

    await page.getByRole("button", { name: n === 7 ? "Sjá niðurstöður" : "Næsta spurning" }).click();
  }
  expect([...kinds].sort()).toEqual(["choice", "estimate"]);
  await expect(page.getByText("SÝNISHORN")).toHaveCount(0);

  // Result screen.
  await expect(page.getByRole("heading", { level: 1, name: "Dagsins próf" })).toBeFocused();
  await expect(page.getByTestId("score")).toContainText("af 7");
  await expect(page.getByTestId("review").getByRole("listitem")).toHaveCount(7);

  // One attempt per day: home and /dagsins now show today's result.
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sjá niðurstöður" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Taka dagsins próf" })).toHaveCount(0);
  await page.goto("/dagsins");
  await expect(page.getByTestId("score")).toBeVisible();
  await expect(page.getByRole("button", { name: "Svara" })).toHaveCount(0);

  // A new day brings a new quiz.
  await page.clock.setFixedTime(NEXT_DAY);
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Taka dagsins próf" })).toBeVisible();

  expect(errors).toEqual([]);
});

test("resumes an unfinished daily quiz after a reload", async ({ page }) => {
  await page.clock.setFixedTime(QUIZ_DAY);
  await page.goto("/dagsins");
  for (let n = 1; n <= 2; n++) {
    await expect(page.getByText(`Spurning ${n} af 7`)).toBeVisible();
    await answer(page);
    await page.getByRole("button", { name: "Næsta spurning" }).click();
  }
  const third = await page.getByRole("heading", { level: 2 }).textContent();

  await page.reload();
  await expect(page.getByText("Spurning 3 af 7")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(third!);

  await page.goto("/");
  await expect(page.getByRole("link", { name: /^Halda áfram.*2 af 7/ })).toBeVisible();
});

test("practice: plays a round in one category and starts another", async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto("/aefing");
  await page.getByRole("link", { name: /Kerfið/ }).click();

  for (let n = 1; n <= 10; n++) {
    await expect(page.getByText(`Spurning ${n} af 10`)).toBeVisible();
    await answer(page);
    await page.getByRole("button", { name: n === 10 ? "Sjá niðurstöður" : "Næsta spurning" }).click();
  }
  await expect(page.getByTestId("score")).toContainText("af 10");
  await expect(page.getByTestId("review").getByRole("listitem")).toHaveCount(10);

  await page.getByRole("button", { name: "Æfa aftur" }).click();
  await expect(page.getByText("Spurning 1 af 10")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toBeFocused();
  expect(errors).toEqual([]);
});
