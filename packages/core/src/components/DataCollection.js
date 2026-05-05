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

import { logDebug } from "../constants/index.js";
import { throttle, deepCopy, getPayloadBytes } from "../utils/functionUtils.js";
import { LIB_VERSION } from "../constants/index.js";

// Reserve ~512 bytes for the alloy wrapper fields (xdm envelope, documentUnloading, etc.)
const MAX_PAYLOAD_BYTES = 50 * 1024 - 512;

export default class DataCollection {
  constructor(
    { experience, assets, alloyContentEvent, contentObservers },
    { throttleSendContentEvent, includeExperiences },
  ) {
    this.experience = experience;
    this.assets = assets;
    this.alloyContentEvent = alloyContentEvent;
    this.contentObservers = contentObservers;
    this.includeExperiences = includeExperiences;
    this.experienceIDAtLastReset = this.experience.experienceID.value;

    if (throttleSendContentEvent) {
      logDebug("Throttling sendContentEvent", throttleSendContentEvent);
      this.sendContentEvent = throttle(
        this.sendContentEvent.bind(this),
        throttleSendContentEvent,
      );
    }
    this.assets.onAssetsLengthExceeded(() => this.sendContentEvent());
    this.contentObservers.registerObservers();
    this.registerPageListeners();
  }

  sendContentEvent(xdm = {}) {
    if (!this.shouldTrack) return false;

    let isFirstBatch = true;

    do {
      const assets = this.assets.track;
      const track = this.buildTrack(assets);

      if (getPayloadBytes(track) <= MAX_PAYLOAD_BYTES) {
        this.alloyContentEvent.sendContentEvent(
          track,
          isFirstBatch ? xdm : {},
        );
        this.resetMetrics();
      } else {
        // Binary-search for the largest asset slice that fits within the limit.
        // Force at least 1 asset to guarantee progress even if a single asset
        // somehow exceeds the limit on its own.
        const count = Math.max(1, this.findFittingAssetCount(assets));
        logDebug(
          `Payload exceeds ${MAX_PAYLOAD_BYTES} bytes, splitting at ${count} of ${assets.length} assets`,
        );
        this.alloyContentEvent.sendContentEvent(
          this.buildTrack(assets.slice(0, count)),
          isFirstBatch ? xdm : {},
        );
        this.assets.partialResetMetrics(count);
        if (isFirstBatch) this.experience.resetMetrics();
      }

      isFirstBatch = false;
    } while (this.shouldTrack);

    return true;
  }

  // Binary search: largest asset count whose serialised payload is ≤ MAX_PAYLOAD_BYTES.
  findFittingAssetCount(assets) {
    let lo = 0;
    let hi = assets.length;
    while (lo < hi) {
      const mid = lo + Math.ceil((hi - lo) / 2);
      if (
        getPayloadBytes(this.buildTrack(assets.slice(0, mid))) <=
        MAX_PAYLOAD_BYTES
      ) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }

  buildTrack(assets) {
    return {
      experienceContent: {
        ...(this.shouldTrackExperience && { experience: this.experience.track }),
        ...(assets.length > 0 && { assets }),
        implementationDetails: { version: LIB_VERSION },
      },
    };
  }

  registerPageListeners() {
    const onVisibilityShow = () => {
      this.resetMetrics();
    };
    const onVisibilityHide = () => {
      this.sendContentEvent();
    };
    const onURLChange = (targetURL) => {
      if (this.experience.isDifferent(targetURL)) {
        this.sendContentEvent();
        this.reset();
      }
    };

    // on url change
    window.addEventListener("popstate", () => {
      onURLChange(new URL(window.location));
    });
    window.history.pushState = new Proxy(window.history.pushState, {
      apply: (target, thisArg, argArray) => {
        const result = target.apply(thisArg, argArray);
        onURLChange(new URL(window.location));
        return result;
      },
    });
    window.history.replaceState = new Proxy(window.history.replaceState, {
      apply: (target, thisArg, argArray) => {
        const result = target.apply(thisArg, argArray);
        onURLChange(new URL(window.location));
        return result;
      },
    });
    // on visibility change
    const handleVisibilityChange = (event) => {
      if (event.target.visibilityState === "visible") {
        onVisibilityShow();
      } else {
        onVisibilityHide();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("pagehide", onVisibilityHide);
    document.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        logDebug("Page restored from bfcache, resetting to avoid stale assets");
        this.reset();
        this.contentObservers.registerObservers(true);
      } else {
        onVisibilityShow();
      }
    });
    // on close
    window.addEventListener("beforeunload", onVisibilityHide);
  }

  reset() {
    logDebug("Resetting data collection");
    this.contentObservers.cleanupObservers();
    this.experience.reset();
    this.assets.reset();
    this.contentObservers.registerObservers(false);
    this.experienceIDAtLastReset = this.experience.experienceID.value;
  }

  resetMetrics() {
    logDebug("Resetting data collection metrics");
    this.experience.resetMetrics();
    this.assets.resetMetrics();
  }

  get track() {
    return deepCopy(this.buildTrack(this.assets.track));
  }

  get shouldTrackExperience() {
    return this.includeExperiences && this.experience.shouldTrack;
  }

  get shouldTrackAssets() {
    return this.assets.shouldTrack;
  }

  get shouldTrack() {
    if (this.experience.shouldExclude) return false;
    return this.experience.shouldTrack || this.assets.shouldTrack;
  }
}
