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

import TrackValue from "./TrackValue.js";
import TrackGroup from "./TrackGroup.js";
import TrackMeasure from "./TrackMeasure.js";

export default class TrackAsset {
  constructor({
    assetID,
    assetLinkURL,
    assetHTMLPath,
    assetBlock,
    assetDisplayHeight,
    assetDisplayWidth,
    assetAbsoluteTop,
    assetAbsoluteLeft,
  }) {
    this.assetID = new TrackValue("assetID", assetID);
    this.assetLinkURL = new TrackValue("assetLinkURL", assetLinkURL);

    this.assetHTMLPath = new TrackValue("assetHTMLPath", assetHTMLPath);
    this.assetBlock = new TrackValue("assetBlock", assetBlock);

    this.assetDisplayHeight = new TrackValue(
      "assetDisplayHeight",
      assetDisplayHeight,
    );
    this.assetDisplayWidth = new TrackValue(
      "assetDisplayWidth",
      assetDisplayWidth,
    );

    this.assetAbsoluteTop = new TrackValue(
      "assetAbsoluteTop",
      assetAbsoluteTop,
    );
    this.assetAbsoluteLeft = new TrackValue(
      "assetAbsoluteLeft",
      assetAbsoluteLeft,
    );

    this.components = new TrackGroup([
      this.assetID,
      this.assetLinkURL,
      this.assetHTMLPath,
      this.assetBlock,
      this.assetDisplayHeight,
      this.assetDisplayWidth,
      this.assetAbsoluteTop,
      this.assetAbsoluteLeft,
    ]);
  }

  addView(value) {
    if (!this.assetViews) {
      this.assetViews = new TrackMeasure("assetViews", 0);
      this.components.push(this.assetViews);
    }
    this.assetViews.add(value);
  }

  addClick(value) {
    if (!this.assetClicks) {
      this.assetClicks = new TrackMeasure("assetClicks", 0);
      this.components.push(this.assetClicks);
    }
    this.assetClicks.add(value);
  }

  get track() {
    return this.components.track;
  }
}
