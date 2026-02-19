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

const DEFAULT_TENANT_SCHEMA_NAME = "experienceContent";

/**
 * Builds the content library settings.
 *
 * @param {Object} turbine The turbine object.
 * @param {Object} settings The settings object.
 * @returns {Object} The content library settings.
 */
export default function buildContentLibrarySettings(turbine, settings) {
  const extensionSettings = settings || {};
  const environment = turbine.environment && turbine.environment.stage;
  let datastreamId = extensionSettings.datastreamProduction;
  if (environment === "development") {
    datastreamId = extensionSettings.datastreamDevelopment;
  } else if (environment === "staging") {
    datastreamId = extensionSettings.datastreamStaging;
  }
  if (!datastreamId) {
    turbine.logger.error(
      `No datastream ID provided for ${turbine.environment.stage} environment`,
    );
    return;
  }
  const librarySettings = {
    tenantSchemaName:
      extensionSettings.tenantSchemaName || DEFAULT_TENANT_SCHEMA_NAME,
    datastreamId,
    assetUrlQualifier: extensionSettings.assetUrlQualifier,
    pageUrlQualifier: extensionSettings.pageUrlQualifier,
    includeExperiences: extensionSettings.includeExperiences,
    experienceConfigurations: extensionSettings.experienceConfigurations,
  };
  return librarySettings;
}
