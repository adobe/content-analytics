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
import { throttle, deepCopy } from "../utils/functionUtils.js";
import { LIB_VERSION } from "../constants/index.js";

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
    if (this.experience.experienceID.value !== this.experienceIDAtLastReset) {
      logDebug(
        "Experience changed since last reset, clearing stale assets",
        this.experienceIDAtLastReset,
        "->",
        this.experience.experienceID.value,
      );
      this.reset();
    }
    if (this.shouldTrack) {
      this.alloyContentEvent.sendContentEvent(this.track, xdm);
      this.resetMetrics();
      return true;
    }
    return false;
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
    const payload = {
      experienceContent: {
        ...(this.shouldTrackExperience && {
          experience: this.experience.track,
        }),
        ...(this.shouldTrackAssets && { assets: this.assets.track }),
        implementationDetails: { version: LIB_VERSION },
      },
    };

    return deepCopy(payload);
  }

  get shouldTrackExperience() {
    return this.includeExperiences && this.experience.shouldTrack;
  }

  get shouldTrackAssets() {
    return this.assets.shouldTrack;
  }

  get shouldTrack() {
    return this.experience.shouldTrack || this.assets.shouldTrack;
  }
}
