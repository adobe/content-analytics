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

const getFirstAppMeasurementInstance = (s_c_il = []) => {
  if (s_c_il.length > 0) {
    for (let i = 0; i < s_c_il.length; i++) {
      const s = s_c_il[i];
      if (s._c === "s_c") {
        return s;
      }
    }
  }
  return null;
};

/**
 * Looks for first available AppMeasurement instance every 100ms until
 * timeout (default: 5sec) is reached.
 * @param {*} timeout
 * @returns
 */
export const waitForAppMeasurementInstance = (timeout = 5000) => {
  return new Promise((resolve, _reject) => {
    const s = getFirstAppMeasurementInstance(window.s_c_il);
    if (s) {
      resolve(s); // Resolve with the instance
      return;
    }
    const interval = setInterval(() => {
      const s = getFirstAppMeasurementInstance(window.s_c_il);
      if (s) {
        clearInterval(interval);
        resolve(s);
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      logDebug("Appmeasurement library not found");
    }, timeout);
  });
};
