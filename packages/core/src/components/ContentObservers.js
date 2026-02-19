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
import { debounce } from "../utils/functionUtils.js";
import {
  isImageElement,
  isImageLoaded,
  isBackgroundImageElement,
  getElementBackgroundImage,
  getElementSrc,
  srcURLChecker,
} from "../utils/domUtils.js";

export default class ContentObservers {
  constructor(
    { experience, assets },
    { imagesSelector, debounceNodeRegister },
  ) {
    this.experience = experience;
    this.assets = assets;
    document.addEventListener("click", this.onClick.bind(this), true);
    if (debounceNodeRegister) {
      logDebug(
        "Registering Intersection Observer with debounce",
        debounceNodeRegister,
      );
      this.registerImageIntersectionObserver = debounce(
        this.registerImageIntersectionObserver.bind(this),
        debounceNodeRegister,
      );
    }
    this.imagesSelector = imagesSelector;
    this.initObservers();
  }

  initObservers() {
    this.imagesIntersectionObserver = window.IntersectionObserver
      ? new IntersectionObserver(
          (entries, observer) => {
            entries
              .filter((entry) => entry.isIntersecting)
              .forEach((entry) => {
                const target = entry.target;
                let asset;
                if (isImageElement(target)) {
                  asset = this.assets.getAssetDimensions(
                    target,
                    getElementSrc(target),
                  );
                } else if (isBackgroundImageElement(target)) {
                  asset = this.assets.getAssetDimensions(
                    target,
                    this.getBackgroundAssetURLFromTarget(target),
                  );
                }
                if (asset) {
                  this.assets.handleView(asset);
                  observer.unobserve(target);
                }
              });
          },
          { threshold: 0.5 },
        )
      : {
          observe: () => {},
          disconnect: () => {},
        };

    this.mutationObserver = window.MutationObserver
      ? new MutationObserver((entries) => {
          entries.forEach((entry) => {
            const target = entry.target;
            if (entry.type == "childList" && entry.addedNodes.length > 0) {
              for (const addedNode of entry.addedNodes) {
                this.registerImagesIntersectionObserversFromTarget(addedNode);
              }
            } else if (entry.type === "attributes") {
              this.registerImageIntersectionObserver(target);
            }
          });
        })
      : {
          observe: () => {},
          disconnect: () => {},
        };
  }

  registerObservers() {
    this.registerImagesIntersectionObserversFromTarget(document.body);
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "currentSrc"],
    });
  }

  cleanupObservers() {
    this.imagesIntersectionObserver.disconnect();
    this.mutationObserver.disconnect();
  }

  registerImageIntersectionObserver(element) {
    if (isImageElement(element)) {
      if (isImageLoaded(element)) {
        this.imagesIntersectionObserver.observe(element);
      } else {
        const onImgLoad = (event) => {
          const element = event.target;
          this.imagesIntersectionObserver.observe(element);
          element.removeEventListener("load", onImgLoad);
        };
        element.addEventListener("load", onImgLoad);
      }
    } else if (isBackgroundImageElement(element)) {
      this.imagesIntersectionObserver.observe(element);
    }
  }

  getBackgroundImages(target) {
    const backgroundImages = Array.from(
      Array.from(target.querySelectorAll("*")).reduce((collection, node) => {
        const match = srcURLChecker.exec(getElementBackgroundImage(node));
        if (match) {
          collection.add({ assetURL: match[1], node });
        }
        return collection;
      }, new Set()),
    );

    if (isBackgroundImageElement(target)) {
      const match = srcURLChecker.exec(getElementBackgroundImage(target));
      if (match) {
        backgroundImages.push({ assetURL: match[1], node: target });
      }
    }

    return backgroundImages;
  }

  getBackgroundAssetURLFromTarget(target) {
    const prop = getElementBackgroundImage(target);
    const match = srcURLChecker.exec(prop);
    if (match) {
      return match[1];
    }
  }

  getShadowDOMElements(target, selector) {
    const shadowElements = [];

    const traverseShadowDOM = (node) => {
      // Check if this node has a shadowRoot
      if (node.shadowRoot) {
        const shadowRootElements = node.shadowRoot.querySelectorAll(selector);
        shadowElements.push(...shadowRootElements);

        // Recursively check elements within the shadow root
        const allShadowElements = node.shadowRoot.querySelectorAll("*");
        Array.from(allShadowElements).forEach((shadowElement) => {
          traverseShadowDOM(shadowElement);
        });
      }

      // Check all child elements
      if (node.children) {
        Array.from(node.children).forEach((child) => {
          traverseShadowDOM(child);
        });
      }
    };

    traverseShadowDOM(target);
    return shadowElements;
  }

  getShadowDOMBackgroundImages(target) {
    const shadowBackgroundImages = [];

    const traverseShadowDOM = (node) => {
      // Check if this node has a shadowRoot
      if (node.shadowRoot) {
        // Get background images from shadow root elements
        const shadowRootBackgroundImages = Array.from(
          Array.from(node.shadowRoot.querySelectorAll("*")).reduce(
            (collection, shadowNode) => {
              const match = srcURLChecker.exec(
                getElementBackgroundImage(shadowNode),
              );
              if (match) {
                collection.add({ assetURL: match[1], node: shadowNode });
              }
              return collection;
            },
            new Set(),
          ),
        );
        shadowBackgroundImages.push(...shadowRootBackgroundImages);

        // Recursively check elements within the shadow root
        const allShadowElements = node.shadowRoot.querySelectorAll("*");
        Array.from(allShadowElements).forEach((shadowElement) => {
          traverseShadowDOM(shadowElement);
        });
      }

      // Check all child elements
      if (node.children) {
        Array.from(node.children).forEach((child) => {
          traverseShadowDOM(child);
        });
      }
    };

    traverseShadowDOM(target);
    return shadowBackgroundImages;
  }

  registerImagesIntersectionObserversFromTarget(target) {
    // filter by node type
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType#node.element_node
    if (target && !(target.nodeType === 1 || target.nodeType === 9)) return;
    const elements = target.querySelectorAll(this.imagesSelector);
    const backgroundImages = this.getBackgroundImages(target);

    // Get elements from shadow DOM as well
    const shadowElements = this.getShadowDOMElements(
      target,
      this.imagesSelector,
    );
    const shadowBackgroundImages = this.getShadowDOMBackgroundImages(target);

    Array.from(elements).forEach((element) => {
      this.registerImageIntersectionObserver(element);
    });

    backgroundImages.forEach((backgroundImage) => {
      this.registerImageIntersectionObserver(backgroundImage.node);
    });

    // Register shadow DOM elements
    shadowElements.forEach((element) => {
      this.registerImageIntersectionObserver(element);
    });

    shadowBackgroundImages.forEach((backgroundImage) => {
      this.registerImageIntersectionObserver(backgroundImage.node);
    });
  }

  findImagesInClickedElement(element, clickEvent = null) {
    const foundImages = [];

    // Check if the direct element is an image
    if (isImageElement(element)) {
      foundImages.push({
        element,
        type: "direct",
        src: getElementSrc(element),
      });
    }

    // Check if the direct element has a background image
    if (isBackgroundImageElement(element)) {
      foundImages.push({
        element,
        type: "background",
        src: this.getBackgroundAssetURLFromTarget(element),
      });
    }

    // Helper function to check if click coordinates overlap with element bounds
    const doesClickOverlapElement = (event, targetElement) => {
      if (!event || !event.clientX || !event.clientY) {
        return true; // Assume overlap if we don't have click coordinates
      }
      const rect = targetElement.getBoundingClientRect();
      return (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      );
    };

    // Check for child images in regular DOM with overlap detection
    const childImages = element.querySelectorAll(this.imagesSelector);
    Array.from(childImages).forEach((childImg) => {
      const overlapsClick = doesClickOverlapElement(clickEvent, childImg);
      if (overlapsClick) {
        foundImages.push({
          element: childImg,
          type: "child",
          src: getElementSrc(childImg),
        });
      }
    });

    // Check for child images in shadow DOM with overlap detection
    const shadowChildImages = this.getShadowDOMElements(
      element,
      this.imagesSelector,
    );
    shadowChildImages.forEach((shadowImg) => {
      const overlapsClick = doesClickOverlapElement(clickEvent, shadowImg);
      if (overlapsClick) {
        foundImages.push({
          element: shadowImg,
          type: "shadow-child",
          src: getElementSrc(shadowImg),
        });
      }
    });

    // Check for child background images in regular DOM with overlap detection
    const childBackgroundImages = this.getBackgroundImages(element);
    childBackgroundImages.forEach((bgImg) => {
      const overlapsClick = doesClickOverlapElement(clickEvent, bgImg.node);
      if (overlapsClick) {
        foundImages.push({
          element: bgImg.node,
          type: "child-background",
          src: bgImg.assetURL,
        });
      }
    });

    // Check for child background images in shadow DOM with overlap detection
    const shadowChildBackgroundImages =
      this.getShadowDOMBackgroundImages(element);
    shadowChildBackgroundImages.forEach((shadowBgImg) => {
      const overlapsClick = doesClickOverlapElement(
        clickEvent,
        shadowBgImg.node,
      );
      if (overlapsClick) {
        foundImages.push({
          element: shadowBgImg.node,
          type: "shadow-child-background",
          src: shadowBgImg.assetURL,
        });
      }
    });

    return foundImages;
  }

  onClick(event) {
    // TODO: test on Mobile
    if (!event || !event.isTrusted || !event.pointerType) return;
    const target = event.target;

    // experience click
    logDebug("Experience click", { event });
    this.experience.experienceClicks.add(1);

    // Enhanced image detection - find all images in the clicked element
    const foundImages = this.findImagesInClickedElement(target, event);

    if (foundImages.length > 0) {
      // Track all found images
      foundImages.forEach((imageInfo) => {
        const asset = this.assets.getAssetDimensions(
          imageInfo.element,
          imageInfo.src,
        );
        if (asset) {
          logDebug(`${imageInfo.type} image click`, {
            event,
            asset,
            type: imageInfo.type,
          });
          this.assets.handleClick(asset);
        }
      });
    } else {
      // Fallback to legacy parent-based detection for anchor/button containers
      const closestParent = target.closest("a") || target.closest("button");
      if (closestParent) {
        logDebug("Fallback: searching in closest anchor/button parent");
        const parentImages = this.findImagesInClickedElement(
          closestParent,
          event,
        );

        parentImages.forEach((imageInfo) => {
          const asset = this.assets.getAssetDimensions(
            imageInfo.element,
            imageInfo.src,
          );
          if (asset) {
            logDebug(`Parent container ${imageInfo.type} image click`, {
              event,
              asset,
              type: imageInfo.type,
            });
            this.assets.handleClick(asset);
          }
        });
      }
    }
  }
}
