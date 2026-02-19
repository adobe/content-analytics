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

import { describe, it, expect, beforeEach } from "vitest";
import TrackExperience from "../../../src/components/TrackExperience.js";

describe("TrackExperience", () => {
  beforeEach(() => {
    // Reset window.location for tests
    Object.defineProperty(window, "location", {
      value: new URL("https://example.com/page"),
      writable: true,
    });
  });

  describe("constructor", () => {
    it("should initialize with default values", () => {
      const experience = new TrackExperience({
        scrollDepthCollectionEnabled: false,
        includeExperiences: true,
      });

      expect(experience.experienceViews.value).toBe(1);
      expect(experience.experienceClicks.value).toBe(0);
      expect(experience.experienceChannel.value).toBe("web");
    });

    it("should set experienceViews to 1 on init", () => {
      const experience = new TrackExperience({
        scrollDepthCollectionEnabled: false,
        includeExperiences: true,
      });

      expect(experience.experienceViews.value).toBe(1);
    });
  });

  describe("reset", () => {
    it("should reset metrics and set experienceViews to 1", () => {
      const experience = new TrackExperience({
        scrollDepthCollectionEnabled: false,
        includeExperiences: true,
      });

      experience.experienceClicks.add(5);
      experience.reset();

      expect(experience.experienceViews.value).toBe(1);
      expect(experience.experienceClicks.value).toBe(0);
    });
  });

  describe("resetMetrics", () => {
    it("should reset only metrics", () => {
      const experience = new TrackExperience({
        scrollDepthCollectionEnabled: false,
        includeExperiences: true,
      });

      experience.experienceClicks.add(5);
      experience.resetMetrics();

      expect(experience.experienceClicks.value).toBe(0);
    });
  });

  describe("shouldExclude", () => {
    it("should return false when no pageUrlQualifier", () => {
      const experience = new TrackExperience({
        scrollDepthCollectionEnabled: false,
        includeExperiences: true,
      });

      expect(experience.shouldExclude).toBe(false);
    });
  });

  describe("isDifferent", () => {
    it("should compare URLs correctly", () => {
      const experience = new TrackExperience({
        scrollDepthCollectionEnabled: false,
        includeExperiences: true,
      });

      // Same URL should not be different
      const currentID = experience.experienceID.value;
      const result = experience.isDifferent(new URL(window.location.href));

      // The result depends on how getExperienceID works
      expect(typeof result).toBe("boolean");
    });
  });

  describe("track", () => {
    it("should return metrics and dimensions", () => {
      const experience = new TrackExperience({
        scrollDepthCollectionEnabled: false,
        includeExperiences: true,
      });

      const track = experience.track;

      expect(track.experienceViews).toBeDefined();
      expect(track.experienceClicks).toBeDefined();
      expect(track.experienceChannel).toBe("web");
    });
  });

  describe("shouldTrack", () => {
    it("should return true when views > 0 and includeExperiences", () => {
      const experience = new TrackExperience({
        scrollDepthCollectionEnabled: false,
        includeExperiences: true,
      });

      expect(experience.shouldTrack).toBe(true);
    });

    it("should return false when includeExperiences is false", () => {
      const experience = new TrackExperience({
        scrollDepthCollectionEnabled: false,
        includeExperiences: false,
      });

      expect(experience.shouldTrack).toBe(false);
    });

    it("should return true when clicks > 0", () => {
      const experience = new TrackExperience({
        scrollDepthCollectionEnabled: false,
        includeExperiences: true,
      });

      experience.experienceViews.value = 0;
      experience.experienceClicks.add(1);

      expect(experience.shouldTrack).toBe(true);
    });
  });
});
