# @adobe/content-analytics

[![Build](https://github.com/adobe/content-analytics/actions/workflows/build.yml/badge.svg)](https://github.com/adobe/content-analytics/actions/workflows/build.yml)
[![npm](https://img.shields.io/bundlephobia/min/@adobe/content-analytics?logo=Adobe&style=flat-square)](https://www.npmjs.com/package/@adobe/content-analytics)
[![npm](https://img.shields.io/bundlephobia/minzip/@adobe/content-analytics?logo=Adobe&style=flat-square)](https://www.npmjs.com/package/@adobe/content-analytics)

Adobe Content Analytics Library — standardized collection of content interactions (page views, asset views, clicks, scroll depth) for reporting. The library sends content-related events to Adobe Experience Platform via the [Alloy Web SDK](https://experienceleague.adobe.com/docs/experience-platform/web-sdk/home.html). Use it when you want Content Analytics **without** Adobe Experience Platform Tags (Launch).

**Prerequisites:** Adobe Experience Platform Web SDK (Alloy) must be initialized on the page before calling `initializeContentLibrary`.

## Installation

### npm package

```bash
npm install @adobe/content-analytics
```

```javascript
import initializeContentLibrary from "@adobe/content-analytics";
```

### Script tag (CDN)

Load the prebuilt standalone bundle **after** Alloy is initialized:

```html
<!-- 1. Load and configure Alloy first -->
<script src="https://cdn1.adoberesources.net/alloy/2.x.x/alloy.min.js"></script>
<script>
  alloy("configure", {
    datastreamId: "YOUR_DATASTREAM_ID",
    orgId: "YOUR_ORG_ID@AdobeOrg",
  });
</script>

<!-- 2. Load Content Analytics (pin the version in production if you prefer) -->
<script src="https://unpkg.com/@adobe/content-analytics@1.0.52/dist/content-analytics.min.js"></script>
<script>
  window.contentAnalytics({
    datastreamId: "YOUR_DATASTREAM_ID",
  });
</script>
```

The standalone build exposes `window.contentAnalytics` as the initialization function (same behavior as the default export from npm).

## Quick start

```javascript
import initializeContentLibrary from "@adobe/content-analytics";

initializeContentLibrary({
  datastreamId: "your-datastream-id",
  includeExperiences: true,
});
```

## Datastream configuration

The `datastreamId` option is required and must reference a datastream that has the Experience Platform service configured with an enabled Content Analytics experience event dataset. Ensure the sandbox associated with the datastream is not already associated with another Content Analytics setup.

You can supply separate datastream IDs per environment:

```javascript
initializeContentLibrary({
  datastreamId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // production
  stagingDatastreamId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // optional
  developmentDatastreamId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // optional
});
```

## Experience capture and definition

Enable experience tracking and control how experiences are identified on your website. Experiences are defined by combining a **domain regular expression** with optional **query parameters** that distinguish one experience from another within matching pages.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeExperiences` | boolean | `false` | Enable page/experience view tracking |
| `experienceConfigurations` | array | — | Define experiences by domain regex and query parameters |
| `htmlPathCollectionEnabled` | boolean | `true` | Collect DOM HTML path for assets |
| `htmlPathAttributes` | array | `["class","role","data-block-name"]` | HTML attributes included in DOM path |
| `htmlPathDepth` | number | `25` | Maximum DOM depth for HTML path collection |
| `imagesSelector` | string | `"img"` | CSS selector identifying trackable assets |

Each entry in `experienceConfigurations` accepts:

| Property | Type | Description |
|----------|------|-------------|
| `regEx` | string | Domain regular expression matched against the page URL (e.g. `^(?!.*\b(store\|help\|admin)\b)`) |
| `queryParameters` | array | Query parameter names whose values distinguish experiences on matching pages (e.g. `["outdoors", "patio", "kitchen"]`) |

**Example — domain regex and query parameters:**

```javascript
initializeContentLibrary({
  datastreamId: "YOUR_DATASTREAM_ID",
  includeExperiences: true,
  experienceConfigurations: [
    {
      regEx: "^https://www\\.example\\.com/products",
      queryParameters: ["category", "collection"],
    },
    {
      regEx: "^https://www\\.example\\.com/blog",
      queryParameters: [],
    },
  ],
});
```

## Event filtering

Control which page URLs and asset URLs are included in data collection using regular expressions. Validate patterns with a regex tester before deployment.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pageUrlQualifier` | string (regex) | — | Only track pages whose URL matches this pattern |
| `assetUrlQualifier` | string (regex) | — | Only track assets whose URL matches this pattern |
| `excludeURLsFromTracking` | array | `[]` | List of URL strings to exclude from tracking |

**Example — excluding documentation and scoping to product images:**

```javascript
initializeContentLibrary({
  datastreamId: "YOUR_DATASTREAM_ID",
  pageUrlQualifier: "^(?!.*\\/documentation).*",
  assetUrlQualifier: ".*\\/products\\/.*\\.(?:jpg|png|webp)",
  excludeURLsFromTracking: [
    "https://www.example.com/internal",
    "https://www.example.com/staging",
  ],
});
```

## Additional options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `datastreamId` | string | **required** | AEP datastream ID (see [Datastream configuration](#datastream-configuration)) |
| `scrollDepthCollectionEnabled` | boolean | `true` | Track scroll depth |
| `assetsMaxBatchLength` | number | `32` | Max assets before auto-send |
| `debounceNodeRegister` | number | `500` | Debounce for DOM observation (ms) |
| `throttleSendContentEvent` | number | `500` | Throttle for event sending (ms) |

## Requirements

- Adobe Experience Platform Web SDK (Alloy) must be initialized
- Modern browser with `IntersectionObserver` and `MutationObserver` support

## Development

```bash
npm install
npm test
npm run build
npm run lint
```

## Contributing

Contributions are welcome! See [Contributing Guide](.github/CONTRIBUTING.md) for more information.

## License

Apache-2.0. See [LICENSE](LICENSE) for details.
