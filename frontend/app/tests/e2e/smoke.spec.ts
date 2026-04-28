import { test, expect } from "@playwright/test";

test("login page is available and allows navigation", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Acceso al sistema")).toBeVisible();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Dashboard")).toBeVisible();
});
