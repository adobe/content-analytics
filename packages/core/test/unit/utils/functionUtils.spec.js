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

import { describe, it, expect, vi } from "vitest";
import {
  throttle,
  deepCopy,
  clamp,
  clampPercentage,
  noop,
  pipeFnsWhile,
} from "../../../src/utils/functionUtils.js";

describe("functionUtils", () => {
  describe("throttle", () => {
    it("should throttle function calls", async () => {
      const mockFn = vi.fn();
      const throttled = throttle(mockFn, 100);

      throttled();
      throttled();
      throttled();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("deepCopy", () => {
    it("should create a deep copy of an object", () => {
      const original = { a: 1, b: { c: 2 } };
      const copy = deepCopy(original);

      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
      expect(copy.b).not.toBe(original.b);
    });
  });

  describe("clamp", () => {
    it("should clamp value within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe("clampPercentage", () => {
    it("should clamp percentage between 0 and 100", () => {
      expect(clampPercentage(50)).toBe(50);
      expect(clampPercentage(-10)).toBe(0);
      expect(clampPercentage(150)).toBe(100);
    });
  });

  describe("noop", () => {
    it("should do nothing and return undefined", () => {
      expect(noop()).toBeUndefined();
    });
  });

  describe("pipeFnsWhile", () => {
    it("should execute all functions when all return true", () => {
      const fn1 = vi.fn(() => true);
      const fn2 = vi.fn(() => true);
      const fn3 = vi.fn(() => true);
      const arg = { test: "value" };

      pipeFnsWhile([fn1, fn2, fn3], arg);

      expect(fn1).toHaveBeenCalledWith(arg);
      expect(fn2).toHaveBeenCalledWith(arg);
      expect(fn3).toHaveBeenCalledWith(arg);
    });

    it("should stop executing when a function returns false", () => {
      const fn1 = vi.fn(() => true);
      const fn2 = vi.fn(() => false);
      const fn3 = vi.fn(() => true);
      const arg = { test: "value" };

      pipeFnsWhile([fn1, fn2, fn3], arg);

      expect(fn1).toHaveBeenCalledWith(arg);
      expect(fn2).toHaveBeenCalledWith(arg);
      expect(fn3).not.toHaveBeenCalled();
    });

    it("should stop on the first function that returns false", () => {
      const fn1 = vi.fn(() => false);
      const fn2 = vi.fn(() => true);
      const fn3 = vi.fn(() => true);
      const arg = { test: "value" };

      pipeFnsWhile([fn1, fn2, fn3], arg);

      expect(fn1).toHaveBeenCalledWith(arg);
      expect(fn2).not.toHaveBeenCalled();
      expect(fn3).not.toHaveBeenCalled();
    });

    it("should return true when all functions return truthy", () => {
      const fn1 = vi.fn(() => true);
      const fn2 = vi.fn(() => true);
      const arg = { test: "value" };

      const result = pipeFnsWhile([fn1, fn2], arg);

      expect(result).toBe(true);
    });

    it("should return false when a function returns falsy", () => {
      const fn1 = vi.fn(() => true);
      const fn2 = vi.fn(() => false);
      const arg = { test: "value" };

      const result = pipeFnsWhile([fn1, fn2], arg);

      expect(result).toBe(false);
    });

    it("should work with empty function array", () => {
      const arg = { test: "value" };
      const result = pipeFnsWhile([], arg);

      expect(result).toBe(true);
    });
  });
});
