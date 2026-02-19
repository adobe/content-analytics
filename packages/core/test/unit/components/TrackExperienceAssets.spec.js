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
import TrackExperienceAssets from "../../../src/components/TrackExperienceAssets.js";

describe("TrackExperienceAssets", () => {
  let assets;
  let mockElement;

  beforeEach(() => {
    assets = new TrackExperienceAssets({
      htmlBlockAttributeName: "data-block-name",
      htmlPathCollectionEnabled: true,
      htmlPathAttributes: ["class"],
      htmlPathDepth: 10,
      assetsMaxBatchLength: 32,
      assetAbsolutePositionCollectionEnabled: true,
      assetDisplayDimensionsCollectionEnabled: true,
      assetLinkURLCollectionEnabled: true,
    });

    mockElement = {
      tagName: "IMG",
      closest: vi.fn().mockReturnValue(null),
      clientHeight: 100,
      clientWidth: 200,
      offsetTop: 50,
      offsetLeft: 100,
      offsetParent: null,
      parentElement: null,
    };
  });

  describe("constructor", () => {
    it("should initialize with config options", () => {
      expect(assets.assetsMaxBatchLength).toBe(32);
      expect(assets.htmlPathCollectionEnabled).toBe(true);
    });

    it("should initialize empty assets map", () => {
      expect(Object.keys(assets.assetsMap)).toHaveLength(0);
    });
  });

  describe("isExcludedAsset", () => {
    it("should return false when no qualifier set", () => {
      expect(assets.isExcludedAsset("https://example.com/image.jpg")).toBe(
        false,
      );
    });

    it("should return false when URL matches qualifier", () => {
      assets.assetUrlQualifier = /\.jpg$/;
      expect(assets.isExcludedAsset("https://example.com/image.jpg")).toBe(
        false,
      );
    });

    it("should return true when URL does not match qualifier", () => {
      assets.assetUrlQualifier = /\.png$/;
      expect(assets.isExcludedAsset("https://example.com/image.jpg")).toBe(
        true,
      );
    });
  });

  describe("getAssetDimensions", () => {
    it("should return undefined for empty source", () => {
      const result = assets.getAssetDimensions(mockElement, "");
      expect(result).toBeUndefined();
    });

    it("should return undefined for base64 images", () => {
      const result = assets.getAssetDimensions(
        mockElement,
        "data:image/png;base64,abc",
      );
      expect(result).toBeUndefined();
    });

    it("should return undefined for SVG images", () => {
      const result = assets.getAssetDimensions(
        mockElement,
        "https://example.com/icon.svg",
      );
      expect(result).toBeUndefined();
    });

    it("should return asset object for valid URL", () => {
      const result = assets.getAssetDimensions(
        mockElement,
        "https://example.com/image.jpg",
      );

      expect(result).toBeDefined();
      expect(result.assetID).toBe("https://example.com/image.jpg");
    });

    it("should include dimensions when enabled", () => {
      const result = assets.getAssetDimensions(
        mockElement,
        "https://example.com/image.jpg",
      );

      expect(result.assetDisplayHeight).toBe(100);
      expect(result.assetDisplayWidth).toBe(200);
    });

    it("should include position when enabled", () => {
      const result = assets.getAssetDimensions(
        mockElement,
        "https://example.com/image.jpg",
      );

      expect(result.assetAbsoluteTop).toBe(50);
      expect(result.assetAbsoluteLeft).toBe(100);
    });
  });

  describe("handleView", () => {
    it("should add asset to map on first view", () => {
      const asset = { assetID: "https://example.com/image.jpg" };
      assets.handleView(asset);

      expect(Object.keys(assets.assetsMap)).toHaveLength(1);
    });

    it("should not duplicate views for same asset", () => {
      const asset = { assetID: "https://example.com/image.jpg" };
      assets.handleView(asset);
      assets.handleView(asset);

      const trackAsset = Object.values(assets.assetsMap)[0];
      expect(trackAsset.assetViews.value).toBe(1);
    });

    it("should call callback when batch length exceeded", () => {
      const callback = vi.fn();
      assets.onAssetsLengthExceeded(callback);
      assets.assetsMaxBatchLength = 2;

      assets.handleView({ assetID: "https://example.com/1.jpg" });
      assets.handleView({ assetID: "https://example.com/2.jpg" });
      assets.handleView({ assetID: "https://example.com/3.jpg" });

      expect(callback).toHaveBeenCalled();
    });
  });

  describe("handleClick", () => {
    it("should add click to new asset", () => {
      const asset = { assetID: "https://example.com/image.jpg" };
      assets.handleClick(asset);

      const trackAsset = Object.values(assets.assetsMap)[0];
      expect(trackAsset.assetClicks.value).toBe(1);
    });

    it("should increment clicks for existing asset", () => {
      const asset = { assetID: "https://example.com/image.jpg" };
      assets.handleClick(asset);
      assets.handleClick(asset);

      const trackAsset = Object.values(assets.assetsMap)[0];
      expect(trackAsset.assetClicks.value).toBe(2);
    });
  });

  describe("reset", () => {
    it("should clear assets map", () => {
      assets.handleView({ assetID: "https://example.com/image.jpg" });
      assets.reset();

      expect(Object.keys(assets.assetsMap)).toHaveLength(0);
    });

    it("should clear views key set", () => {
      assets.handleView({ assetID: "https://example.com/image.jpg" });
      assets.reset();

      expect(assets.assetsViewsKeySet.size).toBe(0);
    });
  });

  describe("track", () => {
    it("should return array of tracked assets", () => {
      assets.handleView({ assetID: "https://example.com/1.jpg" });
      assets.handleView({ assetID: "https://example.com/2.jpg" });

      const track = assets.track;

      expect(track).toHaveLength(2);
    });
  });

  describe("shouldTrack", () => {
    it("should return false when no assets", () => {
      expect(assets.shouldTrack).toBe(false);
    });

    it("should return true when assets exist", () => {
      assets.handleView({ assetID: "https://example.com/image.jpg" });
      expect(assets.shouldTrack).toBe(true);
    });
  });
});
