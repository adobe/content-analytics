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
import { getElementSrc } from "./domUtils.js";

// Content Utils
export const getDocumentLastModified = () => {
  const dateTimeFormatoptions = [
    "en-US",
    { month: "2-digit", day: "2-digit", year: "numeric" },
  ];
  const lastModified = document.lastModified;

  if (lastModified) {
    const [month, day, year] = new Intl.DateTimeFormat(...dateTimeFormatoptions)
      .format(new Date(lastModified))
      .split("/");
    return `${year}/${month}/${day}`;
  }

  return "unknown";
};

export const getExperiment = (url) => {
  if (!window.hlx) return url;

  // Check for campaigns, experiments, audiences
  let servedExperiencePathname = null;
  if (window.hlx.campaign && window.hlx.campaign.servedExperience) {
    servedExperiencePathname = window.hlx.campaign.servedExperience;
  } else if (window.hlx.experiment && window.hlx.experiment.servedExperience) {
    servedExperiencePathname = window.hlx.experiment.servedExperience;
  } else if (window.hlx.audience && window.hlx.audience.servedExperience) {
    servedExperiencePathname = window.hlx.audience.servedExperience;
  }

  if (servedExperiencePathname) {
    if (servedExperiencePathname.endsWith("index.plain.html")) {
      servedExperiencePathname = servedExperiencePathname.slice(0, -14);
    }
    if (servedExperiencePathname.endsWith(".plain.html")) {
      servedExperiencePathname = servedExperiencePathname.slice(0, -11);
    }

    url.pathname = servedExperiencePathname;
  }

  return url;
};

export const getExperienceSource = (url) => {
  const experienceSource = getExperiment(url) || url.href;
  return experienceSource;
};

export const getExperienceID = (url, { experienceConfigurations }) => {
  const experienceSource = getExperienceSource(url);
  const experienceID = new URL(experienceSource);

  // Check if customer provided experienceVersion is available
  let experienceVersion = "NoVersion";
  if (typeof window.adobe?.getContentExperienceVersion === "function") {
    const customerExpVer = window.adobe.getContentExperienceVersion();
    if (typeof customerExpVer === "string") {
      experienceVersion = customerExpVer;
    }
  }
  experienceID.searchParams.set("expVer", experienceVersion);
  // Filter out query params based on experience configurations
  if (experienceConfigurations) {
    if (experienceConfigurations.regEx !== undefined) {
      const allowedQueryParams = new Set();
      experienceConfigurations.forEach((config) => {
        if (config.regEx.test(url)) {
          config.paramsArray.forEach((param) => allowedQueryParams.add(param));
        }
      });
      allowedQueryParams.add("expVer");

      const queryParams = new URLSearchParams(experienceID.search);
      const filteredQParams = Array.from(queryParams).filter(([key]) =>
        allowedQueryParams.has(key),
      );

      experienceID.search = new URLSearchParams(filteredQParams).toString();
    }

    return experienceID.href;
  }
};

export const getElementHTMLPath = (element, depth = 25, _attributes = []) => {
  const path = [];
  const getClassesStr = _attributes.includes("class")
    ? (element) =>
        `.${(Array.from(element.classList.values()) || []).join(".")}`
    : () => "";
  const attributes = _attributes.filter((attr) => attr !== "class");
  let currentDepth = 0;
  let parent;
  while ((parent = element.parentNode)) {
    const tag = element.tagName.toLowerCase();
    const classStr = getClassesStr(element);
    const extraAttributes = attributes
      .map((attr) => {
        const value = element.getAttribute(attr);
        return value ? `[${attr}="${value}"]` : "";
      })
      .filter(Boolean)
      .join("");
    path.unshift(
      `${tag}${classStr}${extraAttributes}:nth-child(${
        1 + [].indexOf.call(parent.children, element)
      })`,
    );
    element = parent;
    if (++currentDepth >= depth) break;
  }
  return path;
};

export const joinHTMLPath = (path) => path.join(">");

export const getElementUID = (element) => {
  const htmlPath = getElementHTMLPath(element);
  const src = getElementSrc(element);
  const innerHTML = element.innerHTML.trim();
  const href = element.href;
  return [joinHTMLPath(htmlPath), src, href, innerHTML]
    .filter(Boolean)
    .join("");
};

export const stringToRegex = (str) => {
  if (!str) {
    return;
  }
  const [, ...parts] = str.match(/^\/((?:\\.|[^\\])*)\/(.*)$/) ?? [null, str];
  try {
    return RegExp(...parts);
  } catch (e) {
    logDebug(`Failed to convert string ${str} to a regular expression ${e}`);
    return e;
  }
};
