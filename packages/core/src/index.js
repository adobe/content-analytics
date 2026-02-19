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

import initializeContentLibrary from "./core/initializeContentLibrary.js";
import buildContentLibrarySettings from "./core/buildContentLibrarySettings.js";

// Main entry point for NPM package
export default initializeContentLibrary;

// Export for named imports
export { initializeContentLibrary, buildContentLibrarySettings };

// Export individual components for advanced usage
export { default as TrackValue } from "./components/TrackValue.js";
export { default as TrackGroup } from "./components/TrackGroup.js";
export { default as TrackMeasure } from "./components/TrackMeasure.js";
export { default as TrackScrollDepth } from "./components/TrackScrollDepth.js";
export { default as TrackAsset } from "./components/TrackAsset.js";
export { default as TrackExperienceAssets } from "./components/TrackExperienceAssets.js";
export { default as TrackExperience } from "./components/TrackExperience.js";
export { default as AlloyContentEvent } from "./components/AlloyContentEvent.js";
export { default as ContentObservers } from "./components/ContentObservers.js";
export { default as DataCollection } from "./components/DataCollection.js";
export { default as AlloyProcessEvent } from "./components/AlloyProcessEvent.js";
