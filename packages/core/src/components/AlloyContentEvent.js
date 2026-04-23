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

import { logDebug, logWarn } from "../constants/index.js";

export default class AlloyContentEvent {
  constructor({ datastreamId }) {
    this.datastreamId = datastreamId;
  }

  sendContentEvent(contentPayload, xdm = {}) {
    const alloyPayload = {
      documentUnloading: true,
      edgeConfigOverrides: {
        datastreamId: this.datastreamId,
        com_adobe_analytics: { enabled: false },
        com_adobe_target: { enabled: false },
      },
      xdm: {
        channel: "web",
        idSource: "ContentAnalytics",
        ...xdm,
        ...contentPayload,
        eventType: "content.contentEngagement",
      },
    };

    const instanceName = window.__alloyNS[0] || "alloy";

    logDebug("Sending content event", alloyPayload);
    logDebug("ACA payload stringified", JSON.stringify(alloyPayload));
    if (!window[instanceName]) {
      logWarn(
        `Alloy instance ${instanceName} not found, unable to send content event`,
        alloyPayload,
      );
    } else {
      window[instanceName]("sendEvent", alloyPayload)
        .then((response) => {
          logDebug("Content event sent successfully", response);
        })
        .catch((error) => {
          logDebug("Failed to send content event", error);
        });
    }
  }
}
