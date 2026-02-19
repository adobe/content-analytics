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

export const throttle = (callbackFn, limit) => {
  let wait = false;
  return (...args) => {
    if (!wait) {
      const result = callbackFn(...args);
      wait = true;
      setTimeout(() => {
        wait = false;
      }, limit);
      return result;
    }
  };
};

/**
 * Pipe functions while condition is true
 * @param {Array<Function>} fns
 * @param {any} arg
 * @returns {any}
 */
export const pipeFnsWhile = (fns, arg) => {
  return [...fns].reduce((acc, fn, i, arr) => {
    const result = fn(arg);
    if (!result) {
      arr.splice(i + 1); // Remove remaining functions from current position onwards
    }
    return acc;
  }, arg);
};

export const debounce = (fn, delay) => {
  const debounceArgsMap = new Map();
  return (element) => {
    const clearTimeoutFn = debounceArgsMap.get(element);
    if (!clearTimeoutFn) {
      debounceArgsMap.set(
        element,
        setTimeout(() => fn(element), delay),
      );
    } else {
      clearTimeout(clearTimeoutFn);
      debounceArgsMap.set(
        element,
        setTimeout(() => fn(element), delay),
      );
    }
  };
};

export const noop = () => {};

export const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const clampPercentage = (value) => clamp(value, 0, 100);
