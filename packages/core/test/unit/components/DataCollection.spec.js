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

import { describe, it, expect, vi, beforeEach } from "vitest";
import DataCollection from "../../../src/components/DataCollection.js";

describe("DataCollection", () => {
  let mockExperience;
  let mockAssets;
  let mockAlloyContentEvent;
  let mockContentObservers;

  beforeEach(() => {
    mockExperience = {
      shouldTrack: true,
      track: { experienceViews: { value: 1 } },
      experienceID: { value: "https://example.com/?expVer=NoVersion" },
      reset: vi.fn(),
      resetMetrics: vi.fn(),
      isDifferent: vi.fn().mockReturnValue(false),
    };

    mockAssets = {
      shouldTrack: true,
      track: [{ assetID: "test.jpg" }],
      reset: vi.fn(),
      resetMetrics: vi.fn(),
      onAssetsLengthExceeded: vi.fn(),
    };

    mockAlloyContentEvent = {
      sendContentEvent: vi.fn(),
    };

    mockContentObservers = {
      registerObservers: vi.fn(),
      cleanupObservers: vi.fn(),
    };
  });

  describe("constructor", () => {
    it("should initialize with dependencies", () => {
      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      expect(dc.experience).toBe(mockExperience);
      expect(dc.assets).toBe(mockAssets);
      expect(mockContentObservers.registerObservers).toHaveBeenCalled();
    });

    it("should register assets length exceeded callback", () => {
      new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      expect(mockAssets.onAssetsLengthExceeded).toHaveBeenCalled();
    });
  });

  describe("sendContentEvent", () => {
    it("should send event when shouldTrack is true", () => {
      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      const result = dc.sendContentEvent();

      expect(result).toBe(true);
      expect(mockAlloyContentEvent.sendContentEvent).toHaveBeenCalled();
    });

    it("should not send event when shouldTrack is false", () => {
      mockExperience.shouldTrack = false;
      mockAssets.shouldTrack = false;

      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      const result = dc.sendContentEvent();

      expect(result).toBe(false);
      expect(mockAlloyContentEvent.sendContentEvent).not.toHaveBeenCalled();
    });

    it("should reset metrics after sending", () => {
      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      dc.sendContentEvent();

      expect(mockExperience.resetMetrics).toHaveBeenCalled();
      expect(mockAssets.resetMetrics).toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    it("should reset all components", () => {
      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      dc.reset();

      expect(mockContentObservers.cleanupObservers).toHaveBeenCalled();
      expect(mockExperience.reset).toHaveBeenCalled();
      expect(mockAssets.reset).toHaveBeenCalled();
      expect(mockContentObservers.registerObservers).toHaveBeenCalledTimes(2);
      expect(mockContentObservers.registerObservers).toHaveBeenNthCalledWith(
        2,
        false,
      );
    });
  });

  describe("track", () => {
    it("should return payload with experience and assets", () => {
      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      const track = dc.track;

      expect(track.experienceContent).toBeDefined();
      expect(track.experienceContent.implementationDetails).toBeDefined();
    });

    it("should include experience when includeExperiences is true", () => {
      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      const track = dc.track;

      expect(track.experienceContent.experience).toBeDefined();
    });

    it("should not include experience when includeExperiences is false", () => {
      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: false },
      );

      const track = dc.track;

      expect(track.experienceContent.experience).toBeUndefined();
    });
  });

  describe("shouldTrack", () => {
    it("should return true when experience shouldTrack", () => {
      mockAssets.shouldTrack = false;

      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      expect(dc.shouldTrack).toBe(true);
    });

    it("should return true when assets shouldTrack", () => {
      mockExperience.shouldTrack = false;

      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      expect(dc.shouldTrack).toBe(true);
    });

    it("should return false when neither should track", () => {
      mockExperience.shouldTrack = false;
      mockAssets.shouldTrack = false;

      const dc = new DataCollection(
        {
          experience: mockExperience,
          assets: mockAssets,
          alloyContentEvent: mockAlloyContentEvent,
          contentObservers: mockContentObservers,
        },
        { includeExperiences: true },
      );

      expect(dc.shouldTrack).toBe(false);
    });
  });
});
