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
import AlloyContentEvent from "../../../src/components/AlloyContentEvent.js";

describe("AlloyContentEvent", () => {
  let alloyContentEvent;
  let mockAlloy;

  beforeEach(() => {
    mockAlloy = vi.fn().mockResolvedValue({ success: true });
    window.__alloyNS = ["alloy"];
    window.alloy = mockAlloy;

    alloyContentEvent = new AlloyContentEvent({
      datastreamId: "test-datastream-id",
    });
  });

  afterEach(() => {
    delete window.__alloyNS;
    delete window.alloy;
  });

  describe("constructor", () => {
    it("should store datastreamId", () => {
      expect(alloyContentEvent.datastreamId).toBe("test-datastream-id");
    });
  });

  describe("sendContentEvent", () => {
    it("should call alloy with correct payload structure", () => {
      const contentPayload = {
        experienceContent: {
          experience: { experienceViews: { value: 1 } },
        },
      };

      alloyContentEvent.sendContentEvent(contentPayload);

      expect(mockAlloy).toHaveBeenCalledWith(
        "sendEvent",
        expect.objectContaining({
          documentUnloading: true,
          xdm: expect.objectContaining({
            eventType: "content.contentEngagement",
          }),
        }),
      );
    });

    it("should include edgeConfigOverrides with datastreamId", () => {
      alloyContentEvent.sendContentEvent({});

      expect(mockAlloy).toHaveBeenCalledWith(
        "sendEvent",
        expect.objectContaining({
          edgeConfigOverrides: expect.objectContaining({
            datastreamId: "test-datastream-id",
            com_adobe_analytics: { enabled: false },
            com_adobe_target: { enabled: false },
          }),
        }),
      );
    });

    it("should merge xdm parameter with content payload", () => {
      const contentPayload = { experienceContent: {} };
      const xdm = { timestamp: "2026-01-01T00:00:00Z" };

      alloyContentEvent.sendContentEvent(contentPayload, xdm);

      expect(mockAlloy).toHaveBeenCalledWith(
        "sendEvent",
        expect.objectContaining({
          xdm: expect.objectContaining({
            timestamp: "2026-01-01T00:00:00Z",
            experienceContent: {},
            eventType: "content.contentEngagement",
          }),
        }),
      );
    });

    it("should include channel and idSource in xdm payload", () => {
      alloyContentEvent.sendContentEvent({});

      expect(mockAlloy).toHaveBeenCalledWith(
        "sendEvent",
        expect.objectContaining({
          xdm: expect.objectContaining({
            channel: "web",
            idSource: "ContentAnalytics",
          }),
        }),
      );
    });

    it("should not throw when alloy instance not found", () => {
      delete window.alloy;

      expect(() => {
        alloyContentEvent.sendContentEvent({});
      }).not.toThrow();
    });

    it("should use custom alloy instance name", () => {
      const customAlloy = vi.fn().mockResolvedValue({});
      window.__alloyNS = ["customAlloy"];
      window.customAlloy = customAlloy;

      alloyContentEvent.sendContentEvent({});

      expect(customAlloy).toHaveBeenCalled();
      expect(mockAlloy).not.toHaveBeenCalled();
    });

    it("should default to 'alloy' when __alloyNS is empty", () => {
      window.__alloyNS = [];

      alloyContentEvent.sendContentEvent({});

      expect(mockAlloy).toHaveBeenCalled();
    });
  });
});
