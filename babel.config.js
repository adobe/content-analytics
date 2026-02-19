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

import { dirname } from "path";
import { fileURLToPath } from "url";

const cwd = dirname(fileURLToPath(import.meta.url));

const transformTemplateLiteralsPlugin = [
  "@babel/plugin-transform-template-literals",
  {
    loose: true,
  },
];
const versionPlugin = ["./scripts/helpers/versionBabelPlugin.cjs", { cwd }];

const transformModulesCommonjsPlugin = [
  "@babel/plugin-transform-modules-commonjs",
  {
    strict: true,
    noInterop: true,
  },
];

const npmIgnoreFiles = ["packages/core/src/standalone.js"];

export default {
  env: {
    rollup: {
      presets: [
        [
          "@babel/preset-env",
          {
            modules: false,
          },
        ],
      ],
      plugins: [transformTemplateLiteralsPlugin, versionPlugin],
    },
    npmEs5: {
      presets: [["@babel/preset-env"]],
      ignore: npmIgnoreFiles,
      plugins: [
        transformTemplateLiteralsPlugin,
        versionPlugin,
        transformModulesCommonjsPlugin,
      ],
    },
    npmEs6: {
      ignore: npmIgnoreFiles,
      plugins: [versionPlugin],
    },
  },
};
