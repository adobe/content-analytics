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

/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect } from "vitest";
import { getElementDataInfoSrc } from "../../../src/utils/domUtils.js";

describe("getElementDataInfoSrc", () => {
  it("should return sd.s from a valid data-info attribute", () => {
    const div = document.createElement("div");
    div.setAttribute(
      "data-info",
      JSON.stringify({
        sd: { s: "/content/dam/image.jpg", c: "0:1200", r: 0 },
        wm: "720",
        wd: "1800",
        wt: "1200",
      }),
    );

    expect(getElementDataInfoSrc(div)).toBe("/content/dam/image.jpg");
  });

  it("should return undefined when attribute is absent", () => {
    const div = document.createElement("div");

    expect(getElementDataInfoSrc(div)).toBeUndefined();
  });

  it("should return undefined when data-info is invalid JSON", () => {
    const div = document.createElement("div");
    div.setAttribute("data-info", "not-valid-json{");

    expect(getElementDataInfoSrc(div)).toBeUndefined();
  });

  it("should return undefined when sd is missing", () => {
    const div = document.createElement("div");
    div.setAttribute("data-info", JSON.stringify({ wm: "720" }));

    expect(getElementDataInfoSrc(div)).toBeUndefined();
  });

  it("should return undefined when sd.s is missing", () => {
    const div = document.createElement("div");
    div.setAttribute("data-info", JSON.stringify({ sd: { c: "0:1200" } }));

    expect(getElementDataInfoSrc(div)).toBeUndefined();
  });

  it("should return undefined when sd.s is an empty string", () => {
    const div = document.createElement("div");
    div.setAttribute("data-info", JSON.stringify({ sd: { s: "" } }));

    expect(getElementDataInfoSrc(div)).toBeUndefined();
  });

  it("should use a custom attribute name", () => {
    const div = document.createElement("div");
    div.setAttribute(
      "data-custom",
      JSON.stringify({ sd: { s: "/content/dam/custom.jpg" } }),
    );

    expect(getElementDataInfoSrc(div, "data-custom")).toBe(
      "/content/dam/custom.jpg",
    );
  });

  it("should not read from wrong attribute when custom name specified", () => {
    const div = document.createElement("div");
    div.setAttribute(
      "data-info",
      JSON.stringify({ sd: { s: "/content/dam/image.jpg" } }),
    );

    expect(getElementDataInfoSrc(div, "data-custom")).toBeUndefined();
  });
});
