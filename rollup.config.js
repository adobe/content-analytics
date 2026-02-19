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

import path from "path";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import license from "rollup-plugin-license";
import { fileURLToPath } from "url";

const STANDALONE = "STANDALONE";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const buildPlugins = ({ minify, babelPlugins }) => {
  const plugins = [
    resolve({
      preferBuiltins: false,
      mainFields: ["module", "main", "browser"],
    }),
    commonjs(),
    babel({
      envName: "rollup",
      babelHelpers: "bundled",
      configFile: path.resolve(dirname, "babel.config.js"),
      plugins: babelPlugins,
    }),
  ];

  if (minify) {
    plugins.push(terser());
  }

  plugins.push(
    license({
      cwd: dirname,
      banner: {
        content: {
          file: path.join(dirname, "LICENSE_BANNER"),
        },
      },
    }),
  );

  return plugins;
};

export const buildConfig = ({
  minify = false,
  babelPlugins = [],
  input = `${dirname}/packages/core/src/standalone.js`,
  file,
}) => {
  const plugins = buildPlugins({ minify, babelPlugins });
  const minifiedExtension = minify ? ".min" : "";

  return {
    input,
    output: [
      {
        file: file || `dist/content-analytics${minifiedExtension}.js`,
        format: "iife",
        name: "ContentAnalytics",
      },
    ],
    plugins,
  };
};

const config = [];

const addConfig = (variant) => {
  if (process.env[variant]) {
    config.push(buildConfig({ minify: false }));
  }
  if (process.env[`${variant}_MIN`]) {
    config.push(buildConfig({ minify: true }));
  }
};

addConfig(STANDALONE);

export default config;
