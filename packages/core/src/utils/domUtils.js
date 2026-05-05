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

import { clampPercentage } from "./functionUtils.js";

// Utils
export const isEventTrusted = (event) => event && event.isTrusted;

export const getElementStyle = (element) =>
  element.currentStyle || window.getComputedStyle(element, false);

export const isImageElement = (element) => element.tagName === "IMG";

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/complete
export const isImageLoaded = (element) => element.complete;

// True when `src` resolves to the same origin+pathname as the current page,
// regardless of query string or fragment. Used to reject `<img>` elements whose
// resolved URL is the page itself (e.g. empty src, or src set against a stale
// SPA route) — those would otherwise be reported as image assets.
export const resolvesToPageURL = (src) => {
  try {
    const resolved = new URL(src, window.location.href);
    return (
      resolved.origin === window.location.origin &&
      resolved.pathname === window.location.pathname
    );
  } catch {
    return false;
  }
};

export const getElementSrc = (element) => {
  const src = element.currentSrc || element.src || element.getAttribute("src");
  if (!src) return undefined;
  return resolvesToPageURL(src) ? undefined : src;
};

// Extracts the URL from a CSS `url(...)` value. Capture requires at least one
// character that isn't whitespace, quote, or paren — so empty `url()` and
// `url("")` correctly fail to match instead of yielding a stray `"` (AN-442415:
// those cases produced phantom asset entries that resolved against the page
// URL to e.g. `<page-pathname-stripped>/%22`).
export const srcURLChecker = /url\(\s*['"]?([^\s'"()]+)['"]?\s*\)/i;

export const isBackgroundImageElement = (element) =>
  getElementBackgroundImage(element) !== "none";

export const getElementBackgroundImage = (element) =>
  getElementStyle(element).backgroundImage;

export const isSrcBase64 = (src) => src.startsWith("data:image/");

export const getElementDataInfoSrc = (element, attribute = "data-info") => {
  const dataInfo = element.getAttribute(attribute);
  if (!dataInfo) return undefined;
  try {
    const parsed = JSON.parse(dataInfo);
    return parsed?.sd?.s || undefined;
  } catch (e) {
    return undefined;
  }
};

export const isSrcSVG = (src) => src.endsWith(".svg");

export const urlHasPathname = (url) => url.pathname && url.pathname !== "/";

export const addTimestampMs = (timestamp = new Date().toISOString(), delta) => {
  return new Date(new Date(timestamp).getTime() + delta).toISOString();
};

export const getElementDisplayHeight = (el) => el.clientHeight;

export const getElementDisplayWidth = (el) => el.clientWidth;

export const getElementAbsoluteOffset = (el) => {
  let top = 0;
  let left = 0;
  while (el !== null) {
    top += el.offsetTop;
    left += el.offsetLeft;
    el = el.offsetParent;
  }
  return { top, left };
};

export const getScrollPercentageDepth = () => {
  const documentElement = document.documentElement;
  const body = document.body || {};
  const scrollableHeight =
    (documentElement.scrollHeight || body.scrollHeight || 0) -
    documentElement.clientHeight;
  const verticalPercentageDepth =
    scrollableHeight <= 0
      ? 100
      : ((window.pageYOffset ||
          documentElement.scrollTop ||
          body.scrollTop ||
          0) /
          scrollableHeight) *
          100 || 0;
  const scrollableWidth =
    (documentElement.scrollWidth || body.scrollWidth || 0) -
    documentElement.clientWidth;
  const horizontalPercentageDepth =
    scrollableWidth <= 0
      ? 100
      : ((window.pageXOffset ||
          documentElement.scrollLeft ||
          body.scrollLeft ||
          0) /
          scrollableWidth) *
          100 || 0;
  return {
    verticalPercentageDepth: clampPercentage(verticalPercentageDepth, 0, 100),
    horizontalPercentageDepth: clampPercentage(
      horizontalPercentageDepth,
      0,
      100,
    ),
  };
};

export const getScrollPixelDepth = () => {
  const documentElement = document.documentElement;
  const body = document.body || {};
  const verticalPixelDepth =
    (window.pageYOffset || documentElement.scrollTop || body.scrollTop || 0) +
    documentElement.clientHeight;
  const horizontalPixelDepth =
    (window.pageXOffset || documentElement.scrollLeft || body.scrollLeft || 0) +
    documentElement.clientWidth;
  return { verticalPixelDepth, horizontalPixelDepth };
};
