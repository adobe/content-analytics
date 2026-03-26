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

import { logDebug, logWarn, setDebugEnabled } from "../constants/index.js";
import TrackExperienceAssets from "../components/TrackExperienceAssets.js";
import TrackExperience from "../components/TrackExperience.js";
import AlloyContentEvent from "../components/AlloyContentEvent.js";
import ContentObservers from "../components/ContentObservers.js";
import DataCollection from "../components/DataCollection.js";
import AlloyProcessEvent from "../components/AlloyProcessEvent.js";
import { waitForAppMeasurementInstance } from "./appMeasurementHelper.js";
import { addTimestampMs } from "../utils/domUtils.js";
import { stringToRegex } from "../utils/contentUtils.js";

// Make sure monitors are initialized
window.__alloyMonitors = window.__alloyMonitors || [];

// Add callback to monitor for alloy events to forward to ACA
window.__alloyMonitors.push({
  onBeforeCommand(data) {
    if (
      data?.commandName === "sendEvent" &&
      data?.options?.xdm?.eventType !== "content.contentEngagement"
    ) {
      logDebug("onBeforeCommand FW event to ACA", data);
      window.adobeContentAnalytics?.forwardEvent(data.options);
    }
  },
});

const init = (options) => {
  const instanceName = window.__alloyNS[0] || "alloy";
  if (!window[instanceName]) {
    logWarn(
      `Alloy instance '${instanceName}' not initialized, cannot configure content analytics`,
    );
    return;
  }
  window[instanceName]("getLibraryInfo")
    .then((result) => {
      const libraryInfo = result.libraryInfo;
      setDebugEnabled(libraryInfo.configs.debugEnabled);
      logDebug("ACA Initializing");
      const assets = new TrackExperienceAssets(options);
      const experience = new TrackExperience(options);
      const alloyContentEvent = new AlloyContentEvent(options);
      const contentObservers = new ContentObservers(
        { assets, experience },
        options,
      );
      const dataCollection = new DataCollection(
        { assets, experience, contentObservers, alloyContentEvent },
        options,
      );
      const alloyProcessEvent = new AlloyProcessEvent(dataCollection, options);
      window.adobeContentAnalytics = {
        dataCollection,
        forwardEvent: alloyProcessEvent.processEvent.bind(alloyProcessEvent),
      };
      // Check for AppMeasurement instance to attach pre-track
      // callback that fires content event with earlier timestamp
      waitForAppMeasurementInstance()
        .then((s) => {
          logDebug("Found AppMeasurement instance: ", s.account);
          logDebug("Registering AppMeasurement pre-track callback");
          s.registerPreTrackCallback((_requestUrl) => {
            // TODO: Consider parsing the request URL ts parameter to get correct offline timestamps
            // For now just set the timestamp to the current time minus 1 second (time resolution in AA)
            let timestamp = new Date().toISOString();
            timestamp = addTimestampMs(timestamp, -1000);
            dataCollection.sendContentEvent({ timestamp });
          });
        })
        .catch((error) => {
          logDebug("AppMeasurement instance not found", error);
        });
    })
    .catch((error) => {
      logDebug(
        `Failed to get Alloy library info for instance '${instanceName}'`,
        error,
      );
    });
};

const buildExperienceConfigurations = (configurations) => {
  if (!configurations) {
    return;
  }
  return configurations.map((config) => ({
    ...config,
    regEx: stringToRegex(config.regEx),
  }));
};

export default function initializeContentLibrary(options = {}) {
  // Make sure shouldDeferAlloyProcessEventUntilPageViews is set to true by default
  // before evaluated in fullOptions
  options.shouldDeferAlloyProcessEventUntilPageViews =
    options.shouldDeferAlloyProcessEventUntilPageViews ?? true;

  const fullOptions = {
    datastreamId: options.datastreamId,
    // this will be deprecated, rely on html path
    htmlBlockAttributeName: options.htmlBlockAttributeName || "data-block-name",
    htmlPathCollectionEnabled: options.htmlPathCollectionEnabled || true,
    htmlPathAttributes: options.htmlPathAttributes || [
      "class",
      "role",
      "data-block-name",
    ],
    htmlPathDepth: options.htmlPathDepth || 25,
    assetAbsolutePositionCollectionEnabled:
      options.assetAbsolutePositionCollectionEnabled || true,
    assetDisplayDimensionsCollectionEnabled:
      options.assetDisplayDimensionsCollectionEnabled || true,
    assetLinkURLCollectionEnabled:
      options.assetLinkURLCollectionEnabled || true,
    assetsMaxBatchLength: options.assetsMaxBatchLength || 32,
    imagesSelector: options.imagesSelector || "img",
    debounceNodeRegister: options.debounceNodeRegister || 500,
    throttleSendContentEvent: options.throttleSendContentEvent || 500,
    sendContentEventBefore:
      options.sendContentEventBefore ||
      ((content) => {
        if (!options.shouldDeferAlloyProcessEventUntilPageViews) {
          return true;
        }
        // don't send ACA event before pageViews
        const isPageView =
          content?.xdm?.eventType === "web.webpagedetails.pageViews";
        if (!isPageView) {
          logDebug("Content Send Content Before Event", content);
        }
        return !isPageView;
      }),
    deferAlloyProcessEventUntil:
      options.deferAlloyProcessEventUntil ||
      ((content) => {
        if (options.shouldDeferAlloyProcessEventUntilPageViews) {
          return content?.xdm?.eventType === "web.webpagedetails.pageViews";
        }
        return true;
      }),
    excludeURLsFromTracking: options.excludeURLsFromTracking || [],
    scrollDepthCollectionEnabled: options.scrollDepthCollectionEnabled || true,
    assetUrlQualifier: stringToRegex(options.assetUrlQualifier),
    pageUrlQualifier: stringToRegex(options.pageUrlQualifier),
    experienceConfigurations: buildExperienceConfigurations(
      options.experienceConfigurations,
    ),
    includeExperiences: options.includeExperiences,
  };

  init(fullOptions);
}
