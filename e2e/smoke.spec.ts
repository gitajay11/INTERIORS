import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", heading: /spaces designed around you/i },
  { path: "/about", heading: /long memory/i },
  { path: "/projects", heading: /homes and workplaces/i },
  { path: "/projects/boat-club-residence", heading: /boat club residence/i },
  { path: "/services", heading: /everything a room needs/i },
  { path: "/services/residential-interiors", heading: /residential interiors/i },
  { path: "/materials", heading: /library behind every room/i },
  { path: "/book", heading: /an hour with a designer/i },
  { path: "/journal", heading: /notes from the studio/i },
  { path: "/journal/the-case-for-warm-minimalism", heading: /warm minimalism/i },
  { path: "/contact", heading: /tell us about your space/i },
];

for (const { path, heading } of pages) {
  test(`renders ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("3D studio loads and mirrors the design in the URL", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByRole("heading", { level: 1, name: /design your room/i })).toBeVisible();

  await page.getByRole("tab", { name: "Floor" }).click();
  await page.getByRole("button", { name: /american walnut/i }).click();
  await expect(page).toHaveURL(/floor=walnut/);

  await page.getByRole("tab", { name: "Furniture" }).click();
  await page.getByRole("button", { name: "Curve", exact: true }).click();
  await expect(page).toHaveURL(/sofa=curve/);

  // The design survives a reload and feeds the booking link.
  await page.reload();
  await expect(page).toHaveURL(/floor=walnut/);
  await expect(
    page.getByRole("link", { name: /book consultation with this design/i }),
  ).toHaveAttribute("href", /design=.*walnut/);
});

test("a shared studio link restores the design", async ({ page }) => {
  await page.goto("/studio?floor=marble&sofa=sectional&hide=rug");
  await page.getByRole("tab", { name: "Floor" }).click();
  await expect(page.getByRole("button", { name: /calacatta marble/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("project filters update the URL and the grid", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("tab", { name: "commercial" }).click();
  await expect(page).toHaveURL(/type=commercial/);
  await expect(page.getByRole("heading", { name: "Atlas Capital Office" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Boat Club Residence" })).toHaveCount(0);
});

test("contact form validates before sending", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByText(/enter your full name/i)).toBeVisible();
});

test("unknown routes return the 404 page", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /does not exist/i })).toBeVisible();
});
