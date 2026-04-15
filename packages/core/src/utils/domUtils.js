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

export const getElementSrc = (element) => {
  const src = element.currentSrc || element.src || element.getAttribute("src");
  return src === window.location.href ? undefined : src;
};

export const srcURLChecker = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i;

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
  const body = document.body;
  const verticalPercentageDepth =
    ((documentElement.scrollTop || body.scrollTop) /
      ((documentElement.scrollHeight || body.scrollHeight) -
        documentElement.clientHeight)) *
      100 || 0;
  const horizontalPercentageDepth =
    ((documentElement.scrollLeft || body.scrollLeft) /
      ((documentElement.scrollWidth || body.scrollWidth) -
        documentElement.clientWidth)) *
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
  const body = document.body;
  const verticalPixelDepth =
    (documentElement.scrollTop || body.scrollTop) +
    documentElement.clientHeight;
  const horizontalPixelDepth =
    (documentElement.scrollLeft || body.scrollLeft) +
    documentElement.clientWidth;
  return { verticalPixelDepth, horizontalPixelDepth };
};
