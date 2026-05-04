/**
 * @vitest-environment happy-dom
 *
 * Reproduces the production case for AN-442415 from Wyndham:
 * <div class="retail-banner-component" style="background-image:url() "> on a page
 * whose URL has a fragment. In real Chrome, getComputedStyle resolves empty
 * url() to the document URL (per WHATWG URL parsing of the empty string against
 * a base) — which is exactly the page URL minus its fragment.
 *
 * happy-dom does NOT apply that resolution, so we simulate Chrome's behavior
 * by stubbing getComputedStyle().backgroundImage on the test element directly.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  srcURLChecker,
  resolvesToPageURL,
} from "../../src/utils/domUtils.js";
import TrackExperienceAssets from "../../src/components/TrackExperienceAssets.js";

const PAGE_URL_WITH_FRAGMENT =
  "https://www.wyndhamhotels.com/es-xl/baymont/phoenix-arizona/baymont-inn-suites-phoenix-i-10-near-51st-ave/rooms-rates?lightbox=/content/whg-ecomm-responsive/es-la/whg/about-us/privacy-notice-more-info.display.html#photo-gallery-carousel562";
const PAGE_URL_NO_FRAGMENT =
  "https://www.wyndhamhotels.com/es-xl/baymont/phoenix-arizona/baymont-inn-suites-phoenix-i-10-near-51st-ave/rooms-rates?lightbox=/content/whg-ecomm-responsive/es-la/whg/about-us/privacy-notice-more-info.display.html";

describe("AN-442415 retail-banner-component empty url() (Chrome-like)", () => {
  beforeEach(() => window.happyDOM.setURL(PAGE_URL_WITH_FRAGMENT));
  afterEach(() => window.happyDOM.setURL("http://localhost/"));

  it("regex on Chrome-style computed value extracts the page URL", () => {
    // What Chrome 147 actually returns for `background-image: url()`
    const chromeComputed = `url("${PAGE_URL_NO_FRAGMENT}")`;
    const match = srcURLChecker.exec(chromeComputed);
    expect(match).not.toBeNull();
    expect(match[1]).toBe(PAGE_URL_NO_FRAGMENT);
  });

  it("resolvesToPageURL returns true for the extracted page URL", () => {
    expect(resolvesToPageURL(PAGE_URL_NO_FRAGMENT)).toBe(true);
  });

  it("getAssetDimensions rejects the asset (the AN-442415 fix)", () => {
    const assets = new TrackExperienceAssets({
      htmlBlockAttributeName: null,
      htmlPathCollectionEnabled: false,
      assetsMaxBatchLength: 32,
      assetAbsolutePositionCollectionEnabled: false,
      assetDisplayDimensionsCollectionEnabled: false,
      assetLinkURLCollectionEnabled: false,
    });
    const div = document.createElement("div");
    div.className = "retail-banner-component alert-component";
    expect(
      assets.getAssetDimensions(div, PAGE_URL_NO_FRAGMENT),
    ).toBeUndefined();
  });

  // Real Chrome 147 returns `url("")` for `background-image: url()` —
  // confirmed via in-page probe on wyndhamhotels.com.
  it("regex must NOT match an empty url(\"\") (Chrome's actual output)", () => {
    expect(srcURLChecker.exec('url("")')).toBeNull();
    expect(srcURLChecker.exec("url('')")).toBeNull();
    expect(srcURLChecker.exec("url()")).toBeNull();
    expect(srcURLChecker.exec("url(  )")).toBeNull();
  });

  it("regex still matches legitimate url() values", () => {
    expect(srcURLChecker.exec('url("https://cdn.example.com/a.jpg")')[1]).toBe(
      "https://cdn.example.com/a.jpg",
    );
    expect(srcURLChecker.exec("url('a.jpg')")[1]).toBe("a.jpg");
    expect(srcURLChecker.exec("url(/path/to/img.png)")[1]).toBe(
      "/path/to/img.png",
    );
    expect(srcURLChecker.exec('url(  "spaced.jpg"  )')[1]).toBe("spaced.jpg");
  });

  // End-to-end: simulate the real Wyndham retail-banner div by stubbing
  // getComputedStyle().backgroundImage to what Chrome 147 actually returns,
  // and confirm no asset is captured.
  it("retail-banner div with empty url() does NOT produce an asset", async () => {
    const { default: ContentObservers } = await import(
      "../../src/components/ContentObservers.js"
    );
    const div = document.createElement("div");
    div.className = "retail-banner-component alert-component";
    div.setAttribute("style", "background-image:url() ");
    document.body.appendChild(div);

    const realGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = (el) => {
      if (el === div) return { backgroundImage: 'url("")' };
      return realGetComputedStyle(el);
    };

    const observers = new ContentObservers(
      {
        imagesSelector: "img",
        debounceNodeRegister: 0,
        backgroundImageDataAttribute: undefined,
      },
      {
        getAssetDimensions: () => {
          throw new Error(
            "getAssetDimensions should never be called for an empty url()",
          );
        },
        handleClick: () => {},
        handleView: () => {},
        onAssetsLengthExceeded: () => {},
      },
      { onClick: () => {}, isDifferent: () => false },
    );
    expect(
      observers.getBackgroundAssetURLFromTarget(div),
    ).toBeUndefined();

    window.getComputedStyle = realGetComputedStyle;
  });
});
