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

/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ContentObservers from "../../../src/components/ContentObservers.js";

describe("ContentObservers", () => {
  let contentObservers;
  let mockExperience;
  let mockAssets;

  beforeEach(() => {
    mockExperience = {
      experienceClicks: {
        add: vi.fn(),
      },
    };

    mockAssets = {
      getAssetDimensions: vi.fn().mockReturnValue({ assetID: "test.jpg" }),
      handleView: vi.fn(),
      handleClick: vi.fn(),
    };

    contentObservers = new ContentObservers(
      { experience: mockExperience, assets: mockAssets },
      {
        imagesSelector: "img",
        debounceNodeRegister: 0,
        backgroundImageDataAttribute: "data-info",
      },
    );
  });

  afterEach(() => {
    contentObservers.cleanupObservers();
  });

  describe("constructor", () => {
    it("should store dependencies", () => {
      expect(contentObservers.experience).toBe(mockExperience);
      expect(contentObservers.assets).toBe(mockAssets);
    });

    it("should set images selector", () => {
      expect(contentObservers.imagesSelector).toBe("img");
    });

    it("should store backgroundImageDataAttribute", () => {
      expect(contentObservers.backgroundImageDataAttribute).toBe("data-info");
    });

    it("should initialize observers", () => {
      expect(contentObservers.imagesIntersectionObserver).toBeDefined();
      expect(contentObservers.mutationObserver).toBeDefined();
    });
  });

  describe("initObservers", () => {
    it("should create IntersectionObserver when available", () => {
      expect(contentObservers.imagesIntersectionObserver).toBeDefined();
      expect(
        typeof contentObservers.imagesIntersectionObserver.observe,
      ).toBe("function");
    });

    it("should create MutationObserver when available", () => {
      expect(contentObservers.mutationObserver).toBeDefined();
      expect(typeof contentObservers.mutationObserver.observe).toBe(
        "function",
      );
    });
  });

  describe("cleanupObservers", () => {
    it("should disconnect observers", () => {
      const disconnectIntersection = vi.spyOn(
        contentObservers.imagesIntersectionObserver,
        "disconnect",
      );
      const disconnectMutation = vi.spyOn(
        contentObservers.mutationObserver,
        "disconnect",
      );

      contentObservers.cleanupObservers();

      expect(disconnectIntersection).toHaveBeenCalled();
      expect(disconnectMutation).toHaveBeenCalled();
    });
  });

  describe("onClick", () => {
    it("should increment experience clicks on trusted click", () => {
      const event = {
        isTrusted: true,
        pointerType: "mouse",
        target: document.createElement("div"),
      };

      contentObservers.onClick(event);

      expect(mockExperience.experienceClicks.add).toHaveBeenCalledWith(1);
    });

    it("should not process untrusted events", () => {
      const event = {
        isTrusted: false,
        pointerType: "mouse",
        target: document.createElement("div"),
      };

      contentObservers.onClick(event);

      expect(mockExperience.experienceClicks.add).not.toHaveBeenCalled();
    });

    it("should not process events without pointerType", () => {
      const event = {
        isTrusted: true,
        target: document.createElement("div"),
      };

      contentObservers.onClick(event);

      expect(mockExperience.experienceClicks.add).not.toHaveBeenCalled();
    });

    it("should handle click on image element", () => {
      const img = document.createElement("img");
      img.src = "https://example.com/test.jpg";

      const event = {
        isTrusted: true,
        pointerType: "mouse",
        target: img,
        clientX: 100,
        clientY: 100,
      };

      contentObservers.onClick(event);

      expect(mockAssets.handleClick).toHaveBeenCalled();
    });
  });

  describe("findImagesInClickedElement", () => {
    it("should find direct image element", () => {
      const img = document.createElement("img");
      img.src = "https://example.com/test.jpg";

      const found = contentObservers.findImagesInClickedElement(img);

      expect(found.length).toBeGreaterThan(0);
      expect(found[0].type).toBe("direct");
    });

    it("should find child images", () => {
      const div = document.createElement("div");
      const img = document.createElement("img");
      img.src = "https://example.com/test.jpg";
      div.appendChild(img);

      // Mock getBoundingClientRect for overlap check
      img.getBoundingClientRect = () => ({
        left: 0,
        right: 200,
        top: 0,
        bottom: 200,
      });

      const event = { clientX: 100, clientY: 100 };
      const found = contentObservers.findImagesInClickedElement(div, event);

      expect(found.some((f) => f.type === "child")).toBe(true);
    });

    it("should return empty array for element without images", () => {
      const div = document.createElement("div");

      const found = contentObservers.findImagesInClickedElement(div);

      // Should only have background check results (if any)
      expect(
        found.filter((f) => f.type === "direct" || f.type === "child"),
      ).toHaveLength(0);
    });
  });

  describe("getBackgroundAssetURLFromTarget", () => {
    it("should return undefined for no background image", () => {
      const div = document.createElement("div");

      const url = contentObservers.getBackgroundAssetURLFromTarget(div);

      expect(url).toBeUndefined();
    });

    it("should return data-info sd.s as the canonical URL", () => {
      const div = document.createElement("div");
      div.setAttribute(
        "data-info",
        JSON.stringify({
          sd: { s: "/content/dam/image.jpg", c: "0:1200", r: 0 },
          wm: "720",
        }),
      );
      div.style.backgroundImage =
        'url("/content/dam/image.jpg?crop=0:1200;*,*&downsize=1800:*")';

      const url = contentObservers.getBackgroundAssetURLFromTarget(div);

      expect(url).toBe("/content/dam/image.jpg");
    });

    it("should fall back to CSS background-image URL when no data-info", () => {
      const div = document.createElement("div");
      vi.spyOn(window, "getComputedStyle").mockReturnValueOnce({
        backgroundImage: 'url("https://example.com/image.jpg")',
      });

      const url = contentObservers.getBackgroundAssetURLFromTarget(div);

      expect(url).toBe("https://example.com/image.jpg");
    });

    it("should fall back to CSS URL when data-info has no sd.s", () => {
      const div = document.createElement("div");
      div.setAttribute("data-info", JSON.stringify({ wm: "720" }));
      vi.spyOn(window, "getComputedStyle").mockReturnValueOnce({
        backgroundImage: 'url("https://example.com/fallback.jpg")',
      });

      const url = contentObservers.getBackgroundAssetURLFromTarget(div);

      expect(url).toBe("https://example.com/fallback.jpg");
    });

    it("should fall back to CSS URL when data-info is invalid JSON", () => {
      const div = document.createElement("div");
      div.setAttribute("data-info", "not-valid-json");
      vi.spyOn(window, "getComputedStyle").mockReturnValueOnce({
        backgroundImage: 'url("https://example.com/fallback.jpg")',
      });

      const url = contentObservers.getBackgroundAssetURLFromTarget(div);

      expect(url).toBe("https://example.com/fallback.jpg");
    });

    it("should use custom backgroundImageDataAttribute", () => {
      const customObservers = new ContentObservers(
        { experience: mockExperience, assets: mockAssets },
        {
          imagesSelector: "img",
          debounceNodeRegister: 0,
          backgroundImageDataAttribute: "data-custom",
        },
      );
      const div = document.createElement("div");
      div.setAttribute(
        "data-custom",
        JSON.stringify({ sd: { s: "/content/dam/custom.jpg" } }),
      );

      const url = customObservers.getBackgroundAssetURLFromTarget(div);
      customObservers.cleanupObservers();

      expect(url).toBe("/content/dam/custom.jpg");
    });
  });

  describe("findImagesInClickedElement background images", () => {
    it("should use canonical data-info URL for background image clicks", () => {
      const parent = document.createElement("div");
      const child = document.createElement("div");
      child.setAttribute(
        "data-info",
        JSON.stringify({ sd: { s: "/content/dam/canonical.jpg" } }),
      );
      parent.appendChild(child);

      // happy-dom doesn't apply inline styles via getComputedStyle for unattached elements
      vi.spyOn(window, "getComputedStyle").mockImplementation((el) => {
        if (el === child) {
          return { backgroundImage: 'url("/content/dam/canonical.jpg?crop=0:100")' };
        }
        return { backgroundImage: "none" };
      });

      child.getBoundingClientRect = () => ({
        left: 0,
        right: 200,
        top: 0,
        bottom: 200,
      });

      const event = { clientX: 100, clientY: 100 };
      const found = contentObservers.findImagesInClickedElement(parent, event);

      vi.restoreAllMocks();

      const bgImages = found.filter((f) => f.type === "child-background");
      expect(bgImages.length).toBeGreaterThan(0);
      expect(bgImages[0].src).toBe("/content/dam/canonical.jpg");
    });
  });
});
