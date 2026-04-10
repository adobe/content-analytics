/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { test, expect } from "@playwright/test";

/**
 * Pages under test.
 *
 * standalone — loads alloy.js + content-analytics.min.js directly.
 * tags        — loads everything through the Adobe Experience Platform Tags
 *               property, which includes the Alloy and Content Analytics
 *               extensions. No standalone scripts are present on that page.
 */
const PAGES = [
  { label: "standalone bundle", path: "/" },
  { label: "Tags property", path: "/tags.html" },
];

/**
 * Arm a route interceptor that captures every content.contentEngagement XDM
 * object POSTed to the Adobe Edge Network (adobedc.net/ee/**), then invoke
 * `trigger` and return the collected payloads.
 *
 * The route is fulfilled with a 200 so Alloy does not retry.
 */
async function collectContentEngagementPayloads(page, trigger) {
  const captured = [];

  await page.route("**adobedc.net/ee/**", async (route) => {
    try {
      const raw = route.request().postData();
      if (raw) {
        const body = JSON.parse(raw);
        (body?.events ?? []).forEach((e) => {
          if (e?.xdm?.eventType === "content.contentEngagement") {
            captured.push(e.xdm);
          }
        });
      }
    } catch {
      // non-JSON body — skip
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });

  await trigger();

  return captured;
}

/**
 * Navigate to `path`, wait for the page and all async scripts (Alloy,
 * Tags library, ACA extension) to settle, then flush the buffered ACA event
 * by dispatching a synthetic pagehide.
 *
 * Returns the captured content.contentEngagement XDM objects.
 */
async function loadAndFlush(page, path) {
  await page.goto(path);
  // networkidle ensures the Tags library and any dynamically loaded scripts
  // (Alloy, ACA extension) have finished their initial network activity.
  await page.waitForLoadState("networkidle");

  // Scroll to the bottom so images enter the IntersectionObserver viewport.
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await page.waitForTimeout(500);

  const requestPromise = page.waitForRequest(
    (req) =>
      req.url().includes("adobedc.net/ee/") && req.method() === "POST",
    { timeout: 10000 },
  );

  const payloads = await collectContentEngagementPayloads(page, () =>
    page.evaluate(() => document.dispatchEvent(new Event("pagehide"))),
  );

  await requestPromise;
  // Allow the route handler one tick to finish appending to `payloads`.
  await page.waitForTimeout(100);

  return payloads;
}

/**
 * Returns a minimal 1×1 transparent PNG as a Buffer.
 *
 * Used to fulfil maps.googleapis.com staticmap requests so the <img> element
 * is fully loaded (naturalWidth > 0) by the time ACA evaluates it.
 * This makes the exclusion test meaningful: ACA would see a loaded image and
 * must still reject it via permanentlyBlockedURLs.
 */
function minimalPng() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ" +
      "AABjkB6QAAAABJRU5ErkJggg==",
    "base64",
  );
}

for (const { label, path } of PAGES) {
  test.describe(`ACA XDM payload — ${label} (${path})`, () => {
    test("content.contentEngagement event includes channel=web and idSource=ContentAnalytics", async ({
      page,
    }) => {
      const payloads = await loadAndFlush(page, path);

      expect(
        payloads.length,
        "Expected at least one content.contentEngagement event to be sent to the Edge Network",
      ).toBeGreaterThan(0);

      const xdm = payloads[0];
      expect(xdm.channel).toBe("web");
      expect(xdm.idSource).toBe("ContentAnalytics");
    });

    test("all content.contentEngagement events include channel and idSource", async ({
      page,
    }) => {
      const payloads = await loadAndFlush(page, path);

      expect(payloads.length).toBeGreaterThan(0);
      for (const xdm of payloads) {
        expect(xdm.channel).toBe("web");
        expect(xdm.idSource).toBe("ContentAnalytics");
      }
    });

    test("Google Maps static image is present but not tracked as an asset", async ({
      page,
    }) => {
      // Fulfil the static map request with a real loadable image so ACA sees
      // naturalWidth > 0 — the img is genuinely loaded, making this a true
      // test of the permanentlyBlockedURLs exclusion ("maps.googleapis.com").
      await page.route("**maps.googleapis.com/**", (route) =>
        route.fulfill({
          status: 200,
          contentType: "image/png",
          body: minimalPng(),
        }),
      );

      await page.goto(path);
      await page.waitForLoadState("networkidle");

      // Confirm the static map img is on the page and loaded
      const staticMap = page.getByTestId("google-maps-static");
      await expect(staticMap).toBeVisible();
      const naturalWidth = await staticMap.evaluate((img) => img.naturalWidth);
      expect(naturalWidth, "Static map image should have loaded").toBeGreaterThan(0);

      // Scroll past the store-locator section so IntersectionObserver fires
      await page.evaluate(() =>
        window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
      );
      await page.waitForTimeout(500);

      const requestPromise = page.waitForRequest(
        (req) =>
          req.url().includes("adobedc.net/ee/") && req.method() === "POST",
        { timeout: 10000 },
      );

      const payloads = await collectContentEngagementPayloads(page, () =>
        page.evaluate(() => document.dispatchEvent(new Event("pagehide"))),
      );

      await requestPromise;
      await page.waitForTimeout(100);

      // Collect every assetID from all captured events
      const trackedAssetIDs = payloads.flatMap(
        (xdm) => xdm.experienceContent?.assets?.map((a) => a.assetID) ?? [],
      );

      const mapsAssets = trackedAssetIDs.filter((id) =>
        id?.includes("maps.googleapis.com"),
      );

      expect(
        mapsAssets,
        "maps.googleapis.com URLs must not appear in tracked assets (blocked by permanentlyBlockedURLs)",
      ).toHaveLength(0);
    });
  });
}
