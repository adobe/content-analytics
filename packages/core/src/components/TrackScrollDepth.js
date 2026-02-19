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
import TrackGroup from "./TrackGroup.js";
import { throttle } from "../utils/functionUtils.js";
import {
  getScrollPixelDepth,
  getScrollPercentageDepth,
} from "../utils/domUtils.js";

export default class TrackScrollDepth {
  constructor(key) {
    this.key = key;
    this.verticalPercentageDepth = new TrackMeasure(
      "verticalPercentageDepth",
      0,
    );
    this.horizontalPercentageDepth = new TrackMeasure(
      "horizontalPercentageDepth",
      0,
    );
    this.verticalPixelDepth = new TrackMeasure("verticalPixelDepth", 0);
    this.horizontalPixelDepth = new TrackMeasure("horizontalPixelDepth", 0);
    this.metrics = new TrackGroup([
      this.verticalPercentageDepth,
      this.horizontalPercentageDepth,
      this.verticalPixelDepth,
      this.horizontalPixelDepth,
    ]);
    this.registerEventListeners();
    this.computeMetrics();
  }

  registerEventListeners() {
    const computeMetrics = this.computeMetrics.bind(this);
    document.addEventListener("scroll", throttle(computeMetrics, 250));
    document.addEventListener("scrollend", computeMetrics);
  }

  computeMetrics() {
    const { verticalPixelDepth, horizontalPixelDepth } = getScrollPixelDepth();
    const { verticalPercentageDepth, horizontalPercentageDepth } =
      getScrollPercentageDepth();
    this.verticalPercentageDepth.value = Math.max(
      verticalPercentageDepth,
      this.verticalPercentageDepth.value,
    );
    this.horizontalPercentageDepth.value = Math.max(
      horizontalPercentageDepth,
      this.horizontalPercentageDepth.value,
    );
    this.verticalPixelDepth.value = Math.max(
      verticalPixelDepth,
      this.verticalPixelDepth.value,
    );
    this.horizontalPixelDepth.value = Math.max(
      horizontalPixelDepth,
      this.horizontalPixelDepth.value,
    );
  }

  reset() {
    this.metrics.reset();
    this.computeMetrics();
  }

  get track() {
    return { [this.key]: this.metrics.track };
  }
}
