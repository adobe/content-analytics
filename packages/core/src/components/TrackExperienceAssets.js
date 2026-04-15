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

import TrackAsset from "./TrackAsset.js";
import { logDebug } from "../constants/index.js";
import {
  isSrcBase64,
  isSrcSVG,
  urlHasPathname,
  getElementDisplayHeight,
  getElementDisplayWidth,
  getElementAbsoluteOffset,
} from "../utils/domUtils.js";
import { getElementHTMLPath, joinHTMLPath } from "../utils/contentUtils.js";

export default class TrackExperienceAssets {
  constructor({
    htmlBlockAttributeName,
    htmlPathCollectionEnabled,
    htmlPathAttributes,
    htmlPathDepth,
    assetsMaxBatchLength,
    assetAbsolutePositionCollectionEnabled,
    assetDisplayDimensionsCollectionEnabled,
    assetLinkURLCollectionEnabled,
    assetUrlQualifier,
    permanentlyBlockedURLs,
  }) {
    this.htmlBlockAttributeName = htmlBlockAttributeName;
    this.assetAbsolutePositionCollectionEnabled =
      assetAbsolutePositionCollectionEnabled;
    this.htmlPathCollectionEnabled = htmlPathCollectionEnabled;
    this.htmlPathAttributes = htmlPathAttributes;
    this.htmlPathDepth = htmlPathDepth;
    this.assetsMaxBatchLength = assetsMaxBatchLength;
    this.assetDisplayDimensionsCollectionEnabled =
      assetDisplayDimensionsCollectionEnabled;
    this.assetLinkURLCollectionEnabled = assetLinkURLCollectionEnabled;
    this.assetsLengthExceededCallbacks = [];
    this.assetsViewsKeySet = new Set();
    this.assetsMap = {};
    this.assetUrlQualifier = assetUrlQualifier;
    this.permanentlyBlockedURLs = permanentlyBlockedURLs || [];
  }

  onAssetsLengthExceeded(fn) {
    this.assetsLengthExceededCallbacks.push(fn);
  }

  isExcludedAsset(assetSource) {
    if (!assetSource) return false;
    if (
      this.permanentlyBlockedURLs.some((blocked) =>
        assetSource.includes(blocked),
      )
    ) {
      return true;
    }
    if (this.assetUrlQualifier) {
      if (!this.assetUrlQualifier.test(assetSource)) {
        return true;
      }
    }
    return false;
  }

  getAssetDimensions(element, assetSource) {
    if (!assetSource) return;
    if (isSrcBase64(assetSource) || isSrcSVG(assetSource)) return;

    if (this.isExcludedAsset(assetSource)) {
      logDebug("Excluded asset", assetSource);
      return;
    }

    const asset = {};

    // We don't send both assetID and assetSource since they are the same.
    // Asset ID — use window.location as base to resolve relative URLs
    try {
      const srcURL = new URL(assetSource, window.location);
      if (!urlHasPathname(srcURL)) return;
      asset.assetID = srcURL.href.trim();
    } catch (e) {
      return;
    }

    // Asset HTML Path
    if (this.htmlPathCollectionEnabled) {
      const assetHTMLPath = getElementHTMLPath(
        element,
        this.htmlPathDepth,
        this.htmlPathAttributes,
      );
      asset.assetHTMLPath = `${joinHTMLPath(assetHTMLPath)}`;
    }

    // Asset Block
    if (this.htmlBlockAttributeName) {
      // this will be deprecated, rely on html path
      const closestDataBlockName = element.closest(
        `[${this.htmlBlockAttributeName}]`,
      );
      const assetBlock =
        closestDataBlockName &&
        closestDataBlockName.getAttribute(this.htmlBlockAttributeName);
      if (typeof assetBlock === "string" && assetBlock.length > 0) {
        asset.assetBlock = assetBlock.trim();
      }
    }

    // Asset Link URL
    if (this.assetLinkURLCollectionEnabled) {
      const closestAnchor = element.closest("a");
      if (closestAnchor) {
        asset.assetLinkURL = new URL(
          closestAnchor.href,
          window.location,
        ).href.trim();
      }
    }

    // Asset Display Dimensions
    if (this.assetDisplayDimensionsCollectionEnabled) {
      asset.assetDisplayHeight = getElementDisplayHeight(element);
      asset.assetDisplayWidth = getElementDisplayWidth(element);
    }

    // Asset Absolute Position
    if (this.assetAbsolutePositionCollectionEnabled) {
      const { top, left } = getElementAbsoluteOffset(element);
      asset.assetAbsoluteLeft = left;
      asset.assetAbsoluteTop = top;
    }

    return asset;
  }

  getAssetMapKey(asset) {
    return [asset.assetID, asset.assetHTMLPath, asset.assetBlock]
      .filter(Boolean)
      .join("|");
  }

  handleClick(asset) {
    const assetMapKey = this.getAssetMapKey(asset);
    if (!this.assetsMap[assetMapKey]) {
      this.assetsMap[assetMapKey] = new TrackAsset(asset);
    }
    this.assetsMap[assetMapKey].addClick(1);
  }

  handleView(asset) {
    const assetMapKey = this.getAssetMapKey(asset);

    // guard against multiple views on the same asset in the same page session
    if (this.assetsViewsKeySet.has(assetMapKey)) return;
    this.assetsViewsKeySet.add(assetMapKey);

    if (!this.assetsMap[assetMapKey]) {
      this.assetsMap[assetMapKey] = new TrackAsset(asset);
    }
    this.assetsMap[assetMapKey].addView(1);

    // Sent content views on max length
    if (Object.values(this.assetsMap).length > this.assetsMaxBatchLength) {
      this.assetsLengthExceededCallbacks.forEach((fn) => fn());
    }
  }

  reset() {
    this.resetMetrics();
    this.assetsViewsKeySet.clear();
  }

  resetMetrics() {
    this.assetsMap = {};
  }

  get track() {
    return Object.values(this.assetsMap).map((asset) => asset.track);
  }

  get shouldTrack() {
    return this.track.length > 0;
  }
}
