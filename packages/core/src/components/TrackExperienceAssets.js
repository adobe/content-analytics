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
  resolvesToPageURL,
  getElementDisplayHeight,
  getElementDisplayWidth,
  getElementAbsoluteOffset,
} from "../utils/domUtils.js";
import { getElementHTMLPath, joinHTMLPath } from "../utils/contentUtils.js";
import { getPayloadBytes } from "../utils/functionUtils.js";

// Trigger a flush when the serialised assets portion approaches the full
// 50 KB payload limit, leaving headroom for experience data and the alloy
// request wrapper fields.
const ASSET_PAYLOAD_FLUSH_THRESHOLD = 48 * 1024;

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
    // Optional legacy count-based limit; if set, fires a flush when the asset
    // count exceeds this value in addition to the payload-size-based trigger.
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
      if (resolvesToPageURL(assetSource)) {
        logDebug("Rejected asset matching page URL", assetSource);
        return;
      }
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

    // Flush when the serialised assets payload approaches the 50 KB request
    // limit, or when the optional legacy count cap is exceeded.
    const sizeExceeded =
      getPayloadBytes(this.track) > ASSET_PAYLOAD_FLUSH_THRESHOLD;
    const countExceeded =
      this.assetsMaxBatchLength != null &&
      Object.values(this.assetsMap).length > this.assetsMaxBatchLength;
    if (sizeExceeded || countExceeded) {
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

  // Remove only the first `count` entries from assetsMap, leaving the rest
  // for the next request when a payload has been split due to size.
  partialResetMetrics(count) {
    const keys = Object.keys(this.assetsMap);
    for (let i = 0; i < count && i < keys.length; i++) {
      delete this.assetsMap[keys[i]];
    }
  }

  get track() {
    return Object.values(this.assetsMap).map((asset) => asset.track);
  }

  get shouldTrack() {
    return this.track.length > 0;
  }
}
