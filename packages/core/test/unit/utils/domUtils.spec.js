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

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getElementDataInfoSrc,
  getElementSrc,
} from "../../../src/utils/domUtils.js";

describe("getElementSrc", () => {
  const ORIGINAL_URL = "http://localhost/";

  beforeEach(() => {
    window.happyDOM.setURL(
      "https://www.example.com/microtel/rooms-rates?brand_id=ALL&adults=2",
    );
  });

  afterEach(() => {
    window.happyDOM.setURL(ORIGINAL_URL);
  });

  it("returns undefined when src exactly equals the page URL", () => {
    const img = document.createElement("img");
    img.src =
      "https://www.example.com/microtel/rooms-rates?brand_id=ALL&adults=2";

    expect(getElementSrc(img)).toBeUndefined();
  });

  it("returns undefined when src matches origin+pathname but query string differs", () => {
    const img = document.createElement("img");
    img.src =
      "https://www.example.com/microtel/rooms-rates?checkInDate=04/24/2026";

    expect(getElementSrc(img)).toBeUndefined();
  });

  it("returns undefined when src matches origin+pathname but has a fragment", () => {
    const img = document.createElement("img");
    img.src = "https://www.example.com/microtel/rooms-rates#booking";

    expect(getElementSrc(img)).toBeUndefined();
  });

  it("returns undefined for an <img> with empty src attribute", () => {
    const img = document.createElement("img");
    img.setAttribute("src", "");

    expect(getElementSrc(img)).toBeUndefined();
  });

  it("returns the src for a legitimate image URL", () => {
    const img = document.createElement("img");
    img.src = "https://cdn.example.com/photo.jpg";

    expect(getElementSrc(img)).toBe("https://cdn.example.com/photo.jpg");
  });

  it("returns the src for a CDN image without an extension", () => {
    const img = document.createElement("img");
    img.src = "https://cdn.example.com/img/abc123";

    expect(getElementSrc(img)).toBe("https://cdn.example.com/img/abc123");
  });

  // Regression: real-world failure observed on Wyndham. Page has a fragment;
  // <img src=""> resolves to the page URL minus the fragment, so an exact-href
  // comparison missed it. The origin+pathname guard catches it.
  it("returns undefined when src is empty and page URL has a fragment", () => {
    window.happyDOM.setURL(
      "https://www.wyndhamhotels.com/es-xl/baymont/phoenix-arizona/baymont-inn-suites-phoenix-i-10-near-51st-ave/rooms-rates?lightbox=/content/whg-ecomm-responsive/es-la/whg/about-us/privacy-notice-more-info.display.html#photo-gallery-carousel562",
    );
    const img = document.createElement("img");
    img.setAttribute("src", "");

    expect(getElementSrc(img)).toBeUndefined();
  });
});

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
