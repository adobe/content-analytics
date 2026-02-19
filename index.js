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

// Development entry point for CommonJS
// Loads the built IIFE distribution file

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const distPath = path.join(__dirname, "dist", "content-analytics.js");

if (!fs.existsSync(distPath)) {
  throw new Error(
    '@adobe/content-analytics: Build files not found. Please run "npm run build" first.\n' +
      "Run: cd " +
      __dirname +
      " && npm run build",
  );
}

// Read the IIFE build
const code = fs.readFileSync(distPath, "utf-8");

// Create a sandbox context and run the code
const sandbox = {
  window: {},
  console: console,
  document: {},
  IntersectionObserver: undefined,
  MutationObserver: undefined,
  setTimeout: setTimeout,
  setInterval: setInterval,
  clearTimeout: clearTimeout,
  clearInterval: clearInterval,
  URL: global.URL || function () {},
  Intl: global.Intl,
  RegExp: RegExp,
  Date: Date,
  Math: Math,
  JSON: JSON,
  Array: Array,
  Object: Object,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Set: Set,
  Map: Map,
  Promise: Promise,
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox);

// The IIFE assigns to `var ContentAnalytics` in the global scope
// In the browser build, it also assigns to window.contentAnalytics
const ContentAnalytics =
  sandbox.ContentAnalytics || sandbox.window.contentAnalytics;

if (!ContentAnalytics) {
  throw new Error(
    "@adobe/content-analytics: Failed to load the library from dist file.",
  );
}

// Export for CommonJS
module.exports = ContentAnalytics;
module.exports.default = ContentAnalytics;
