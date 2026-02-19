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

import { describe, it, expect } from "vitest";
import TrackValue from "../../../src/components/TrackValue.js";

describe("TrackValue", () => {
  it("should initialize with a static value", () => {
    const trackValue = new TrackValue("testKey", "testValue");
    expect(trackValue.value).toBe("testValue");
    expect(trackValue.key).toBe("testKey");
  });

  it("should initialize with a function value", () => {
    const trackValue = new TrackValue("testKey", () => "dynamicValue");
    expect(trackValue.value).toBe("dynamicValue");
  });

  it("should update value via setter", () => {
    const trackValue = new TrackValue("testKey", "initialValue");
    trackValue.value = "newValue";
    expect(trackValue.value).toBe("newValue");
  });

  it("should reset to initial static value", () => {
    const trackValue = new TrackValue("testKey", "initialValue");
    trackValue.value = "changedValue";
    trackValue.reset();
    expect(trackValue.value).toBe("initialValue");
  });

  it("should reset to initial function value", () => {
    let counter = 0;
    const trackValue = new TrackValue("testKey", () => ++counter);
    expect(trackValue.value).toBe(1);
    trackValue.reset();
    expect(trackValue.value).toBe(2);
  });

  it("should return correct track object", () => {
    const trackValue = new TrackValue("myKey", "myValue");
    expect(trackValue.track).toEqual({ myKey: "myValue" });
  });
});
