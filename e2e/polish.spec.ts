import { expect, test } from "@playwright/test";
import { QUIZ_DAY, answer, collectPageErrors, playDaily } from "./helpers";

const SHARE_TEXT = /^Málamót 16\.10\. [0-7]\/7 [🟩🟥]{7}\nhttp:\/\/localhost:\d+$/u;

test.describe("without localStorage", () => {
  test.beforeEach(async ({ page }) => {
    // Like Safari's private mode or blocked site data: any access throws.
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new DOMException("The operation is insecure.", "SecurityError");
        },
      });
    });
  });

  test("the daily quiz still works, with a notice that nothing is saved", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.clock.setFixedTime(QUIZ_DAY);

    await page.goto("/");
    await expect(page.getByTestId("storage-notice")).toBeVisible();
    await expect(page.getByRole("link", { name: "Taka dagsins próf" })).toBeVisible();

    await playDaily(page);
    await expect(page.getByTestId("storage-notice")).toBeVisible();
    await expect(page.getByTestId("review").getByRole("listitem")).toHaveCount(7);
    await expect(page.getByTestId("share-text")).toHaveText(SHARE_TEXT);
    await expect(page.getByTestId("streak")).toHaveCount(0);

    // Nothing was remembered, so a reload starts the quiz again.
    await page.reload();
    await expect(page.getByText("Spurning 1 af 7")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("practice works too", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto("/aefing/flokkarnir");
    await expect(page.getByText("Spurning 1 af 10")).toBeVisible();
    await answer(page);
    await expect(page.getByRole("button", { name: "Næsta spurning" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("share card", () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(QUIZ_DAY);
  });

  test("shares the spoiler-free result with the Web Share API", async ({ page }) => {
    await page.addInitScript(() => {
      const shared: string[] = [];
      Object.assign(window, { __shared: shared });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: ShareData) => {
          shared.push(data.text ?? "");
        },
      });
    });
    await playDaily(page);
    const text = await page.getByTestId("share-text").textContent();
    expect(text).toMatch(SHARE_TEXT);

    await page.getByRole("button", { name: "Deila" }).click();
    expect(await page.evaluate(() => (window as unknown as { __shared: string[] }).__shared)).toEqual([text]);
  });

  test("copies the result where sharing isn't available", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    });
    await playDaily(page);
    await expect(page.getByRole("button", { name: "Deila" })).toHaveCount(0);

    await page.getByRole("button", { name: "Afrita" }).click();
    await expect(page.getByText("Afritað!")).toBeVisible();
    const text = await page.getByTestId("share-text").textContent();
    // The Windows clipboard turns \n into \r\n.
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.replace(/\r\n/g, "\n")).toBe(text);
  });
});

test("counts a streak of daily quizzes", async ({ page }) => {
  await page.clock.setFixedTime(QUIZ_DAY);
  await page.goto("/");
  // Yesterday's quiz was finished.
  await page.evaluate(() => {
    const yesterday = {
      date: "2026-10-15",
      questionIds: ["kerfid-0002"],
      answers: [{ questionId: "kerfid-0002", category: "kerfid", response: "b", outcome: "correct" }],
      finished: true,
    };
    localStorage.setItem("malamot.daily.v1", JSON.stringify({ "2026-10-15": yesterday }));
  });
  await page.reload();
  await expect(page.getByTestId("streak")).toContainText("1 dagur í röð");

  await playDaily(page);
  await expect(page.getByTestId("streak")).toContainText("2 dagar í röð");
  await page.goto("/");
  await expect(page.getByTestId("streak")).toContainText("2 dagar í röð");
});

test("the About page explains the rules and how to report errors", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Um Málamót" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Um Málamót" })).toBeVisible();
  for (const heading of ["Hlutleysi", "Hvaðan koma spurningarnar?", "Fannstu villu?", "Persónuvernd"]) {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
  }
  await expect(page.locator('main a[href^="mailto:"]')).toBeVisible();
});

test("unknown pages show an Icelandic 404", async ({ page }) => {
  const response = await page.goto("/ekki-til");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Síðan fannst ekki" })).toBeVisible();
  await page.getByRole("link", { name: "Aftur á forsíðu" }).click();
  await expect(page).toHaveURL(/\/$/);
});
