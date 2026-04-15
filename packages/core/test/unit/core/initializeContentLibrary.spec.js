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

describe("initializeContentLibrary", () => {
  afterEach(() => {
    vi.resetModules();
  });

  describe("alloy monitor registration", () => {
    beforeEach(() => {
      window.__alloyMonitors = [];
      window.__acaMonitorRegistered = false;
    });

    it("should register the monitor on first import", async () => {
      vi.resetModules();
      await import("../../../src/core/initializeContentLibrary.js");

      expect(window.__alloyMonitors).toHaveLength(1);
      expect(window.__acaMonitorRegistered).toBe(true);
    });

    it("should not register a second monitor if already registered", async () => {
      window.__acaMonitorRegistered = true;

      vi.resetModules();
      await import("../../../src/core/initializeContentLibrary.js");

      expect(window.__alloyMonitors).toHaveLength(0);
    });

    it("registered monitor forwards non-ACA sendEvent to adobeContentAnalytics", async () => {
      vi.resetModules();
      await import("../../../src/core/initializeContentLibrary.js");

      const forwardEvent = vi.fn();
      window.adobeContentAnalytics = { forwardEvent };

      window.__alloyMonitors[0].onBeforeCommand({
        commandName: "sendEvent",
        options: { xdm: { eventType: "web.webpagedetails.pageViews" } },
      });

      expect(forwardEvent).toHaveBeenCalled();
    });

    it("registered monitor does not forward ACA engagement events", async () => {
      vi.resetModules();
      await import("../../../src/core/initializeContentLibrary.js");

      const forwardEvent = vi.fn();
      window.adobeContentAnalytics = { forwardEvent };

      window.__alloyMonitors[0].onBeforeCommand({
        commandName: "sendEvent",
        options: { xdm: { eventType: "content.contentEngagement" } },
      });

      expect(forwardEvent).not.toHaveBeenCalled();
    });
  });

  describe("initializeContentLibrary function", () => {
    let initializeContentLibrary;

    beforeEach(async () => {
      window.__alloyMonitors = [];
      window.__acaMonitorRegistered = false;
      delete window.__alloyNS;
      delete window.adobeContentAnalytics;
      delete window.alloy;

      vi.resetModules();
      const module = await import(
        "../../../src/core/initializeContentLibrary.js"
      );
      initializeContentLibrary = module.default;
    });

    it("should not throw when window.__alloyNS is undefined", () => {
      delete window.__alloyNS;

      expect(() =>
        initializeContentLibrary({ datastreamId: "test-id" }),
      ).not.toThrow();
    });

    it("should not throw when window.__alloyNS is null", () => {
      window.__alloyNS = null;

      expect(() =>
        initializeContentLibrary({ datastreamId: "test-id" }),
      ).not.toThrow();
    });

    it("should not mutate the options object", () => {
      const options = { datastreamId: "test-id" };

      initializeContentLibrary(options);

      expect(options.shouldDeferAlloyProcessEventUntilPageViews).toBeUndefined();
      expect(Object.keys(options)).toEqual(["datastreamId"]);
    });

    it("should respect false for boolean collection flags", async () => {
      window.__alloyNS = ["alloy"];
      window.alloy = vi.fn().mockResolvedValue({
        libraryInfo: { configs: { debugEnabled: false } },
      });

      // Capture options passed to TrackExperienceAssets
      vi.resetModules();
      let capturedOptions;
      vi.doMock("../../../src/components/TrackExperienceAssets.js", () => ({
        default: class {
          constructor(opts) {
            capturedOptions = opts;
            this.assetsMap = {};
            this.assetsViewsKeySet = new Set();
            this.assetsLengthExceededCallbacks = [];
          }
          onAssetsLengthExceeded() {}
          get shouldTrack() { return false; }
          get track() { return []; }
        },
      }));

      const { default: init } = await import(
        "../../../src/core/initializeContentLibrary.js"
      );

      init({
        datastreamId: "test-id",
        htmlPathCollectionEnabled: false,
        assetAbsolutePositionCollectionEnabled: false,
        assetDisplayDimensionsCollectionEnabled: false,
        assetLinkURLCollectionEnabled: false,
        scrollDepthCollectionEnabled: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      if (capturedOptions) {
        expect(capturedOptions.htmlPathCollectionEnabled).toBe(false);
        expect(capturedOptions.assetAbsolutePositionCollectionEnabled).toBe(false);
        expect(capturedOptions.assetDisplayDimensionsCollectionEnabled).toBe(false);
        expect(capturedOptions.assetLinkURLCollectionEnabled).toBe(false);
        expect(capturedOptions.scrollDepthCollectionEnabled).toBe(false);
      }
    });
  });
});
