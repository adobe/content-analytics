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

import TrackMeasure from "./TrackMeasure.js";
import TrackValue from "./TrackValue.js";
import TrackGroup from "./TrackGroup.js";
import TrackScrollDepth from "./TrackScrollDepth.js";
import { getExperienceID } from "../utils/contentUtils.js";
import { logDebug } from "../constants/index.js";

export default class TrackExperience {
  constructor({
    scrollDepthCollectionEnabled,
    pageUrlQualifier,
    excludeURLsFromTracking,
    includeExperiences,
    experienceConfigurations,
  }) {
    this.scrollDepthCollectionEnabled = scrollDepthCollectionEnabled;
    this.pageUrlQualifier = pageUrlQualifier;
    this.excludeURLsFromTracking = excludeURLsFromTracking;
    this.includeExperiences = includeExperiences;
    this.experienceConfigurations = experienceConfigurations;

    // metrics
    this.experienceViews = new TrackMeasure("experienceViews", 0);
    this.experienceClicks = new TrackMeasure("experienceClicks", 0);
    this.metrics = new TrackGroup([
      this.experienceViews,
      this.experienceClicks,
    ]);
    if (scrollDepthCollectionEnabled) {
      const scrollDepthMetrics = new TrackScrollDepth("experienceScroll");
      this.metrics.push(scrollDepthMetrics);
    }

    // dimensions
    // We don't send both experienceID and experienceSource since they are almost the same, we add a few query params to create unique experienceID on top of experienceSource
    this.experienceID = new TrackValue("experienceID", () =>
      getExperienceID(new URL(window.location), {
        experienceConfigurations: this.experienceConfigurations,
      }),
    );

    this.experienceChannel = new TrackValue("experienceChannel", "web");
    this.dimensions = new TrackGroup([
      this.experienceID,
      this.experienceChannel,
    ]);

    // init metrics
    this.experienceViews.value = 1;
  }

  reset() {
    this.dimensions.reset();
    this.resetMetrics();
    this.experienceViews.value = 1;
  }

  resetMetrics() {
    this.metrics.reset();
  }

  get shouldExclude() {
    const url = this.experienceID.value;

    if (
      this.excludeURLsFromTracking?.length &&
      this.excludeURLsFromTracking.some((excluded) => url.startsWith(excluded))
    ) {
      logDebug("Excluded URL from tracking", url);
      return true;
    }

    if (!this.pageUrlQualifier) {
      return false;
    }
    // Exclude experience if pageUrlQualifier is set and experienceID does not match
    const isExcluded = !this.pageUrlQualifier.test(url);
    if (isExcluded) {
      logDebug("Excluded experience from collection", url);
    }
    return isExcluded;
  }

  isDifferent(url) {
    const experienceID = getExperienceID(url, {
      experienceConfigurations: this.experienceConfigurations,
    });
    return this.experienceID.value !== experienceID;
  }

  get track() {
    return { ...this.metrics.track, ...this.dimensions.track };
  }

  // TODO: should we check for scroll metrics updates as well?
  get shouldTrack() {
    return (
      (this.track.experienceViews.value > 0 ||
        this.track.experienceClicks.value > 0) &&
      this.includeExperiences &&
      !this.shouldExclude
    );
  }
}
