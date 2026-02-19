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
import { pipeFnsWhile } from "../utils/functionUtils.js";
import { addTimestampMs } from "../utils/domUtils.js";

export default class AlloyProcessEvent {
  constructor(
    dataCollection,
    { deferAlloyProcessEventUntil, sendContentEventBefore },
  ) {
    this.dataCollection = dataCollection;
    this.forwardAlloyFnsWhile = [];

    // wait for event type before listening to alloy forward events
    if (deferAlloyProcessEventUntil) {
      const checkDeferAlloyProcessEventUntil = (content) => {
        const hasWaitedForEventType = deferAlloyProcessEventUntil(content);
        if (hasWaitedForEventType) {
          logDebug("Starting to process alloy events");
          this.forwardAlloyFnsWhile.shift(); // removes itself from the array
          return true;
        }
        return false;
      };

      this.forwardAlloyFnsWhile.push(checkDeferAlloyProcessEventUntil);
    }

    // custom check for sending content event before certain event types
    if (sendContentEventBefore) {
      const checkSendContentEventBefore = (content) => {
        if (sendContentEventBefore(content)) {
          logDebug("Sending content event before", content.xdm.eventType);
          // Subtract 1 ms to ensure content event is sent before behavior event
          const timestamp = addTimestampMs(content.xdm.timestamp, -1);
          this.dataCollection.sendContentEvent({ timestamp });
          return false;
        }
        return true;
      };
      this.forwardAlloyFnsWhile.push(checkSendContentEventBefore);
    }
  }

  processEvent(content) {
    pipeFnsWhile(this.forwardAlloyFnsWhile, content);
  }
}
