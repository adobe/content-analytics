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

import { execSync } from "child_process";
import { copyFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../../");
const standaloneScripts = path.resolve(
  repoRoot,
  "../aca_standalone_example/src/scripts",
);

export default async function globalSetup() {
  console.log("\nBuilding content-analytics for integration tests...");
  execSync("npm run build", { cwd: repoRoot, stdio: "inherit" });

  copyFileSync(
    path.join(repoRoot, "dist/content-analytics.min.js"),
    path.join(standaloneScripts, "content-analytics.min.js"),
  );
  console.log(
    "Copied dist/content-analytics.min.js → aca_standalone_example/src/scripts/\n",
  );
}
