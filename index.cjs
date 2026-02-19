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

// CommonJS entry point for development
// This allows the package to be required from CommonJS environments
// during development before the libEs5 build is created

const path = require("path");

// Use dynamic import to load the ESM module
let initializeContentLibrary;

// Export a function that calls the loaded module
module.exports = function (options) {
  if (!initializeContentLibrary) {
    // Synchronously load for first call (not ideal but necessary for require())
    // Use the built dist file if available
    const distPath = path.join(__dirname, "dist", "content-analytics.js");
    const fs = require("fs");

    if (fs.existsSync(distPath)) {
      // Use eval to load the IIFE build
      const code = fs.readFileSync(distPath, "utf-8");
      eval(code);
      if (typeof ContentAnalytics !== "undefined") {
        initializeContentLibrary = ContentAnalytics;
      }
    } else {
      throw new Error(
        '@adobe/content-analytics: Please run "npm run build" first.',
      );
    }
  }

  return initializeContentLibrary(options);
};

// Also export as default for compatibility
module.exports.default = module.exports;
